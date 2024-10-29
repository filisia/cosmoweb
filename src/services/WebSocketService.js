class WebSocketService {
  constructor() {
    this.ws = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.listeners = new Set();
    this.messageQueue = [];
    this.connectionTimeout = null;
  }

  connect() {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket('ws://localhost:8080');

        this.connectionTimeout = setTimeout(() => {
          if (!this.connected && this.ws) {
            this.ws.close();
            this.ws = null;
            this.notifyListeners('connectionFailed', {
              message: 'Unable to connect to Cosmoid Bridge. Please ensure the application is running.'
            });
          }
        }, 3000);

        this.ws.onopen = () => {
          clearTimeout(this.connectionTimeout);
          console.log('Connected to Cosmoid Bridge');
          this.connected = true;
          this.reconnectAttempts = 0;
          this.notifyListeners('connected');
          
          while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            this.ws.send(message);
          }
          
          setTimeout(() => this.getDevices(), 100);
          resolve();
        };

        this.ws.onclose = (event) => {
          clearTimeout(this.connectionTimeout);
          console.log('Disconnected from Cosmoid Bridge');
          this.connected = false;
          this.ws = null;
          
          if (!event.wasClean) {
            this.notifyListeners('connectionFailed', {
              message: 'Connection to Cosmoid Bridge was lost. Please ensure the application is running.'
            });
          } else {
            this.notifyListeners('disconnected');
          }
          
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          clearTimeout(this.connectionTimeout);
          console.error('WebSocket error:', error);
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing message:', error);
          }
        };

      } catch (error) {
        clearTimeout(this.connectionTimeout);
        console.error('Failed to connect:', error);
        this.notifyListeners('connectionFailed', {
          message: 'Unable to connect to Cosmoid Bridge. Please ensure the application is running.'
        });
      }
    });
  }

  handleMessage(message) {
    switch (message.type) {
      case 'devicesList':
        this.notifyListeners('devicesList', message.devices);
        break;
      case 'deviceConnected':
        this.notifyListeners('deviceConnected', message.deviceId);
        break;
      case 'deviceInfo':
        this.notifyListeners('deviceInfo', message);
        break;
      case 'eventResult':
        this.notifyListeners('eventResult', message);
        break;
      case 'characteristicChanged':
        if (message.deviceId && message.characteristicUUID) {
          this.notifyListeners('characteristicChanged', {
            deviceId: message.deviceId,
            characteristicUUID: message.characteristicUUID,
            value: message.value
          });
        } else {
          console.warn('Received incomplete characteristicChanged message:', message);
        }
        break;
      default:
        console.log('Unhandled message type:', message.type);
    }
  }

  sendMessage(message) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.messageQueue.push(message);
      return;
    }
    this.ws.send(message);
  }

  getDevices() {
    const message = JSON.stringify({ type: 'getDevices' });
    this.sendMessage(message);
  }

  connectToDevice(deviceId) {
    const message = JSON.stringify({
      type: 'connect',
      deviceId
    });
    this.sendMessage(message);
  }

  setColor(deviceId, r, g, b) {
    if (r < 0 || r > 4 || g < 0 || g > 4 || b < 0 || b > 4) {
      throw new Error('Color values must be between 0 and 4');
    }

    const message = JSON.stringify({
      type: 'setColor',
      deviceId,
      data: [r, g, b]
    });
    this.sendMessage(message);
  }

  setLuminosity(deviceId, brightness) {
    if (brightness < 0 || brightness > 100) {
      throw new Error('Brightness must be between 0 and 100');
    }

    const message = JSON.stringify({
      type: 'setLuminosity',
      deviceId,
      data: [brightness]
    });
    this.sendMessage(message);
  }

  getDeviceInfo(deviceId) {
    const message = JSON.stringify({
      type: 'getDeviceInfo',
      deviceId
    });
    this.sendMessage(message);
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => {
        if (!this.connected) {
          this.connect().catch(() => {
            // Catch and ignore the error as we're already handling it through listeners
          });
        }
      }, 2000);
    } else {
      this.notifyListeners('connectionFailed', {
        message: 'Unable to establish connection after multiple attempts. Please refresh the page to try again.'
      });
    }
  }

  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(status, data) {
    this.listeners.forEach(callback => callback(status, data));
  }
}

export const wsService = new WebSocketService();
export default wsService; 