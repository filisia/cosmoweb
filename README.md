# Cosmoid Web Client

This is the web client for controlling Cosmoid BLE devices through the Cosmoid Bridge application.

## Setup

### Prerequisites

1. **Cosmoid Bridge Application**: Make sure the Cosmoid Bridge application is running on your computer
   - Download from: [Cosmoid Bridge Download Link](https://drive.google.com/file/d/1QXPr67vYiePTso6lsO33KBVpTza1x6_6/view?usp=sharing)
   - The bridge app provides a WebSocket server on `ws://localhost:8080`

2. **Supported Browsers**: Chrome or Edge (for WebSocket support)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open your browser to `http://localhost:3000`

## How It Works

The web client connects directly to the Cosmoid Bridge application running on your computer via WebSocket at `ws://localhost:8080`. This provides:

- **Real-time device communication**: No external servers involved
- **Low latency**: Direct local connection
- **Privacy**: All communication stays on your local network
- **Reliability**: No dependency on external services

## Features

- **Device Management**: View connected Cosmoid devices
- **LED Control**: Set colors, brightness, and modes
- **Button Events**: Real-time button press detection
- **Device Locking**: Lock/unlock specific devices
- **Sensor Data**: Monitor force sensor and other characteristics

## Architecture

- **WebSocket Communication**: Direct connection to bridge app
- **React Frontend**: Modern UI with real-time updates
- **Device Control**: Full control over Cosmoid device features
- **Error Handling**: Graceful connection and error management

## Troubleshooting

If you see a "Connection Required" message:

1. Ensure the Cosmoid Bridge application is running
2. Check that no firewall is blocking port 8080
3. Verify you're using a supported browser
4. Try refreshing the page
5. Check the bridge app logs for any errors

## Development

The web client is built with:
- React 18
- WebSocket API
- Tailwind CSS
- Modern JavaScript (ES6+)

All WebSocket communication is handled through the `WebSocketService` class, which manages connection, reconnection, and message handling. 