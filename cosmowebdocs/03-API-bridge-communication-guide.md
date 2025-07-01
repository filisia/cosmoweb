# Cosmoid Bridge Communication API Guide

## Overview

This document provides a comprehensive guide for web developers to communicate with the Cosmoid Bridge application. The bridge acts as a WebSocket server that manages BLE connections to Cosmo devices and provides a unified API for web applications to interact with multiple devices simultaneously.

## Architecture

```
┌─────────────────┐    WebSocket     ┌─────────────────┐    BLE      ┌─────────────────┐
│   Web App       │ ←─────────────→  │ Cosmoid Bridge  │ ←─────────→ │  Cosmo Devices  │
│  (Your App)     │  ws://localhost  │  (Node.js)      │             │   (Hardware)    │
│                 │      :8080       │                 │             │                 │
└─────────────────┘                  └─────────────────┘             └─────────────────┘
```

## Quick Start

### 1. Connect to the Bridge

```javascript
// Create WebSocket connection
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
  console.log('Connected to Cosmoid Bridge');
  // Request initial device list
  ws.send(JSON.stringify({ type: 'getDevices' }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};
```

### 2. Basic Device Management

```javascript
// Get connected devices
ws.send(JSON.stringify({ type: 'getDevices' }));

// Listen for device updates
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === 'devices') {
    console.log('Available devices:', message.devices);
    // message.devices contains array of device objects
  }
};
```

## Core API Reference

### Connection Management

#### Connect to Bridge
```javascript
const ws = new WebSocket('ws://localhost:8080');
```

#### Check Connection Status
```javascript
if (ws.readyState === WebSocket.OPEN) {
  console.log('Connected');
} else {
  console.log('Not connected');
}
```

### Device Discovery & Management

#### Get All Devices
```javascript
ws.send(JSON.stringify({
  type: 'getDevices'
}));
```

**Response:**
```json
{
  "type": "devices",
  "devices": [
    {
      "id": "device-uuid-string",
      "name": "Cosmo Device",
      "serial": "2405002009",
      "firmware": "4.6.00",
      "batteryLevel": 85,
      "connected": true,
      "buttonState": 0,
      "pressValue": 0,
      "color": [0, 0, 0],
      "luminosity": 0
    }
  ]
}
```

### Device Control Operations

#### Set Device Color
```javascript
ws.send(JSON.stringify({
  type: 'setColor',
  deviceId: 'device-uuid-string',
  color: { r: 255, g: 0, b: 128 }
}));
```

#### Set Device Luminosity
```javascript
ws.send(JSON.stringify({
  type: 'setLuminosity',
  deviceId: 'device-uuid-string',
  data: [64] // 0-255 intensity
}));
```

#### Set Device Mode
```javascript
ws.send(JSON.stringify({
  type: 'setMode',
  deviceId: 'device-uuid-string',
  data: [4] // Mode number
}));
```

### Button Event Handling

#### Listen for Button Events
```javascript
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'buttonPress':
      console.log('Button pressed on device:', message.deviceId);
      console.log('Press value:', message.pressValue);
      break;
      
    case 'buttonRelease':
      console.log('Button released on device:', message.deviceId);
      break;
      
    case 'buttonStateChanged':
      console.log('Button state changed:', {
        deviceId: message.deviceId,
        state: message.buttonState || message.state,
        pressValue: message.pressValue
      });
      break;
  }
};
```

**Button Event Messages:**
```json
// Button Press
{
  "type": "buttonPress",
  "deviceId": "device-uuid-string",
  "pressValue": 255
}

// Button Release
{
  "type": "buttonRelease",
  "deviceId": "device-uuid-string",
  "pressValue": 0
}

// Button State Change
{
  "type": "buttonStateChanged",
  "deviceId": "device-uuid-string",
  "buttonState": "pressed", // or "released"
  "pressValue": 255
}
```

### Device Locking

#### Lock Devices (Prevent Other Apps from Using)
```javascript
ws.send(JSON.stringify({
  type: 'lockDevices',
  isLocked: true,
  deviceIds: ['device-1', 'device-2']
}));
```

#### Unlock Devices
```javascript
ws.send(JSON.stringify({
  type: 'lockDevices',
  isLocked: false,
  deviceIds: ['device-1', 'device-2']
}));
```

**Lock State Response:**
```json
{
  "type": "lockStateChanged",
  "isLocked": true,
  "deviceIds": ["device-1", "device-2"]
}
```

## Advanced Patterns

### 1. Device State Management

```javascript
class DeviceManager {
  constructor() {
    this.devices = new Map();
    this.ws = null;
    this.listeners = new Set();
  }
  
  connect() {
    this.ws = new WebSocket('ws://localhost:8080');
    this.ws.onopen = () => {
      this.requestDevices();
    };
    this.ws.onmessage = (event) => {
      this.handleMessage(JSON.parse(event.data));
    };
  }
  
  requestDevices() {
    this.ws.send(JSON.stringify({ type: 'getDevices' }));
  }
  
  handleMessage(message) {
    switch (message.type) {
      case 'devices':
        this.updateDevices(message.devices);
        break;
      case 'buttonPress':
      case 'buttonRelease':
      case 'buttonStateChanged':
        this.updateDeviceState(message);
        break;
    }
    
    // Notify listeners
    this.listeners.forEach(listener => listener(message));
  }
  
  updateDevices(devices) {
    devices.forEach(device => {
      this.devices.set(device.id, device);
    });
  }
  
  updateDeviceState(message) {
    const device = this.devices.get(message.deviceId);
    if (device) {
      device.buttonState = message.buttonState || message.state;
      device.pressValue = message.pressValue;
    }
  }
  
  addListener(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  setColor(deviceId, r, g, b) {
    this.ws.send(JSON.stringify({
      type: 'setColor',
      deviceId,
      color: { r, g, b }
    }));
  }
  
  setLuminosity(deviceId, intensity) {
    this.ws.send(JSON.stringify({
      type: 'setLuminosity',
      deviceId,
      data: [intensity]
    }));
  }
}
```

### 2. Game Implementation Pattern

```javascript
class CosmoGame {
  constructor(deviceManager) {
    this.deviceManager = deviceManager;
    this.activeDeviceIndex = 0;
    this.devices = [];
    this.score = 0;
    this.gameActive = false;
    
    // Listen for device updates
    this.removeListener = deviceManager.addListener(this.handleMessage.bind(this));
  }
  
  startGame(deviceIds) {
    this.devices = deviceIds;
    this.activeDeviceIndex = 0;
    this.score = 0;
    this.gameActive = true;
    
    // Initialize devices
    this.devices.forEach((deviceId, index) => {
      const colors = [
        { r: 0, g: 0, b: 255 },   // Blue
        { r: 0, g: 255, b: 0 },   // Green
        { r: 255, g: 255, b: 0 }, // Yellow
        { r: 255, g: 128, b: 0 }, // Orange
        { r: 255, g: 0, b: 0 },   // Red
        { r: 255, g: 0, b: 255 }  // Purple
      ];
      
      const color = colors[index % colors.length];
      this.deviceManager.setColor(deviceId, color.r, color.g, color.b);
      this.deviceManager.setLuminosity(deviceId, 0);
    });
    
    this.updateActiveDevice();
  }
  
  handleMessage(message) {
    if (!this.gameActive) return;
    
    if (message.type === 'buttonPress' || message.type === 'buttonStateChanged') {
      const activeDeviceId = this.devices[this.activeDeviceIndex];
      
      if (message.deviceId === activeDeviceId) {
        this.handleCorrectPress();
      }
    }
  }
  
  handleCorrectPress() {
    this.score++;
    this.activeDeviceIndex = (this.activeDeviceIndex + 1) % this.devices.length;
    this.updateActiveDevice();
  }
  
  updateActiveDevice() {
    this.devices.forEach((deviceId, index) => {
      const luminosity = index === this.activeDeviceIndex ? 64 : 0;
      this.deviceManager.setLuminosity(deviceId, luminosity);
    });
  }
  
  endGame() {
    this.gameActive = false;
    this.devices.forEach(deviceId => {
      this.deviceManager.setLuminosity(deviceId, 0);
    });
  }
  
  destroy() {
    this.removeListener();
  }
}

// Usage
const deviceManager = new DeviceManager();
deviceManager.connect();

const game = new CosmoGame(deviceManager);
game.startGame(['device-1', 'device-2']);
```

### 3. Multi-Device Synchronization

```javascript
class DeviceSynchronizer {
  constructor(deviceManager) {
    this.deviceManager = deviceManager;
    this.syncState = new Map();
  }
  
  // Synchronize color across all devices
  syncColor(r, g, b) {
    this.deviceManager.devices.forEach(device => {
      this.deviceManager.setColor(device.id, r, g, b);
    });
  }
  
  // Create wave effect
  createWaveEffect(baseColor, duration = 2000) {
    const devices = Array.from(this.deviceManager.devices.values());
    const delay = duration / devices.length;
    
    devices.forEach((device, index) => {
      setTimeout(() => {
        this.deviceManager.setColor(device.id, baseColor.r, baseColor.g, baseColor.b);
        this.deviceManager.setLuminosity(device.id, 64);
        
        setTimeout(() => {
          this.deviceManager.setLuminosity(device.id, 0);
        }, 500);
      }, index * delay);
    });
  }
  
  // Synchronize button press detection
  onAnyButtonPress(callback) {
    this.deviceManager.addListener((message) => {
      if (message.type === 'buttonPress') {
        callback(message.deviceId, message.pressValue);
      }
    });
  }
}
```

## Error Handling

### Connection Errors
```javascript
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
  // Implement retry logic
};

ws.onclose = (event) => {
  console.log('WebSocket closed:', event.code, event.reason);
  if (event.code !== 1000) {
    // Unexpected closure, attempt to reconnect
    setTimeout(() => {
      connectToBridge();
    }, 1000);
  }
};
```

### Message Validation
```javascript
function validateMessage(message) {
  if (!message || typeof message !== 'object') {
    throw new Error('Invalid message format');
  }
  
  if (!message.type) {
    throw new Error('Message missing type field');
  }
  
  return true;
}

ws.onmessage = (event) => {
  try {
    const message = JSON.parse(event.data);
    validateMessage(message);
    handleMessage(message);
  } catch (error) {
    console.error('Message handling error:', error);
  }
};
```

## Performance Considerations

### 1. Message Rate Limiting
```javascript
class RateLimiter {
  constructor(maxMessages, timeWindow) {
    this.maxMessages = maxMessages;
    this.timeWindow = timeWindow;
    this.messages = [];
  }
  
  canSend() {
    const now = Date.now();
    this.messages = this.messages.filter(time => now - time < this.timeWindow);
    return this.messages.length < this.maxMessages;
  }
  
  recordMessage() {
    this.messages.push(Date.now());
  }
}

const colorLimiter = new RateLimiter(10, 1000); // 10 messages per second

function setColorSafely(deviceId, r, g, b) {
  if (!colorLimiter.canSend()) {
    console.warn('Rate limit exceeded for color changes');
    return false;
  }
  
  ws.send(JSON.stringify({
    type: 'setColor',
    deviceId,
    color: { r, g, b }
  }));
  
  colorLimiter.recordMessage();
  return true;
}
```

### 2. Efficient State Updates
```javascript
class EfficientDeviceManager {
  constructor() {
    this.devices = new Map();
    this.pendingUpdates = new Map();
    this.updateTimeout = null;
  }
  
  updateDevice(deviceId, updates) {
    const current = this.pendingUpdates.get(deviceId) || {};
    this.pendingUpdates.set(deviceId, { ...current, ...updates });
    
    // Debounce updates
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }
    
    this.updateTimeout = setTimeout(() => {
      this.flushUpdates();
    }, 16); // ~60fps
  }
  
  flushUpdates() {
    this.pendingUpdates.forEach((updates, deviceId) => {
      if (updates.color) {
        this.setColor(deviceId, updates.color.r, updates.color.g, updates.color.b);
      }
      if (updates.luminosity !== undefined) {
        this.setLuminosity(deviceId, updates.luminosity);
      }
    });
    
    this.pendingUpdates.clear();
  }
}
```

## Testing

### Mock Bridge for Testing
```javascript
class MockBridge {
  constructor() {
    this.clients = new Set();
    this.devices = [
      {
        id: 'mock-device-1',
        name: 'Mock Cosmo 1',
        connected: true,
        buttonState: 0
      },
      {
        id: 'mock-device-2',
        name: 'Mock Cosmo 2',
        connected: true,
        buttonState: 0
      }
    ];
  }
  
  simulateButtonPress(deviceId) {
    const device = this.devices.find(d => d.id === deviceId);
    if (device) {
      device.buttonState = 1;
      this.broadcast({
        type: 'buttonPress',
        deviceId,
        pressValue: 255
      });
      
      setTimeout(() => {
        device.buttonState = 0;
        this.broadcast({
          type: 'buttonRelease',
          deviceId,
          pressValue: 0
        });
      }, 100);
    }
  }
  
  broadcast(message) {
    this.clients.forEach(client => {
      client.onmessage({ data: JSON.stringify(message) });
    });
  }
}

// Usage in tests
const mockBridge = new MockBridge();
// Simulate button press
mockBridge.simulateButtonPress('mock-device-1');
```

## Best Practices

### 1. Connection Management
- Always handle connection state changes
- Implement automatic reconnection with exponential backoff
- Clean up resources when disconnecting

### 2. Message Handling
- Validate all incoming messages
- Handle unknown message types gracefully
- Use specific message types for different operations

### 3. Device Management
- Track device state locally for better performance
- Implement proper error handling for device operations
- Use device locking when appropriate

### 4. Performance
- Debounce rapid state updates
- Implement rate limiting for high-frequency operations
- Use efficient data structures for device tracking

### 5. Testing
- Create mock implementations for testing
- Test both success and error scenarios
- Validate message formats and state transitions

## Common Use Cases

### 1. Simple Button Game
```javascript
// Connect and listen for button presses
const ws = new WebSocket('ws://localhost:8080');
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'buttonPress') {
    console.log('Button pressed!');
    // Handle game logic
  }
};
```

### 2. Multi-Device Light Show
```javascript
// Create synchronized light patterns
const deviceManager = new DeviceManager();
deviceManager.connect();

// Rainbow wave effect
const colors = [
  [255, 0, 0], [255, 127, 0], [255, 255, 0],
  [0, 255, 0], [0, 0, 255], [75, 0, 130], [238, 130, 238]
];

let colorIndex = 0;
setInterval(() => {
  const [r, g, b] = colors[colorIndex];
  deviceManager.devices.forEach(device => {
    deviceManager.setColor(device.id, r, g, b);
  });
  colorIndex = (colorIndex + 1) % colors.length;
}, 500);
```

### 3. Interactive Music Controller
```javascript
// Use button presses to control music
const deviceManager = new DeviceManager();
deviceManager.connect();

deviceManager.addListener((message) => {
  if (message.type === 'buttonPress') {
    const device = deviceManager.devices.get(message.deviceId);
    const note = getNoteFromDevice(device);
    playNote(note);
  }
});
```

This comprehensive guide provides all the information needed to build applications that communicate with the Cosmoid Bridge, following the same patterns used in the ExerciseGame component and other parts of the Cosmoweb application. 