# GamePress Component Implementation Guide

## Overview

The GamePress component (`src/GamePress.js`) serves as a comprehensive example of button press integration and game mechanics in the Cosmoweb ecosystem. This document provides detailed analysis and implementation guidance for web developers building similar interactive components.

## Component Architecture

### Core Dependencies
```javascript
import React, { useEffect, useState } from 'react';
import Confetti from 'react-dom-confetti';
import { useWebSocket } from './contexts/WebSocketContext';
```

### State Management
```javascript
const [explodeConfetti, setExplodeConfetti] = useState(false);
const [gameStatus, setGameStatus] = useState('Idle');
const [selectedDevice, setSelectedDevice] = useState(null);
const [lastButtonState, setLastButtonState] = useState(null);
```

## Key Implementation Patterns

### 1. Device Auto-Selection Logic

```javascript
// Auto-select first connected device
useEffect(() => {
  console.log('[GamePress] Connected devices changed:', connectedDevices);
  if (connectedDevices.length > 0) {
    const newSelectedDevice = connectedDevices[0].id;
    console.log('[GamePress] Setting selected device to:', newSelectedDevice);
    setSelectedDevice(newSelectedDevice);
  } else {
    console.log('[GamePress] No devices connected, clearing selected device');
    setSelectedDevice(null);
  }
}, [connectedDevices]);
```

**Key Features:**
- Automatically selects the first available device
- Clears selection when no devices are connected
- Comprehensive logging for debugging
- Handles device connection/disconnection gracefully

### 2. Button State Change Detection

```javascript
// Handle button state changes with comprehensive logging
useEffect(() => {
  console.log('[GamePress] Checking for button state changes:', {
    selectedDevice,
    deviceValues,
    deviceValuesForSelected: selectedDevice ? deviceValues[selectedDevice] : null
  });
  
  if (!selectedDevice) {
    console.log('[GamePress] No device selected');
    return;
  }
  
  if (!deviceValues || !deviceValues[selectedDevice]) {
    console.log('[GamePress] No device values for selected device');
    return;
  }
  
  const currentButtonState = deviceValues[selectedDevice].buttonStatus;
  console.log('[GamePress] Current button state:', currentButtonState, 'Last state:', lastButtonState);
  
  if (currentButtonState !== lastButtonState) {
    console.log('[GamePress] Button state changed from', lastButtonState, 'to', currentButtonState);
    setLastButtonState(currentButtonState);
    
    if (currentButtonState === 'pressed') {
      console.log('[GamePress] Button pressed - triggering confetti!');
      setExplodeConfetti(true);
      setGameStatus('Button Pressed! 🎉');
      
      // Reset confetti after animation completes
      setTimeout(() => {
        console.log('[GamePress] Resetting confetti');
        setExplodeConfetti(false);
      }, 1000);
    } else if (currentButtonState === 'released') {
      console.log('[GamePress] Button released');
      setGameStatus('Ready for next press');
    }
  }
}, [selectedDevice, deviceValues, lastButtonState]);
```

**Key Features:**
- Validates device selection and data availability
- Detects button state changes with proper comparison
- Triggers visual feedback (confetti) on button press
- Updates game status with appropriate messages
- Includes comprehensive debug logging

### 3. Visual Feedback System

```javascript
// Confetti configuration
const confettiConfig = {
  angle: 90,
  spread: 360,
  startVelocity: 40,
  elementCount: 70,
  dragFriction: 0.12,
  duration: 3000,
  stagger: 3,
  width: "10px",
  height: "10px",
  perspective: "500px",
  colors: ["#a864fd", "#29cdff", "#78ff44", "#ff718d", "#fdff6a"]
};

// Confetti component usage
<div className="confetti-container">
  <Confetti active={explodeConfetti} config={confettiConfig} />
</div>
```

**Key Features:**
- Customizable confetti animation
- Automatic reset after animation duration
- Colorful and engaging visual feedback
- Performance-optimized with controlled activation

## Complete Component Structure

### JSX Layout
```javascript
return (
  <div className="game-press-container">
    {/* Header Section */}
    <div className="game-header">
      <h1 className="game-title">🎮 Game Press</h1>
      <p className="game-subtitle">Press your Cosmo device button to trigger confetti!</p>
    </div>

    {/* Connection Status */}
    <div className="connection-status">
      {!wsConnected ? (
        <div className="status-message connecting">
          <div className="status-icon">🔄</div>
          <span>Connecting to Cosmo Bridge...</span>
          {connectionError && (
            <div className="error-details">Error: {connectionError}</div>
          )}
        </div>
      ) : !selectedDevice ? (
        <div className="status-message no-device">
          <div className="status-icon">📱</div>
          <span>No Cosmo device connected</span>
          <small>Make sure your device is turned on and nearby</small>
        </div>
      ) : (
        <div className="status-message connected">
          <div className="status-icon">✅</div>
          <span>Connected to {getDeviceName(selectedDevice)}</span>
        </div>
      )}
    </div>

    {/* Game Area */}
    {wsConnected && selectedDevice && (
      <div className="game-area">
        {/* Confetti Container */}
        <div className="confetti-container">
          <Confetti active={explodeConfetti} config={confettiConfig} />
        </div>

        {/* Game Status */}
        <div className="game-status">
          <h2 className="status-text">{gameStatus}</h2>
          <div className={`button-indicator ${lastButtonState || 'released'}`}>
            <div className="button-visual">
              <span className="button-emoji">
                {lastButtonState === 'pressed' ? '🔴' : '⚪'}
              </span>
            </div>
            <span className="button-label">
              {lastButtonState === 'pressed' ? 'PRESSED' : 'READY'}
            </span>
          </div>
        </div>

        {/* Device Info */}
        <div className="device-info">
          <DeviceInfoCard deviceId={selectedDevice} />
        </div>
      </div>
    )}
  </div>
);
```

## Helper Functions

### Device Name Resolution
```javascript
const getDeviceName = (deviceId) => {
  const device = connectedDevices.find(d => d.id === deviceId);
  return device ? (device.name || `Cosmo ${device.serial}`) : 'Unknown Device';
};
```

### Device Info Card Component
```javascript
function DeviceInfoCard({ deviceId }) {
  const { connectedDevices } = useWebSocket();
  const device = connectedDevices.find(d => d.id === deviceId);
  
  if (!device) return null;
  
  return (
    <div className="device-info-card">
      <h3>Device Information</h3>
      <div className="info-grid">
        <div className="info-item">
          <label>Serial:</label>
          <span>{device.serial}</span>
        </div>
        <div className="info-item">
          <label>Firmware:</label>
          <span>{device.firmware}</span>
        </div>
        <div className="info-item">
          <label>Battery:</label>
          <span className={`battery-level ${getBatteryClass(device.batteryLevel)}`}>
            {device.batteryLevel}%
          </span>
        </div>
      </div>
    </div>
  );
}

const getBatteryClass = (level) => {
  if (level > 60) return 'high';
  if (level > 30) return 'medium';
  return 'low';
};
```

## Styling Guidelines

### CSS Structure
```css
.game-press-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Inter', sans-serif;
}

.game-header {
  text-align: center;
  margin-bottom: 30px;
}

.game-title {
  font-size: 2.5rem;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 10px;
}

.connection-status {
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
  border: 2px solid #e2e8f0;
}

.status-message {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.1rem;
}

.status-message.connected {
  color: #059669;
}

.status-message.connecting {
  color: #d97706;
}

.status-message.no-device {
  color: #6b7280;
}

.confetti-container {
  position: relative;
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.button-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  padding: 30px;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.button-indicator.pressed {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  transform: scale(1.05);
  box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3);
}

.button-indicator.released {
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  color: #475569;
}

.button-visual {
  font-size: 4rem;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
```

## Advanced Features

### 1. Press Counter Extension
```javascript
const [pressCount, setPressCount] = useState(0);
const [pressHistory, setPressHistory] = useState([]);

// Enhanced button press handling
if (currentButtonState === 'pressed') {
  const pressTime = new Date().toISOString();
  setPressCount(prev => prev + 1);
  setPressHistory(prev => [
    ...prev.slice(-9), // Keep last 10 presses
    { timestamp: pressTime, count: pressCount + 1 }
  ]);
  
  setExplodeConfetti(true);
  setGameStatus(`Button Pressed! Count: ${pressCount + 1} 🎉`);
}
```

### 2. Timing-Based Challenges
```javascript
const [challengeMode, setChallengeMode] = useState(false);
const [targetPresses, setTargetPresses] = useState(10);
const [timeLimit, setTimeLimit] = useState(30000); // 30 seconds
const [challengeStartTime, setChallengeStartTime] = useState(null);

const startChallenge = () => {
  setChallengeMode(true);
  setPressCount(0);
  setChallengeStartTime(Date.now());
  setGameStatus(`Press ${targetPresses} times in ${timeLimit/1000} seconds!`);
  
  // Auto-end challenge after time limit
  setTimeout(() => {
    if (challengeMode) {
      endChallenge();
    }
  }, timeLimit);
};

const endChallenge = () => {
  setChallengeMode(false);
  const success = pressCount >= targetPresses;
  setGameStatus(success ? 
    `Challenge Complete! 🏆 ${pressCount}/${targetPresses}` :
    `Challenge Failed 😔 ${pressCount}/${targetPresses}`
  );
};
```

### 3. Multi-Device Support
```javascript
const [multiDeviceMode, setMultiDeviceMode] = useState(false);
const [deviceScores, setDeviceScores] = useState({});

// Handle button presses from multiple devices
useEffect(() => {
  if (!multiDeviceMode) return;
  
  connectedDevices.forEach(device => {
    const currentButtonState = deviceValues[device.id]?.buttonStatus;
    const lastState = lastButtonStates[device.id];
    
    if (currentButtonState === 'pressed' && lastState !== 'pressed') {
      setDeviceScores(prev => ({
        ...prev,
        [device.id]: (prev[device.id] || 0) + 1
      }));
      
      // Trigger device-specific confetti
      triggerDeviceConfetti(device.id);
    }
  });
}, [connectedDevices, deviceValues, multiDeviceMode]);
```

## Testing Strategies

### 1. Component Testing
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { WebSocketProvider } from '../contexts/WebSocketContext';
import GamePress from './GamePress';

const mockWebSocketValue = {
  wsConnected: true,
  connectedDevices: [
    { id: 'device-1', name: 'Test Device', serial: '123456' }
  ],
  deviceValues: {
    'device-1': { buttonStatus: 'released' }
  }
};

test('displays connected device', () => {
  render(
    <WebSocketProvider value={mockWebSocketValue}>
      <GamePress />
    </WebSocketProvider>
  );
  
  expect(screen.getByText(/Connected to Test Device/)).toBeInTheDocument();
});

test('triggers confetti on button press', () => {
  const { rerender } = render(
    <WebSocketProvider value={mockWebSocketValue}>
      <GamePress />
    </WebSocketProvider>
  );
  
  // Simulate button press
  const updatedValue = {
    ...mockWebSocketValue,
    deviceValues: {
      'device-1': { buttonStatus: 'pressed' }
    }
  };
  
  rerender(
    <WebSocketProvider value={updatedValue}>
      <GamePress />
    </WebSocketProvider>
  );
  
  expect(screen.getByText(/Button Pressed!/)).toBeInTheDocument();
});
```

### 2. Integration Testing
```javascript
// Test complete button press flow
const simulateButtonPress = async () => {
  // Simulate WebSocket message
  act(() => {
    wsService.notifyListeners({
      type: 'buttonStateChanged',
      deviceId: 'device-1',
      buttonState: 'pressed',
      pressValue: 255
    });
  });
  
  // Wait for confetti animation
  await waitFor(() => {
    expect(screen.getByText(/Button Pressed!/)).toBeInTheDocument();
  });
  
  // Simulate button release
  act(() => {
    wsService.notifyListeners({
      type: 'buttonStateChanged',
      deviceId: 'device-1',
      buttonState: 'released',
      pressValue: 0
    });
  });
  
  await waitFor(() => {
    expect(screen.getByText(/Ready for next press/)).toBeInTheDocument();
  });
};
```

## Performance Optimization

### 1. Memoization
```javascript
import { useMemo, useCallback } from 'react';

const GamePress = () => {
  // Memoize expensive calculations
  const selectedDeviceInfo = useMemo(() => {
    return connectedDevices.find(d => d.id === selectedDevice);
  }, [connectedDevices, selectedDevice]);
  
  // Memoize event handlers
  const handleDeviceSelect = useCallback((deviceId) => {
    setSelectedDevice(deviceId);
  }, []);
  
  // Memoize confetti config
  const confettiConfig = useMemo(() => ({
    angle: 90,
    spread: 360,
    startVelocity: 40,
    elementCount: 70,
    dragFriction: 0.12,
    duration: 3000,
    stagger: 3,
    width: "10px",
    height: "10px",
    colors: ["#a864fd", "#29cdff", "#78ff44", "#ff718d", "#fdff6a"]
  }), []);
};
```

### 2. Lazy Loading
```javascript
import { lazy, Suspense } from 'react';

const Confetti = lazy(() => import('react-dom-confetti'));

// Use with Suspense
<Suspense fallback={<div>Loading...</div>}>
  <Confetti active={explodeConfetti} config={confettiConfig} />
</Suspense>
```

## Best Practices

1. **Comprehensive Logging** - Include detailed console logs for debugging
2. **State Validation** - Always validate device selection and data availability
3. **Visual Feedback** - Provide immediate visual response to user actions
4. **Error Handling** - Handle connection failures and device disconnections gracefully
5. **Performance** - Use memoization for expensive operations
6. **Accessibility** - Include proper ARIA labels and keyboard navigation
7. **Responsive Design** - Ensure component works on all screen sizes
8. **Testing** - Write comprehensive unit and integration tests

## Related Documentation

- [01-INTEGRATION-button-press-handling.md](./01-INTEGRATION-button-press-handling.md) - Button press patterns
- [01-INTEGRATION-websocket-communication.md](./01-INTEGRATION-websocket-communication.md) - WebSocket integration
- [02-COMPONENTS-websocket-context.md](./02-COMPONENTS-websocket-context.md) - Context usage
- [04-DEVELOPMENT-testing-guide.md](./04-DEVELOPMENT-testing-guide.md) - Testing strategies
