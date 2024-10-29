// BLEService.js

let ws = null;
const WS_URL = 'ws://localhost:8080'; 

// Initialize WebSocket connection
const initializeWebSocket = () => {
  if (ws) return;

  ws = new WebSocket(WS_URL);
  
  ws.onopen = () => {
    console.log('WebSocket connected to Electron app');
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected, attempting to reconnect...');
    ws = null;
    // Attempt to reconnect after 2 seconds
    setTimeout(initializeWebSocket, 2000);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
};

// Helper function to send messages to Electron
const sendMessage = (type, payload) => {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    throw new Error('WebSocket is not connected');
  }
  ws.send(JSON.stringify({ type, payload }));
};

// Function to initiate scanning for BLE devices
export const scanForDevices = async () => {
  try {
    initializeWebSocket();
    
    return new Promise((resolve, reject) => {
      const messageHandler = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'scanResponse') {
          ws.removeEventListener('message', messageHandler);
          if (data.error) {
            reject(new Error(data.error));
          } else {
            resolve(data.device);
          }
        }
      };

      ws.addEventListener('message', messageHandler);
      sendMessage('scan', {
        services: ['00001523-1212-efde-1523-785feabcd123'],
        optionalServices: ['0000180a-0000-1000-8000-00805f9b34fb']
      });
    });
  } catch (error) {
    console.error('Error scanning for devices:', error);
    throw error;
  }
};

// Function to establish a connection with a BLE device
export const connectToDevice = async (device) => {
  try {
    console.log('Connecting to device:', device.name);
    
    // Set up disconnect listener before connecting
    device.addEventListener('gattserverdisconnected', () => {
      console.log('Device disconnected:', device.name);
      // You can emit a custom event or use a callback here
      window.dispatchEvent(new CustomEvent('bleDeviceDisconnected', { 
        detail: { deviceId: device.id }
      }));
    });

    const server = await device.gatt.connect();
    console.log('Connected to device:', device.name);
    return server;
  } catch (error) {
    console.error('Error in connecting to BLE device:', error);
    throw error;
  }
};

// Optional: Add a function to properly disconnect
export const disconnectDevice = async (device) => {
  try {
    if (device && device.gatt.connected) {
      await device.gatt.disconnect();
      console.log('Device disconnected successfully:', device.name);
    }
  } catch (error) {
    console.error('Error disconnecting device:', error);
    throw error;
  }
};

// Function to start notifications for a BLE characteristic
export const startNotifications = async (server, serviceUUID, characteristicUUID, callback) => {
  try {
    const messageHandler = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'characteristicChanged' && 
          data.characteristicUUID === characteristicUUID) {
        callback(data.value);
      }
    };

    ws.addEventListener('message', messageHandler);
    
    await new Promise((resolve, reject) => {
      const setupHandler = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'notifyResponse') {
          ws.removeEventListener('message', setupHandler);
          if (data.error) {
            reject(new Error(data.error));
          } else {
            resolve(data.characteristic);
          }
        }
      };

      ws.addEventListener('message', setupHandler);
      sendMessage('startNotifications', {
        serverId: server.id,
        serviceUUID,
        characteristicUUID
      });
    });

    return { removeListener: () => ws.removeEventListener('message', messageHandler) };
  } catch (error) {
    console.error('Error in starting notifications:', error);
    throw error;
  }
};

// Function to write data to a BLE characteristic
export const writeToCharacteristic = async (server, serviceUUID, characteristicUUID, values) => {
  try {
    const service = await server.getPrimaryService(serviceUUID);
    const characteristic = await service.getCharacteristic(characteristicUUID);
    await characteristic.writeValue(new Uint8Array(values));
  } catch (error) {
    console.error('Error writing to characteristic:', error);
    throw error;
  }
};

// Function to read characteristic value
export const readCharacteristic = async (server, serviceUUID, characteristicUUID) => {
  try {
    return new Promise((resolve, reject) => {
      const messageHandler = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'readResponse') {
          ws.removeEventListener('message', messageHandler);
          if (data.error) {
            reject(new Error(data.error));
          } else {
            resolve(data.value);
          }
        }
      };

      ws.addEventListener('message', messageHandler);
      sendMessage('read', {
        serverId: server.id,
        serviceUUID,
        characteristicUUID
      });
    });
  } catch (error) {
    console.error(`Error reading characteristic ${characteristicUUID}:`, error);
    throw error;
  }
};

// Function to set up an event listener for device disconnection
export const onDeviceDisconnected = (device, callback) => {
  const disconnectHandler = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'deviceDisconnected' && data.deviceId === device.id) {
      callback();
    }
  };
  ws.addEventListener('message', disconnectHandler);
  return () => ws.removeEventListener('message', disconnectHandler);
};

// Initialize WebSocket connection when the module is imported
initializeWebSocket();
