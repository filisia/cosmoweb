const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Store connected devices
const devices = new Map();

// Function to broadcast to all clients
const broadcastToAll = (message) => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
};

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Send current devices list to new client
  ws.send(JSON.stringify({
    type: 'devices',
    devices: Array.from(devices.values())
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received raw message:', message.toString());
      console.log('Parsed message:', data);
      
      switch (data.type) {
        case 'setColor':
          console.log('Handling setColor:', data);
          if (data.deviceId && data.color) {
            const device = devices.get(data.deviceId);
            if (device) {
              device.color = data.color;
              broadcastToAll({
                type: 'devices',
                devices: Array.from(devices.values())
              });
            }
          }
          break;

        case 'getDevices':
          console.log('Handling getDevices request');
          ws.send(JSON.stringify({
            type: 'devices',
            devices: Array.from(devices.values())
          }));
          break;

        case 'deviceConnected':
        case 'deviceUpdate':
          console.log('Handling device update:', data);
          if (data.deviceId) {
            const existingDevice = devices.get(data.deviceId);
            const updatedDevice = {
              ...existingDevice,
              id: data.deviceId,
              name: data.name || existingDevice?.name,
              connected: data.connected !== undefined ? data.connected : true,
              color: existingDevice?.color || '#000000',
              batteryLevel: data.batteryLevel || existingDevice?.batteryLevel,
              serialNumber: data.serialNumber || existingDevice?.serialNumber,
              firmwareVersion: data.firmwareVersion || existingDevice?.firmwareVersion
            };
            devices.set(data.deviceId, updatedDevice);
            console.log('Current devices:', Array.from(devices.values()));
            broadcastToAll({
              type: 'devices',
              devices: Array.from(devices.values())
            });
          }
          break;

        case 'deviceDisconnected':
          console.log('Handling deviceDisconnected:', data);
          if (data.deviceId) {
            const device = devices.get(data.deviceId);
            if (device) {
              device.connected = false;
              console.log('Current devices after disconnect:', Array.from(devices.values()));
              broadcastToAll({
                type: 'devices',
                devices: Array.from(devices.values())
              });
            }
          }
          break;

        case 'buttonStateChanged':
          console.log('Handling buttonStateChanged:', data);
          if (data.deviceId && data.state !== undefined) {
            broadcastToAll({
              type: 'buttonStateChanged',
              deviceId: data.deviceId,
              state: data.state
            });
          }
          break;

        default:
          console.log('Unhandled message type:', data.type);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Use the PORT environment variable provided by Render
const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`WebSocket server is running on port ${PORT}`);
});