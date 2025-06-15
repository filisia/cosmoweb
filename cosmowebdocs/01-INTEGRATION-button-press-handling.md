# Button Press Event Handling

## Overview

This document provides comprehensive guidance for web developers on implementing button press detection and handling in Cosmoweb applications. The button press system enables real-time interaction between physical Cosmo devices and web-based games.

## Button Press Flow

```
┌─────────────────┐    Physical    ┌─────────────────┐    BLE       ┌─────────────────┐
│  Cosmo Device   │    Button      │   BLE Adapter   │   Notify     │ Cosmoid Bridge  │
│   (Hardware)    │ ──── Press ──→ │    (Mac/Win)    │ ────────────→│  (WebSocket)    │
└─────────────────┘                └─────────────────┘              └─────────────────┘
                                                                              │
                                                                              │ WebSocket
                                                                              │ Message
                                                                              ▼
┌─────────────────┐    React       ┌─────────────────┐    Context    ┌─────────────────┐
│   Game UI       │    Update      │  Game Component │   Update      │ WebSocketContext│
│  (Visual)       │ ◄──────────────│   (Logic)       │ ◄────────────│   (State)       │
└─────────────────┘                └─────────────────┘               └─────────────────┘
```

## Button Press Message Format

### WebSocket Message Structure
```json
{
  "type": "buttonStateChanged",
  "deviceId": "device-uuid-string",
  "buttonState": "pressed", // "pressed" or "released"
  "pressValue": 255 // 255 for pressed, 0 for released
}
```

### Raw BLE Data Mapping
- **Pressed**: `rawData = [255]` → `buttonState = "pressed"`, `pressValue = 255`
- **Released**: `rawData = [0]` → `buttonState = "released"`, `pressValue = 0`

## Implementation Patterns

### 1. Basic Button Press Detection

```javascript
import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';

function ButtonGameComponent() {
  const { wsConnected, deviceValues, connectedDevices } = useWebSocket();
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [buttonState, setButtonState] = useState('released');
  const [pressCount, setPressCount] = useState(0);

  // Auto-select first connected device
  useEffect(() => {
    if (connectedDevices.length > 0 && !selectedDevice) {
      setSelectedDevice(connectedDevices[0].id);
    } else if (connectedDevices.length === 0) {
      setSelectedDevice(null);
    }
  }, [connectedDevices, selectedDevice]);

  // Handle button state changes
  useEffect(() => {
    if (!selectedDevice || !deviceValues[selectedDevice]) return;
    
    const currentButtonState = deviceValues[selectedDevice].buttonStatus;
    
    if (currentButtonState !== buttonState) {
      console.log('[ButtonGame] Button state changed:', 
        buttonState, '→', currentButtonState);
      
      setButtonState(currentButtonState);
      
      // Increment counter on press
      if (currentButtonState === 'pressed') {
        setPressCount(prev => prev + 1);
      }
    }
  }, [selectedDevice, deviceValues, buttonState]);

  if (!wsConnected) {
    return <div>Connecting to Cosmo Bridge...</div>;
  }

  if (!selectedDevice) {
    return <div>No Cosmo device connected</div>;
  }

  return (
    <div className="button-game">
      <h2>Button Press Game</h2>
      <div className={`button-indicator ${buttonState}`}>
        Button: {buttonState}
      </div>
      <div>Press Count: {pressCount}</div>
    </div>
  );
}

export default ButtonGameComponent;
```

### 2. Advanced Button Press Handling with Timing

```javascript
import React, { useEffect, useState, useRef } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';

function TimedButtonGame() {
  const { deviceValues, connectedDevices } = useWebSocket();
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [buttonState, setButtonState] = useState('released');
  const [pressStartTime, setPressStartTime] = useState(null);
  const [pressDuration, setPressDuration] = useState(0);
  const [rapidPresses, setRapidPresses] = useState([]);
  const rapidPressTimeoutRef = useRef(null);

  // Device selection logic (same as basic example)
  useEffect(() => {
    if (connectedDevices.length > 0 && !selectedDevice) {
      setSelectedDevice(connectedDevices[0].id);
    } else if (connectedDevices.length === 0) {
      setSelectedDevice(null);
    }
  }, [connectedDevices, selectedDevice]);

  // Advanced button handling with timing
  useEffect(() => {
    if (!selectedDevice || !deviceValues[selectedDevice]) return;
    
    const currentButtonState = deviceValues[selectedDevice].buttonStatus;
    
    if (currentButtonState !== buttonState) {
      const now = Date.now();
      
      if (currentButtonState === 'pressed') {
        // Button pressed
        console.log('[TimedGame] Button pressed at:', now);
        setPressStartTime(now);
        setButtonState('pressed');
        
        // Track rapid presses
        setRapidPresses(prev => {
          const newPresses = [...prev, now];
          // Keep only presses from last 2 seconds
          return newPresses.filter(time => now - time < 2000);
        });
        
      } else if (currentButtonState === 'released' && pressStartTime) {
        // Button released
        const duration = now - pressStartTime;
        console.log('[TimedGame] Button released, duration:', duration, 'ms');
        
        setButtonState('released');
        setPressDuration(duration);
        setPressStartTime(null);
        
        // Classify press type
        if (duration < 200) {
          handleQuickPress();
        } else if (duration > 1000) {
          handleLongPress(duration);
        } else {
          handleNormalPress(duration);
        }
      }
    }
  }, [selectedDevice, deviceValues, buttonState, pressStartTime]);

  const handleQuickPress = () => {
    console.log('[TimedGame] Quick press detected');
    // Quick press logic here
  };

  const handleNormalPress = (duration) => {
    console.log('[TimedGame] Normal press:', duration, 'ms');
    // Normal press logic here
  };

  const handleLongPress = (duration) => {
    console.log('[TimedGame] Long press:', duration, 'ms');
    // Long press logic here
  };

  // Detect rapid pressing (more than 3 presses in 2 seconds)
  const isRapidPressing = rapidPresses.length > 3;

  return (
    <div className="timed-button-game">
      <h2>Timed Button Game</h2>
      
      <div className={`button-indicator ${buttonState}`}>
        Button: {buttonState}
      </div>
      
      {pressStartTime && (
        <div>Press duration: {Date.now() - pressStartTime}ms</div>
      )}
      
      {pressDuration > 0 && (
        <div>Last press: {pressDuration}ms</div>
      )}
      
      <div>Recent presses: {rapidPresses.length}</div>
      
      {isRapidPressing && (
        <div className="rapid-press-indicator">
          🔥 Rapid pressing detected!
        </div>
      )}
    </div>
  );
}

export default TimedButtonGame;
```

### 3. Multi-Device Button Handling

```javascript
import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';

function MultiDeviceButtonGame() {
  const { deviceValues, connectedDevices } = useWebSocket();
  const [deviceStates, setDeviceStates] = useState({});
  const [scores, setScores] = useState({});

  // Initialize device states when devices connect/disconnect
  useEffect(() => {
    const newDeviceStates = {};
    const newScores = {};
    
    connectedDevices.forEach(device => {
      newDeviceStates[device.id] = {
        buttonState: 'released',
        lastPressTime: null
      };
      
      // Preserve existing scores
      newScores[device.id] = scores[device.id] || 0;
    });
    
    setDeviceStates(newDeviceStates);
    setScores(newScores);
  }, [connectedDevices]);

  // Handle button changes for all devices
  useEffect(() => {
    Object.keys(deviceStates).forEach(deviceId => {
      if (!deviceValues[deviceId]) return;
      
      const currentButtonState = deviceValues[deviceId].buttonStatus;
      const previousButtonState = deviceStates[deviceId].buttonState;
      
      if (currentButtonState !== previousButtonState) {
        console.log(`[MultiDevice] Device ${deviceId} button:`, 
          previousButtonState, '→', currentButtonState);
        
        // Update device state
        setDeviceStates(prev => ({
          ...prev,
          [deviceId]: {
            ...prev[deviceId],
            buttonState: currentButtonState,
            lastPressTime: currentButtonState === 'pressed' ? Date.now() : prev[deviceId].lastPressTime
          }
        }));
        
        // Update score on press
        if (currentButtonState === 'pressed') {
          setScores(prev => ({
            ...prev,
            [deviceId]: (prev[deviceId] || 0) + 1
          }));
        }
      }
    });
  }, [deviceValues, deviceStates]);

  return (
    <div className="multi-device-game">
      <h2>Multi-Device Button Game</h2>
      
      {connectedDevices.length === 0 ? (
        <div>No devices connected</div>
      ) : (
        <div className="device-grid">
          {connectedDevices.map(device => (
            <div key={device.id} className="device-card">
              <h3>{device.name || `Device ${device.serial}`}</h3>
              
              <div className={`button-status ${deviceStates[device.id]?.buttonState || 'released'}`}>
                {deviceStates[device.id]?.buttonState || 'released'}
              </div>
              
              <div className="score">
                Score: {scores[device.id] || 0}
              </div>
              
              <div className="device-info">
                <small>Serial: {device.serial}</small><br/>
                <small>Battery: {device.batteryLevel}%</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MultiDeviceButtonGame;
```

## GamePress Component Analysis

The existing `GamePress.js` component demonstrates production-ready button press handling:

### Key Features:
1. **Confetti Animation**: Visual feedback on button press
2. **Game State Management**: Tracks game status and progress
3. **Device Selection**: Auto-selects first available device
4. **Debug Logging**: Comprehensive logging for troubleshooting

### Code Highlights:
```javascript
// From GamePress.js - Button state change detection
useEffect(() => {
  if (!selectedDevice || !deviceValues[selectedDevice]) return;
  
  const currentButtonState = deviceValues[selectedDevice].buttonStatus;
  
  if (currentButtonState !== lastButtonState) {
    setLastButtonState(currentButtonState);
    
    if (currentButtonState === 'pressed') {
      // Trigger confetti and update game state
      setExplodeConfetti(true);
      setGameStatus('Button Pressed!');
      
      // Reset confetti after animation
      setTimeout(() => setExplodeConfetti(false), 1000);
    } else {
      setGameStatus('Ready for next press');
    }
  }
}, [selectedDevice, deviceValues, lastButtonState]);
```

## Performance Optimization

### 1. Debouncing Rapid Updates
```javascript
import { useCallback, useRef } from 'react';

function useDebounce(callback, delay) {
  const timeoutRef = useRef(null);
  
  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
}

// Usage in component
const debouncedButtonHandler = useDebounce((buttonState) => {
  // Handle button state change
  console.log('Debounced button state:', buttonState);
}, 50); // 50ms debounce
```

### 2. Memoizing Button State
```javascript
import { useMemo } from 'react';

function ButtonComponent() {
  const { deviceValues, selectedDevice } = useWebSocket();
  
  const buttonState = useMemo(() => {
    if (!selectedDevice || !deviceValues[selectedDevice]) {
      return 'disconnected';
    }
    return deviceValues[selectedDevice].buttonStatus || 'released';
  }, [selectedDevice, deviceValues]);
  
  // Use memoized buttonState
}
```

## Error Handling

### 1. Device Disconnection
```javascript
useEffect(() => {
  if (selectedDevice && !connectedDevices.find(d => d.id === selectedDevice)) {
    console.log('[ButtonGame] Selected device disconnected');
    setSelectedDevice(null);
    setButtonState('released');
    // Show user notification
    showNotification('Device disconnected', 'warning');
  }
}, [selectedDevice, connectedDevices]);
```

### 2. Invalid Button States
```javascript
const validateButtonState = (state) => {
  const validStates = ['pressed', 'released'];
  if (!validStates.includes(state)) {
    console.warn('[ButtonGame] Invalid button state:', state);
    return 'released'; // Default fallback
  }
  return state;
};
```

## Testing Button Press Handling

### 1. Unit Testing
```javascript
import { render, screen } from '@testing-library/react';
import { WebSocketProvider } from '../contexts/WebSocketContext';
import ButtonGameComponent from './ButtonGameComponent';

// Mock WebSocket context
const mockContextValue = {
  wsConnected: true,
  deviceValues: {
    'device-1': { buttonStatus: 'pressed' }
  },
  connectedDevices: [{ id: 'device-1', name: 'Test Device' }]
};

test('displays button press state', () => {
  render(
    <WebSocketProvider value={mockContextValue}>
      <ButtonGameComponent />
    </WebSocketProvider>
  );
  
  expect(screen.getByText('Button: pressed')).toBeInTheDocument();
});
```

### 2. Integration Testing
```javascript
// Test button press sequence
const simulateButtonPress = (deviceId) => {
  // Simulate press
  act(() => {
    mockWsService.notifyListeners({
      type: 'buttonStateChanged',
      deviceId,
      buttonState: 'pressed',
      pressValue: 255
    });
  });
  
  // Simulate release
  act(() => {
    mockWsService.notifyListeners({
      type: 'buttonStateChanged',
      deviceId,
      buttonState: 'released',
      pressValue: 0
    });
  });
};
```

## Troubleshooting

### Common Issues:

1. **Button events not received**
   - Check WebSocket connection status
   - Verify device is properly connected
   - Check browser console for WebSocket errors

2. **Delayed button response**
   - Check network latency
   - Verify no debouncing is interfering
   - Check for heavy rendering in components

3. **Multiple button events**
   - Implement proper event deduplication
   - Check for duplicate listeners
   - Verify cleanup in useEffect

### Debug Logging:
```javascript
// Enable detailed button press logging
const DEBUG_BUTTON_EVENTS = process.env.NODE_ENV === 'development';

useEffect(() => {
  if (DEBUG_BUTTON_EVENTS) {
    console.log('[DEBUG] Button state change:', {
      deviceId: selectedDevice,
      previousState: buttonState,
      newState: currentButtonState,
      timestamp: new Date().toISOString(),
      deviceValues: deviceValues[selectedDevice]
    });
  }
}, [selectedDevice, deviceValues, buttonState]);
```

## Best Practices

1. **Always validate device selection** before processing button events
2. **Implement proper cleanup** in useEffect to prevent memory leaks
3. **Use meaningful state names** that clearly indicate button status
4. **Provide visual feedback** for button presses (animations, sounds, etc.)
5. **Handle edge cases** like device disconnection during button press
6. **Log strategically** for debugging without overwhelming the console
7. **Test with multiple devices** to ensure proper isolation
8. **Consider accessibility** for users who may not be able to use physical buttons

## Related Documentation

- [01-INTEGRATION-websocket-communication.md](./01-INTEGRATION-websocket-communication.md) - WebSocket architecture
- [02-COMPONENTS-gamepress-implementation.md](./02-COMPONENTS-gamepress-implementation.md) - GamePress component details
- [03-API-websocket-message-protocol.md](./03-API-websocket-message-protocol.md) - Message specifications
- [04-DEVELOPMENT-testing-guide.md](./04-DEVELOPMENT-testing-guide.md) - Testing strategies
