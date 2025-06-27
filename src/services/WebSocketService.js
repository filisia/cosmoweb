import config from '../config';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = new Set();
    this.state = {
      connecting: false,
      connected: false,
      shouldReconnect: true,
      reconnectAttempts: 0
    };
    this.reconnectTimeout = null;
    this.heartbeatInterval = null;
    this.lastHeartbeat = null;
    this.heartbeatTimeout = null;
    this.url = config.wsUrl;
    this.connectedDevices = [];
    this.connectionState = false;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    console.log('[WebSocketService] Initialized with URL:', this.url);
    
    // Auto-connect on initialization
    setTimeout(() => {
      console.log('[WebSocketService] Auto-connecting on initialization');
      this.connect();
    }, 1000);
  }

  isConnected() {
    return this.connectionState;
  }

  addListener(listener) {
    console.log('[WebSocketService] Adding listener, total listeners:', this.listeners.size + 1);
    this.listeners.add(listener);
    return () => {
      console.log('[WebSocketService] Removing listener, remaining listeners:', this.listeners.size - 1);
      this.listeners.delete(listener);
    };
  }

  removeListener(listener) {
    console.log('[WebSocketService] Removing listener, remaining listeners:', this.listeners.size - 1);
    this.listeners.delete(listener);
  }

  notifyListeners(data) {
    // console.log('[WebSocketService] Notifying listeners:', data.type, 'Total listeners:', this.listeners.size);
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('[WebSocketService] Error in listener:', error);
      }
    });
  }

  connect() {
    console.log('[WebSocketService] Connect called. Current state:', {
      connecting: this.state.connecting,
      connected: this.state.connected,
      shouldReconnect: this.state.shouldReconnect,
      reconnectAttempts: this.state.reconnectAttempts
    });

    if (this.state.connecting || this.state.connected) {
      console.log('[WebSocketService] Already connecting or connected, skipping connect');
      return;
    }

    this.state.connecting = true;
    console.log(`[WebSocketService] Attempting to connect to WebSocket at ${this.url}`);

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('[WebSocketService] WebSocket Connected');
        this.state.connecting = false;
        this.state.connected = true;
        this.state.reconnectAttempts = 0;
        this.connectionState = true;
        this.notifyListeners({ type: 'connected' });
        this.sendMessage({ type: 'getDevices' });
      };

      this.ws.onclose = (event) => {
        console.log('[WebSocketService] WebSocket Disconnected', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        this.state.connecting = false;
        this.state.connected = false;
        this.connectionState = false;
        this.notifyListeners({ type: 'disconnected' });

        if (this.state.shouldReconnect && this.state.reconnectAttempts < this.maxReconnectAttempts) {
          this.state.reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, this.state.reconnectAttempts - 1), 30000);
          console.log(`[WebSocketService] Attempting to reconnect in ${delay}ms (${this.state.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          this.reconnectTimeout = setTimeout(() => {
            this.connect();
          }, delay);
        } else {
          console.log('[WebSocketService] Not attempting reconnect:', {
            shouldReconnect: this.state.shouldReconnect,
            reconnectAttempts: this.state.reconnectAttempts,
            maxReconnectAttempts: this.maxReconnectAttempts
          });
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocketService] WebSocket Error:', error);
        this.state.connecting = false;
        this.connectionState = false;
        this.notifyListeners({ 
          type: 'error',
          error: 'Connection error occurred'
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[WebSocketService] Received message:', data.type, data);
          
          if (data.type === 'devices') {
            console.log('[WebSocketService] Received devices with', data.devices?.length, 'devices');
            // Transform the devices data to show 'Available' instead of 'Connected' when connected is false
            const transformedDevices = data.devices?.map(device => ({
              ...device,
              status: device.connected ? 'Connected' : 'Available'
            })) || [];
            console.log('[WebSocketService] Transformed devices:', JSON.stringify(transformedDevices));
            this.connectedDevices = transformedDevices;
          }
          
          // Special logging for button events
          if (data.type === 'buttonStateChanged' || data.type === 'buttonPress' || data.type === 'buttonRelease') {
            // console.log('[WebSocketService] 🎯 BUTTON EVENT RECEIVED:', {
            //   type: data.type,
            //   deviceId: data.deviceId,
            //   state: data.state || data.buttonState,
            //   pressValue: data.pressValue,
            //   timestamp: new Date().toISOString()
            // });
          }
          
          // Handle error messages from the bridge
          if (data.type === 'error') {
            console.error('[WebSocketService] Bridge error:', data);
            this.notifyListeners({
              type: 'error',
              error: data.error || 'Unknown error',
              deviceId: data.deviceId,
              operation: data.operation
            });
          } else {
            console.log('[WebSocketService] Notifying listeners of message type:', data.type);
            this.notifyListeners(data);
          }
        } catch (error) {
          console.error('[WebSocketService] Error parsing message:', error);
          console.error('[WebSocketService] Raw message that failed to parse:', event.data);
          this.notifyListeners({ 
            type: 'error',
            error: 'Failed to parse message'
          });
        }
      };
    } catch (error) {
      console.error('[WebSocketService] Error creating WebSocket:', error);
      this.state.connecting = false;
      this.connectionState = false;
      this.notifyListeners({ 
        type: 'error',
        error: 'Failed to create WebSocket connection'
      });
    }
  }

  disconnect() {
    console.log('[WebSocketService] Disconnect called. Current state:', {
      connecting: this.state.connecting,
      connected: this.state.connected,
      shouldReconnect: this.state.shouldReconnect,
      hasReconnectTimeout: !!this.reconnectTimeout
    });

    // Clear any polling intervals (remove if not needed anymore)
    if (this.pollIntervals) {
      console.log('[WebSocketService] Clearing polling intervals');
      this.pollIntervals.forEach(interval => clearInterval(interval));
      this.pollIntervals.clear();
      this.pollIntervals = null; // Clean up the map
    }

    this.state.shouldReconnect = false;
    if (this.reconnectTimeout) {
      console.log('[WebSocketService] Clearing reconnect timeout');
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      console.log('[WebSocketService] Closing WebSocket connection');
      this.ws.close();
      this.ws = null;
    }
    this.state.connecting = false;
    this.state.connected = false;
  }

  async sendMessage(message) {
    console.log('[WebSocketService] Sending message:', message);
    if (!this.state.connected) {
      console.error('[WebSocketService] Cannot send message - not connected');
      throw new Error('WebSocket is not connected');
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws.send(JSON.stringify(message));
        resolve();
      } catch (error) {
        console.error('[WebSocketService] Error sending message:', error);
        reject(error);
      }
    });
  }

  async getDeviceInfo(deviceId) {
    // Instead of getDeviceInfo, we'll use getDevices since that includes all device info
    await this.sendMessage({ type: 'getDevices' });
  }

  async subscribeToCharacteristic(deviceId, characteristicUUID) {
    console.log('[WebSocketService] subscribeToCharacteristic called (no operation sent to bridge):', { deviceId, characteristicUUID });
    // This function is a no-op as the bridge sends characteristic updates automatically.
  }

  async writeCharacteristic(deviceId, characteristicUUID, value) {
    await this.sendMessage({
      type: 'writeCharacteristic',
      deviceId,
      characteristicUUID,
      value
    });
  }

  async readCharacteristic(deviceId, characteristicUUID) {
    await this.sendMessage({
      type: 'readCharacteristic',
      deviceId,
      characteristicUUID
    });
  }

  getDevices() {
    console.log('Getting devices list');
    this.sendMessage({
      type: 'getDevices'
    });
  }

  setColor(deviceId, r, g, b) {
    console.log('Setting color:', { deviceId, r, g, b });
    const sendColor = () => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        let jsonToSend = {
          type: 'setColor',
          deviceId: deviceId,
          color: { r, g, b }
        };
        this.ws.send(JSON.stringify(jsonToSend));
        return true;
      }
      return false;
    };

    // Try to send immediately if connected
    if (sendColor()) {
      return;
    }

    // If not connected, try to reconnect and send
    if (!this.state.connecting) {
      console.log('[WebSocketService] Not connected, attempting to reconnect...');
      this.connect();
      
      // Wait for connection and retry
      const checkConnection = setInterval(() => {
        if (this.state.connected) {
          clearInterval(checkConnection);
          if (sendColor()) {
            console.log('[WebSocketService] Successfully sent color after reconnection');
          } else {
            console.error('[WebSocketService] Failed to send color after reconnection');
          }
        }
      }, 100);

      // Clear interval after 5 seconds if still not connected
      setTimeout(() => {
        clearInterval(checkConnection);
        if (!this.state.connected) {
          console.error('[WebSocketService] Failed to reconnect within timeout');
        }
      }, 5000);
    } else {
      console.error('[WebSocketService] Already attempting to connect');
    }
  }

  setMode(deviceId, mode) {
    console.log('Setting mode:', { deviceId, mode });
    const sendMode = () => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        let jsonToSend = {
          type: 'setMode',
          deviceId: deviceId,
          data: [mode]
        };
        this.ws.send(JSON.stringify(jsonToSend));
        return true;
      }
      return false;
    };

    // Try to send immediately if connected
    if (sendMode()) {
      return;
    }

    // If not connected, try to reconnect and send
    if (!this.state.connecting) {
      console.log('[WebSocketService] Not connected, attempting to reconnect...');
      this.connect();
      
      // Wait for connection and retry
      const checkConnection = setInterval(() => {
        if (this.state.connected) {
          clearInterval(checkConnection);
          if (sendMode()) {
            console.log('[WebSocketService] Successfully sent mode after reconnection');
          } else {
            console.error('[WebSocketService] Failed to send mode after reconnection');
          }
        }
      }, 100);

      // Clear interval after 5 seconds if still not connected
      setTimeout(() => {
        clearInterval(checkConnection);
        if (!this.state.connected) {
          console.error('[WebSocketService] Failed to reconnect within timeout');
        }
      }, 5000);
    } else {
      console.error('[WebSocketService] Already attempting to connect');
    }
  }

  setLuminosity(deviceId, intensity) {
    // console.log('Setting luminosity:', { deviceId, intensity });
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // intensity = Math.round((intensity * (64 - 5)) / 100) + 5;
      let jsonToSend = {
        type: 'setLuminosity',
        deviceId: deviceId,
        data: [intensity]
      };
      this.ws.send(JSON.stringify(jsonToSend));
    } else {
      console.error('WebSocket is not connected');
    }
  }
}

// Create a singleton instance
const wsService = new WebSocketService();
export default wsService; 