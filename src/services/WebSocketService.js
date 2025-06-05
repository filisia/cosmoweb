class WebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = new Set();
    this.connecting = false;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.connectedDevices = [];
    this.connectionState = false;
    // Get the WebSocket URL from environment variable or use default
    this.wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8080';
    this.reconnectTimeout = null;
    this.shouldReconnect = true;
    console.log('[WebSocketService] Initialized with URL:', this.wsUrl);
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
    console.log('[WebSocketService] Notifying listeners:', data.type, 'Total listeners:', this.listeners.size);
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
      connecting: this.connecting,
      connected: this.connected,
      shouldReconnect: this.shouldReconnect,
      reconnectAttempts: this.reconnectAttempts
    });

    if (this.connecting || this.connected) {
      console.log('[WebSocketService] Already connecting or connected, skipping connect');
      return;
    }

    this.connecting = true;
    console.log(`[WebSocketService] Attempting to connect to WebSocket at ${this.wsUrl}`);

    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        console.log('[WebSocketService] WebSocket Connected');
        this.connecting = false;
        this.connected = true;
        this.reconnectAttempts = 0;
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
        this.connecting = false;
        this.connected = false;
        this.connectionState = false;
        this.notifyListeners({ type: 'disconnected' });

        if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`[WebSocketService] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          this.reconnectTimeout = setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
        } else {
          console.log('[WebSocketService] Not attempting reconnect:', {
            shouldReconnect: this.shouldReconnect,
            reconnectAttempts: this.reconnectAttempts,
            maxReconnectAttempts: this.maxReconnectAttempts
          });
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocketService] WebSocket Error:', error);
        this.connecting = false;
        this.connectionState = false;
        this.notifyListeners({ 
          type: 'error',
          error: 'Connection error occurred'
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[WebSocketService] Received message:', data);
          
          if (data.type === 'devicesList') {
            this.connectedDevices = data.devices || [];
          }
          
          // Handle error messages from the bridge
          if (data.type === 'error') {
            console.error('Bridge error:', data);
            this.notifyListeners({
              type: 'error',
              error: data.error || 'Unknown error',
              deviceId: data.deviceId,
              operation: data.operation
            });
          } else {
            this.notifyListeners(data);
          }
        } catch (error) {
          console.error('[WebSocketService] Error parsing message:', error);
          this.notifyListeners({ 
            type: 'error',
            error: 'Failed to parse message'
          });
        }
      };
    } catch (error) {
      console.error('[WebSocketService] Error creating WebSocket:', error);
      this.connecting = false;
      this.connectionState = false;
      this.notifyListeners({ 
        type: 'error',
        error: 'Failed to create WebSocket connection'
      });
    }
  }

  disconnect() {
    console.log('[WebSocketService] Disconnect called. Current state:', {
      connecting: this.connecting,
      connected: this.connected,
      shouldReconnect: this.shouldReconnect,
      hasReconnectTimeout: !!this.reconnectTimeout
    });

    this.shouldReconnect = false;
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
    this.connecting = false;
    this.connected = false;
  }

  async sendMessage(message) {
    console.log('[WebSocketService] Sending message:', message);
    if (!this.connected) {
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
    // The bridge automatically sends characteristic updates, no need to subscribe
    // Just ensure we're connected to the device
    await this.sendMessage({ 
      type: 'connect',
      deviceId
    });
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
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      let jsonToSend = {
        type: 'setColor',
        deviceId: deviceId,
        data: [r, g, b]
      };
      this.ws.send(JSON.stringify(jsonToSend));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  setLuminosity(deviceId, intensity) {
    console.log('Setting luminosity:', { deviceId, intensity });
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      intensity = Math.round((intensity * (64 - 5)) / 100) + 5;
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