# WebSocket Communication Architecture

## Overview

Cosmoweb uses WebSocket communication to establish real-time bidirectional communication with the Cosmoid Bridge server. This document provides comprehensive guidance for web developers on implementing and extending WebSocket functionality.

## Architecture Diagram

```
┌─────────────────┐    WebSocket     ┌─────────────────┐    BLE      ┌─────────────────┐
│   Cosmoweb      │ ←─────────────→  │ Cosmoid Bridge  │ ←─────────→ │  Cosmo Device   │
│  (React App)    │  ws://localhost  │  (Node.js)      │             │   (Hardware)    │
│                 │      :8080       │                 │             │                 │
└─────────────────┘                  └─────────────────┘             └─────────────────┘
```

## Core Components

### 1. WebSocketService (`src/services/WebSocketService.js`)

The singleton service that manages the WebSocket connection lifecycle.

#### Key Features:
- **Auto-reconnection**: Exponential backoff with configurable retry attempts
- **Connection State Management**: Tracks connection status and handles state changes
- **Event Broadcasting**: Notifies all registered listeners of incoming messages
- **Error Handling**: Comprehensive error handling and logging

#### Configuration:
```javascript
// Default configuration
this.wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8080';
this.maxReconnectAttempts = 5;
this.reconnectDelay = 1000; // Base delay in milliseconds
```

#### Usage Example:
```javascript
import wsService from '../services/WebSocketService';

// Add a message listener
const removeListener = wsService.addListener((data) => {
  console.log('Received WebSocket message:', data);
  // Handle different message types
  switch (data.type) {
    case 'deviceUpdate':
      handleDeviceUpdate(data);
      break;
    case 'buttonStateChanged':
      handleButtonPress(data);
      break;
    default:
      console.log('Unknown message type:', data.type);
  }
});

// Send a message
wsService.send({
  type: 'characteristicChanged',
  deviceId: 'device-123',
  characteristicUUID: 'some-uuid',
  value: [255]
});

// Clean up listener
removeListener();
```

### 2. WebSocketContext (`src/contexts/WebSocketContext.js`)

React Context that provides WebSocket state and operations to components.

#### State Management:
```javascript
const [wsConnected, setWsConnected] = useState(false);
const [connectionError, setConnectionError] = useState(null);
const [connectedDevices, setConnectedDevices] = useState([]);
const [deviceValues, setDeviceValues] = useState({});
const [lockState, setLockState] = useState({ isLocked: false, deviceIds: [] });
const [connectionLogs, setConnectionLogs] = useState([]);
```

#### Context Provider Usage:
```javascript
import { WebSocketProvider, useWebSocket } from './contexts/WebSocketContext';

// Wrap your app
function App() {
  return (
    <WebSocketProvider>
      <YourComponents />
    </WebSocketProvider>
  );
}

// Use in components
function MyComponent() {
  const { 
    wsConnected, 
    connectedDevices, 
    deviceValues,
    sendCharacteristicOperation,
    lockDevices 
  } = useWebSocket();
  
  // Component logic here
}
```

## Message Protocol

### Incoming Messages (Bridge → Cosmoweb)

#### 1. Device Updates
```json
{
  "type": "deviceUpdate",
  "devices": [
    {
      "id": "device-uuid",
      "name": "Cosmo Device",
      "serial": "2405002009",
      "firmware": "4.6.00",
      "batteryLevel": 85,
      "isConnected": true,
      "connectionState": "connected"
    }
  ]
}
```

#### 2. Button State Changes
```json
{
  "type": "buttonStateChanged",
  "deviceId": "device-uuid",
  "buttonState": "pressed", // or "released"
  "pressValue": 255 // 255 for pressed, 0 for released
}
```

#### 3. Characteristic Value Updates
```json
{
  "type": "characteristicValueChanged",
  "deviceId": "device-uuid",
  "characteristicUUID": "characteristic-uuid",
  "value": [255, 128, 0], // Array of bytes
  "operation": "ledControl" // Mapped operation name
}
```

#### 4. Lock State Updates
```json
{
  "type": "lockStateChanged",
  "isLocked": true,
  "deviceIds": ["device-1", "device-2"]
}
```

### Outgoing Messages (Cosmoweb → Bridge)

#### 1. Characteristic Operations
```json
{
  "type": "characteristicChanged",
  "deviceId": "device-uuid",
  "characteristicUUID": "characteristic-uuid",
  "value": [255, 0, 128] // Array of bytes
}
```

#### 2. Device Lock/Unlock
```json
{
  "type": "lockDevices",
  "isLocked": true,
  "deviceIds": ["device-1", "device-2"]
}
```

## Implementation Patterns

### 1. Message Handling Pattern

```javascript
useEffect(() => {
  const handleWebSocketMessage = (data) => {
    console.log(`[${componentName}] Received message:`, data.type);
    
    switch (data.type) {
      case 'deviceUpdate':
        // Update device list
        setConnectedDevices(data.devices || []);
        break;
        
      case 'buttonStateChanged':
        // Handle button press
        if (data.deviceId === selectedDevice) {
          handleButtonPress(data.buttonState, data.pressValue);
        }
        break;
        
      case 'characteristicValueChanged':
        // Handle characteristic updates
        updateDeviceValue(data.deviceId, data.operation, data.value);
        break;
        
      default:
        console.log(`[${componentName}] Unknown message type:`, data.type);
    }
  };

  const removeListener = wsService.addListener(handleWebSocketMessage);
  return removeListener; // Cleanup on unmount
}, [selectedDevice]); // Dependencies
```

### 2. Device Selection Pattern

```javascript
const [selectedDevice, setSelectedDevice] = useState(null);

// Auto-select first connected device
useEffect(() => {
  if (connectedDevices.length > 0 && !selectedDevice) {
    const firstDevice = connectedDevices[0];
    console.log(`[${componentName}] Auto-selecting device:`, firstDevice.id);
    setSelectedDevice(firstDevice.id);
  } else if (connectedDevices.length === 0) {
    console.log(`[${componentName}] No devices connected, clearing selection`);
    setSelectedDevice(null);
  }
}, [connectedDevices, selectedDevice]);
```

### 3. Button Press Handling Pattern

```javascript
const [buttonState, setButtonState] = useState('released');
const [pressCount, setPressCount] = useState(0);

useEffect(() => {
  if (!selectedDevice || !deviceValues[selectedDevice]) return;
  
  const currentButtonState = deviceValues[selectedDevice].buttonStatus;
  
  if (currentButtonState !== buttonState) {
    console.log(`[${componentName}] Button state changed:`, 
      buttonState, '→', currentButtonState);
    
    setButtonState(currentButtonState);
    
    // Handle press event
    if (currentButtonState === 'pressed') {
      setPressCount(prev => prev + 1);
      onButtonPress?.(); // Optional callback
    }
  }
}, [selectedDevice, deviceValues, buttonState]);
```

## Error Handling

### Connection Errors
```javascript
const { connectionError, wsConnected } = useWebSocket();

if (connectionError) {
  return (
    <div className="error-container">
      <h3>Connection Error</h3>
      <p>{connectionError}</p>
      <button onClick={() => window.location.reload()}>
        Retry Connection
      </button>
    </div>
  );
}

if (!wsConnected) {
  return (
    <div className="loading-container">
      <p>Connecting to Cosmo Bridge...</p>
    </div>
  );
}
```

### Message Validation
```javascript
const validateMessage = (data) => {
  if (!data || typeof data !== 'object') {
    console.error('[WebSocket] Invalid message format:', data);
    return false;
  }
  
  if (!data.type) {
    console.error('[WebSocket] Message missing type:', data);
    return false;
  }
  
  return true;
};
```

## Performance Considerations

### 1. Listener Management
- Always clean up listeners in useEffect cleanup
- Use specific dependencies to avoid unnecessary re-renders
- Debounce rapid state updates if needed

### 2. State Updates
- Batch related state updates using functional updates
- Use React.memo for components that receive frequent updates
- Consider using useCallback for event handlers

### 3. Message Filtering
- Filter messages at the component level to reduce unnecessary processing
- Use device-specific listeners when possible
- Implement message queuing for high-frequency updates

## Debugging

### Enable Debug Logging
```javascript
// In WebSocketService.js, enable verbose logging
const DEBUG_WEBSOCKET = process.env.NODE_ENV === 'development';

if (DEBUG_WEBSOCKET) {
  console.log('[WebSocketService] Debug message:', data);
}
```

### Common Debug Patterns
```javascript
// Log all WebSocket messages
useEffect(() => {
  const debugListener = (data) => {
    console.log(`[DEBUG] WebSocket message:`, {
      type: data.type,
      timestamp: new Date().toISOString(),
      data: data
    });
  };
  
  return wsService.addListener(debugListener);
}, []);
```

## Testing

### Mock WebSocket Service
```javascript
// For testing, create a mock WebSocket service
const mockWsService = {
  addListener: jest.fn(() => jest.fn()),
  send: jest.fn(),
  isConnected: () => true
};

// Use in tests
jest.mock('../services/WebSocketService', () => mockWsService);
```

### Integration Testing
```javascript
// Test WebSocket message handling
const testMessage = {
  type: 'buttonStateChanged',
  deviceId: 'test-device',
  buttonState: 'pressed',
  pressValue: 255
};

// Simulate message reception
act(() => {
  wsService.notifyListeners(testMessage);
});

// Assert component state changes
expect(screen.getByText('Button Pressed')).toBeInTheDocument();
```

## Best Practices

1. **Always handle connection states** - Show appropriate UI for connecting, connected, and error states
2. **Clean up listeners** - Prevent memory leaks by removing listeners in useEffect cleanup
3. **Validate messages** - Always validate incoming WebSocket messages before processing
4. **Use specific dependencies** - Include only necessary dependencies in useEffect arrays
5. **Log strategically** - Use consistent logging patterns for debugging
6. **Handle errors gracefully** - Provide user-friendly error messages and recovery options
7. **Test thoroughly** - Test both happy path and error scenarios

## Related Documentation

- [01-INTEGRATION-button-press-handling.md](./01-INTEGRATION-button-press-handling.md) - Button-specific integration
- [02-COMPONENTS-websocket-context.md](./02-COMPONENTS-websocket-context.md) - Context usage patterns
- [03-API-websocket-message-protocol.md](./03-API-websocket-message-protocol.md) - Complete message specifications
- [04-DEVELOPMENT-troubleshooting.md](./04-DEVELOPMENT-troubleshooting.md) - Common issues and solutions
