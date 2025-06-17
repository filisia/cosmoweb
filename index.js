const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Store connected devices
const devices = new Map();

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received:', data);
      
      switch (data.type) {
        case 'setColor':
          // Handle color setting
          if (data.deviceId && data.color) {
            const device = devices.get(data.deviceId);
            if (device) {
              device.color = data.color;
              ws.send(JSON.stringify({
                type: 'colorSet',
                deviceId: data.deviceId,
                color: data.color
              }));
            }
          }
          break;

        case 'getDevices':
          // Send list of devices
          ws.send(JSON.stringify({
            type: 'devices',
            devices: Array.from(devices.values())
          }));
          break;

        case 'deviceConnected':
          // Handle device connection
          if (data.deviceId) {
            devices.set(data.deviceId, {
              id: data.deviceId,
              connected: true,
              color: '#000000'
            });
            // Broadcast to all clients
            wss.clients.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'deviceConnected',
                  deviceId: data.deviceId
                }));
              }
            });
          }
          break;

        case 'deviceDisconnected':
          // Handle device disconnection
          if (data.deviceId) {
            devices.delete(data.deviceId);
            // Broadcast to all clients
            wss.clients.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'deviceDisconnected',
                  deviceId: data.deviceId
                }));
              }
            });
          }
          break;

        case 'buttonStateChanged':
          // Handle button state changes
          if (data.deviceId && data.state !== undefined) {
            // Broadcast to all clients
            wss.clients.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'buttonStateChanged',
                  deviceId: data.deviceId,
                  state: data.state
                }));
              }
            });
          }
          break;
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`WebSocket server is running on port ${PORT}`);
}); 