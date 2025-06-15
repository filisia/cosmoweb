# WebSocket Message Protocol Specification

## Overview

This document provides the complete WebSocket message protocol specification for communication between Cosmoweb (React client) and Cosmoid Bridge (WebSocket server). All messages are JSON-formatted and follow a consistent structure.

## Message Structure

### Base Message Format
```json
{
  "type": "messageType",
  "timestamp": "2025-06-15T13:20:17.123Z", // Optional, added by server
  "data": { /* message-specific payload */ }
}
```

## Incoming Messages (Bridge → Cosmoweb)

### 1. Device Updates

#### Device List Update
```json
{
  "type": "deviceUpdate",
  "devices": [
    {
      "id": "device-uuid-string",
      "name": "Cosmo Device",
      "serial": "2405002009",
      "firmware": "4.6.00",
      "batteryLevel": 85,
      "isConnected": true,
      "connectionState": "connected",
      "lastSeen": "2025-06-15T13:20:17Z",
      "deviceType": "cosmo",
      "capabilities": ["button", "led", "vibration"],
      "rssi": -45
    }
  ]
}
```

#### Single Device Update
```json
{
  "type": "deviceUpdate",
  "deviceId": "device-uuid-string",
  "device": {
    "id": "device-uuid-string",
    "batteryLevel": 82,
    "connectionState": "connected",
    "lastSeen": "2025-06-15T13:20:17Z"
  }
}
```

### 2. Button State Changes

#### Button Press/Release Event
```json
{
  "type": "buttonStateChanged",
  "deviceId": "device-uuid-string",
  "buttonState": "pressed", // "pressed" | "released"
  "pressValue": 255, // 255 for pressed, 0 for released
  "timestamp": "2025-06-15T13:20:17.123Z"
}
```

### 3. Characteristic Value Changes

#### LED Control Response
```json
{
  "type": "characteristicValueChanged",
  "deviceId": "device-uuid-string",
  "characteristicUUID": "000015241212efde1523785feabcd123",
  "operation": "ledControl",
  "value": [255, 128, 0], // RGB values
  "success": true
}
```

#### Vibration Response
```json
{
  "type": "characteristicValueChanged",
  "deviceId": "device-uuid-string",
  "characteristicUUID": "000015271212efde1523785feabcd123",
  "operation": "vibrationControl",
  "value": [200], // Vibration intensity
  "success": true
}
```

### 4. Lock State Updates

#### Device Lock/Unlock Status
```json
{
  "type": "lockStateChanged",
  "isLocked": true,
  "deviceIds": ["device-1", "device-2"],
  "lockedBy": "game-session-id",
  "timestamp": "2025-06-15T13:20:17.123Z"
}
```

### 5. Error Messages

#### Connection Error
```json
{
  "type": "error",
  "errorType": "CONNECTION_ERROR",
  "message": "Failed to connect to device",
  "deviceId": "device-uuid-string",
  "details": {
    "code": "BLE_CONNECTION_FAILED",
    "retryable": true
  }
}
```

#### Characteristic Operation Error
```json
{
  "type": "error",
  "errorType": "CHARACTERISTIC_ERROR",
  "message": "Failed to write characteristic",
  "deviceId": "device-uuid-string",
  "characteristicUUID": "000015241212efde1523785feabcd123",
  "operation": "ledControl",
  "details": {
    "code": "WRITE_FAILED",
    "retryable": true
  }
}
```

### 6. System Status

#### Bridge Status Update
```json
{
  "type": "systemStatus",
  "status": "ready", // "ready" | "starting" | "error"
  "version": "1.0.0",
  "capabilities": ["ble", "websocket"],
  "connectedClients": 3,
  "uptime": 3600000 // milliseconds
}
```

## Outgoing Messages (Cosmoweb → Bridge)

### 1. Characteristic Operations

#### LED Control
```json
{
  "type": "characteristicChanged",
  "deviceId": "device-uuid-string",
  "characteristicUUID": "000015241212efde1523785feabcd123",
  "operation": "ledControl",
  "value": [255, 0, 128] // RGB values
}
```

#### Vibration Control
```json
{
  "type": "characteristicChanged",
  "deviceId": "device-uuid-string",
  "characteristicUUID": "000015271212efde1523785feabcd123",
  "operation": "vibrationControl",
  "value": [150] // Intensity (0-255)
}
```

#### Sound Control
```json
{
  "type": "characteristicChanged",
  "deviceId": "device-uuid-string",
  "characteristicUUID": "000015281212efde1523785feabcd123",
  "operation": "soundControl",
  "value": [440, 500] // Frequency (Hz), Duration (ms)
}
```

### 2. Device Lock/Unlock

#### Lock Devices
```json
{
  "type": "lockDevices",
  "isLocked": true,
  "deviceIds": ["device-1", "device-2"],
  "sessionId": "game-session-id" // Optional
}
```

#### Unlock Devices
```json
{
  "type": "lockDevices",
  "isLocked": false,
  "deviceIds": ["device-1", "device-2"],
  "sessionId": "game-session-id" // Optional
}
```

### 3. Device Discovery

#### Request Device Scan
```json
{
  "type": "requestScan",
  "duration": 10000, // Scan duration in milliseconds
  "filters": {
    "deviceType": "cosmo",
    "minRssi": -80
  }
}
```

### 4. System Commands

#### Ping/Heartbeat
```json
{
  "type": "ping",
  "timestamp": "2025-06-15T13:20:17.123Z"
}
```

#### Request System Status
```json
{
  "type": "getSystemStatus"
}
```

## Characteristic UUIDs and Operations

### Device Information Service (0x180A)
- **Serial Number**: `00002a25-0000-1000-8000-00805f9b34fb`
- **Firmware Revision**: `00002a26-0000-1000-8000-00805f9b34fb`
- **Manufacturer Name**: `00002a29-0000-1000-8000-00805f9b34fb`

### Battery Service (0x180F)
- **Battery Level**: `00002a19-0000-1000-8000-00805f9b34fb`

### Cosmo Custom Service (`000015231212efde1523785feabcd123`)
- **LED Control**: `000015241212efde1523785feabcd123`
- **Button State**: `000015251212efde1523785feabcd123` (Notify)
- **Vibration Control**: `000015271212efde1523785feabcd123`
- **Sound Control**: `000015281212efde1523785feabcd123`

## Operation Mappings

### LED Control Operations
```javascript
const LED_OPERATIONS = {
  'ledControl': {
    uuid: '000015241212efde1523785feabcd123',
    valueFormat: 'rgb', // [red, green, blue] (0-255 each)
    examples: {
      red: [255, 0, 0],
      green: [0, 255, 0],
      blue: [0, 0, 255],
      white: [255, 255, 255],
      off: [0, 0, 0]
    }
  }
};
```

### Vibration Control Operations
```javascript
const VIBRATION_OPERATIONS = {
  'vibrationControl': {
    uuid: '000015271212efde1523785feabcd123',
    valueFormat: 'intensity', // [intensity] (0-255)
    examples: {
      light: [50],
      medium: [128],
      strong: [200],
      maximum: [255],
      off: [0]
    }
  }
};
```

### Sound Control Operations
```javascript
const SOUND_OPERATIONS = {
  'soundControl': {
    uuid: '000015281212efde1523785feabcd123',
    valueFormat: 'frequency_duration', // [frequency_hz, duration_ms]
    examples: {
      beep: [440, 200],
      chirp: [800, 100],
      buzz: [200, 500],
      silent: [0, 0]
    }
  }
};
```

## Message Validation

### Client-Side Validation
```javascript
function validateOutgoingMessage(message) {
  // Required fields
  if (!message.type) {
    throw new Error('Message must have a type');
  }
  
  // Type-specific validation
  switch (message.type) {
    case 'characteristicChanged':
      if (!message.deviceId) {
        throw new Error('characteristicChanged requires deviceId');
      }
      if (!message.characteristicUUID) {
        throw new Error('characteristicChanged requires characteristicUUID');
      }
      if (!Array.isArray(message.value)) {
        throw new Error('characteristicChanged value must be an array');
      }
      break;
      
    case 'lockDevices':
      if (typeof message.isLocked !== 'boolean') {
        throw new Error('lockDevices requires boolean isLocked');
      }
      if (!Array.isArray(message.deviceIds)) {
        throw new Error('lockDevices requires deviceIds array');
      }
      break;
      
    default:
      console.warn('Unknown message type:', message.type);
  }
  
  return true;
}
```

### Server Response Validation
```javascript
function validateIncomingMessage(message) {
  if (!message || typeof message !== 'object') {
    throw new Error('Invalid message format');
  }
  
  if (!message.type) {
    throw new Error('Message missing type field');
  }
  
  // Type-specific validation
  switch (message.type) {
    case 'deviceUpdate':
      if (!message.devices && !message.device) {
        throw new Error('deviceUpdate requires devices or device field');
      }
      break;
      
    case 'buttonStateChanged':
      if (!message.deviceId) {
        throw new Error('buttonStateChanged requires deviceId');
      }
      if (!['pressed', 'released'].includes(message.buttonState)) {
        throw new Error('buttonStateChanged requires valid buttonState');
      }
      break;
      
    case 'error':
      if (!message.message) {
        throw new Error('error message requires message field');
      }
      break;
  }
  
  return true;
}
```

## Error Codes

### Connection Errors
- **`BLE_CONNECTION_FAILED`** - Failed to establish BLE connection
- **`WEBSOCKET_CONNECTION_LOST`** - WebSocket connection interrupted
- **`DEVICE_NOT_FOUND`** - Specified device not available
- **`PAIRING_FAILED`** - Device pairing unsuccessful

### Characteristic Errors
- **`CHARACTERISTIC_NOT_FOUND`** - Characteristic UUID not supported
- **`WRITE_FAILED`** - Failed to write characteristic value
- **`READ_FAILED`** - Failed to read characteristic value
- **`NOTIFY_FAILED`** - Failed to subscribe to notifications

### System Errors
- **`BRIDGE_NOT_READY`** - Cosmoid Bridge not initialized
- **`INVALID_MESSAGE_FORMAT`** - Malformed message received
- **`OPERATION_NOT_SUPPORTED`** - Requested operation not available
- **`DEVICE_LOCKED`** - Device locked by another session

## Rate Limiting

### Message Frequency Limits
- **Characteristic writes**: Maximum 10 messages/second per device
- **Lock operations**: Maximum 1 message/second
- **Ping messages**: Maximum 1 message/10 seconds

### Implementation Example
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

// Usage
const characteristicLimiter = new RateLimiter(10, 1000); // 10 messages per second

function sendCharacteristicMessage(message) {
  if (!characteristicLimiter.canSend()) {
    console.warn('Rate limit exceeded for characteristic messages');
    return false;
  }
  
  wsService.send(message);
  characteristicLimiter.recordMessage();
  return true;
}
```

## Testing Message Protocol

### Mock Message Generator
```javascript
const mockMessages = {
  deviceUpdate: (deviceId = 'test-device') => ({
    type: 'deviceUpdate',
    devices: [{
      id: deviceId,
      name: 'Test Cosmo',
      serial: '1234567890',
      firmware: '4.6.00',
      batteryLevel: 75,
      isConnected: true,
      connectionState: 'connected'
    }]
  }),
  
  buttonPress: (deviceId = 'test-device') => ({
    type: 'buttonStateChanged',
    deviceId,
    buttonState: 'pressed',
    pressValue: 255
  }),
  
  buttonRelease: (deviceId = 'test-device') => ({
    type: 'buttonStateChanged',
    deviceId,
    buttonState: 'released',
    pressValue: 0
  })
};

// Usage in tests
const testMessage = mockMessages.buttonPress('device-123');
wsService.notifyListeners(testMessage);
```

## Best Practices

1. **Always validate messages** before processing
2. **Handle unknown message types gracefully** - log and ignore
3. **Implement proper error handling** for all message types
4. **Use consistent timestamp formats** (ISO 8601)
5. **Include device context** in error messages
6. **Respect rate limits** to avoid overwhelming the bridge
7. **Log message flows** for debugging purposes
8. **Version your protocol** for future compatibility

## Related Documentation

- [01-INTEGRATION-websocket-communication.md](./01-INTEGRATION-websocket-communication.md) - WebSocket implementation
- [01-INTEGRATION-button-press-handling.md](./01-INTEGRATION-button-press-handling.md) - Button event handling
- [01-INTEGRATION-device-management.md](./01-INTEGRATION-device-management.md) - Device lifecycle management
- [03-API-device-characteristics.md](./03-API-device-characteristics.md) - BLE characteristic details
