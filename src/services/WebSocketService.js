class WebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = new Set();
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.connectedDevices = [];
    this.connectionState = false;
  }

  isConnected() {
    return this.connectionState;
  }

  connect() {
    if (this.isConnected()) {
      this.notifyListeners('connected', null);
      if (this.connectedDevices.length > 0) {
        this.notifyListeners('devicesList', { devices: this.connectedDevices });
      }
      return;
    }

    if (this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      this.ws = new WebSocket('ws://localhost:8080');

      this.ws.onopen = () => {
        console.log('WebSocket Connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.connectionState = true;
        this.notifyListeners('connected', null);
        this.send({ type: 'getDevices' });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'devicesList') {
            this.connectedDevices = data.devices || [];
          }
          this.notifyListeners(data.type || 'message', data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket Disconnected');
        this.isConnecting = false;
        this.connectionState = false;
        this.notifyListeners('disconnected', null);
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
        this.isConnecting = false;
        this.notifyListeners('connectionFailed', { message: 'Connection failed' });
      };

    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.isConnecting = false;
      this.notifyListeners('connectionFailed', { message: error.message });
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => this.connect(), 2000); // Wait 2 seconds before reconnecting
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(status, data) {
    this.listeners.forEach(listener => {
      try {
        listener(status, data);
      } catch (error) {
        console.error('Error in listener:', error);
      }
    });
  }

  send(message) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
      this.connect(); // Attempt to reconnect
    }
  }

  getDeviceInfo(deviceId) {
    this.send({
      type: 'getDeviceInfo',
      deviceId
    });
  }

  writeCharacteristic(deviceId, characteristicUUID, value) {
    this.send({
      type: 'writeCharacteristic',
      deviceId,
      characteristicUUID,
      value
    });
  }

  getDevices() {
    this.send({
      type: 'getDevices'
    });
  }

  subscribeToCharacteristic(deviceId, characteristicUUID) {
    this.send({
      type: 'subscribe',
      deviceId,
      characteristicUUID
    });
  }

  setColor(deviceId, r, g, b) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      let jsonToSend = {
        type: 'setColor',
        deviceId: deviceId,
        data: [r, g, b]
      };
      console.log(jsonToSend);
      this.ws.send(JSON.stringify(jsonToSend));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  setLuminosity(deviceId, intensity) {
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