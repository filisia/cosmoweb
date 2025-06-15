# Device Management Integration

## Overview

This document provides comprehensive guidance for web developers on implementing device connection, discovery, and state management in Cosmoweb applications. Understanding device lifecycle management is crucial for building reliable Cosmo ecosystem applications.

## Device Lifecycle

```
┌─────────────────┐    Discovery    ┌─────────────────┐    Connection   ┌─────────────────┐
│   Available     │ ──────────────→ │   Connecting    │ ──────────────→ │   Connected     │
│   (Scanning)    │                 │   (Pairing)     │                 │   (Active)      │
└─────────────────┘                 └─────────────────┘                 └─────────────────┘
         ▲                                   │                                   │
         │                                   │                                   │
         │              ┌─────────────────┐  │                                   │
         └──────────────│   Disconnected  │◄─┘                                   │
                        │   (Offline)     │◄─────────────────────────────────────┘
                        └─────────────────┘
```

## Device Data Structure

### Device Object Format
```javascript
{
  id: "device-uuid-string",           // Unique device identifier
  name: "Cosmo Device",               // Human-readable device name
  serial: "2405002009",               // Device serial number
  firmware: "4.6.00",                 // Firmware version
  batteryLevel: 85,                   // Battery percentage (0-100)
  isConnected: true,                  // Connection status
  connectionState: "connected",       // Detailed connection state
  lastSeen: "2025-06-15T13:20:17Z",  // Last communication timestamp
  deviceType: "cosmo",                // Device type identifier
  capabilities: ["button", "led"],    // Available features
  rssi: -45                          // Signal strength (optional)
}
```

### Connection States
- **`"available"`** - Device discovered but not connected
- **`"connecting"`** - Connection attempt in progress
- **`"connected"`** - Fully connected and operational
- **`"disconnecting"`** - Disconnection in progress
- **`"disconnected"`** - Device offline or unreachable
- **`"error"`** - Connection error state

## Implementation Patterns

### 1. Basic Device Management

```javascript
import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';

function DeviceManager() {
  const { wsConnected, connectedDevices, connectionError } = useWebSocket();
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceHistory, setDeviceHistory] = useState([]);

  // Track device connection history
  useEffect(() => {
    const newDevices = connectedDevices.filter(device => 
      !deviceHistory.find(hist => hist.id === device.id)
    );
    
    if (newDevices.length > 0) {
      console.log('[DeviceManager] New devices connected:', newDevices);
      setDeviceHistory(prev => [
        ...prev,
        ...newDevices.map(device => ({
          ...device,
          firstSeen: new Date().toISOString(),
          connectionCount: 1
        }))
      ]);
    }
  }, [connectedDevices, deviceHistory]);

  // Auto-select device logic
  useEffect(() => {
    if (connectedDevices.length > 0 && !selectedDevice) {
      // Prefer previously used device
      const previousDevice = deviceHistory.find(hist => 
        connectedDevices.find(device => device.id === hist.id)
      );
      
      const deviceToSelect = previousDevice 
        ? connectedDevices.find(device => device.id === previousDevice.id)
        : connectedDevices[0];
      
      console.log('[DeviceManager] Auto-selecting device:', deviceToSelect.id);
      setSelectedDevice(deviceToSelect.id);
    } else if (connectedDevices.length === 0) {
      console.log('[DeviceManager] No devices connected, clearing selection');
      setSelectedDevice(null);
    }
  }, [connectedDevices, selectedDevice, deviceHistory]);

  const handleDeviceSelect = (deviceId) => {
    console.log('[DeviceManager] Manually selecting device:', deviceId);
    setSelectedDevice(deviceId);
  };

  if (!wsConnected) {
    return (
      <div className="device-manager connecting">
        <h3>Connecting to Cosmo Bridge...</h3>
        {connectionError && (
          <div className="error">Error: {connectionError}</div>
        )}
      </div>
    );
  }

  return (
    <div className="device-manager">
      <h3>Connected Devices ({connectedDevices.length})</h3>
      
      {connectedDevices.length === 0 ? (
        <div className="no-devices">
          <p>No Cosmo devices connected</p>
          <small>Make sure your device is turned on and nearby</small>
        </div>
      ) : (
        <div className="device-list">
          {connectedDevices.map(device => (
            <DeviceCard
              key={device.id}
              device={device}
              isSelected={selectedDevice === device.id}
              onSelect={() => handleDeviceSelect(device.id)}
            />
          ))}
        </div>
      )}
      
      {selectedDevice && (
        <div className="selected-device-info">
          <h4>Active Device</h4>
          <DeviceDetails deviceId={selectedDevice} />
        </div>
      )}
    </div>
  );
}

// Device Card Component
function DeviceCard({ device, isSelected, onSelect }) {
  const getBatteryColor = (level) => {
    if (level > 50) return 'green';
    if (level > 20) return 'orange';
    return 'red';
  };

  const getSignalStrength = (rssi) => {
    if (!rssi) return 'unknown';
    if (rssi > -50) return 'excellent';
    if (rssi > -70) return 'good';
    if (rssi > -85) return 'fair';
    return 'poor';
  };

  return (
    <div 
      className={`device-card ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="device-header">
        <h4>{device.name || `Cosmo ${device.serial}`}</h4>
        <div className={`connection-status ${device.connectionState}`}>
          {device.connectionState}
        </div>
      </div>
      
      <div className="device-info">
        <div className="info-row">
          <span>Serial:</span>
          <span>{device.serial}</span>
        </div>
        <div className="info-row">
          <span>Firmware:</span>
          <span>{device.firmware}</span>
        </div>
        <div className="info-row">
          <span>Battery:</span>
          <span className={`battery-level ${getBatteryColor(device.batteryLevel)}`}>
            {device.batteryLevel}%
          </span>
        </div>
        {device.rssi && (
          <div className="info-row">
            <span>Signal:</span>
            <span className={`signal-strength ${getSignalStrength(device.rssi)}`}>
              {device.rssi} dBm
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default DeviceManager;
```

### 2. Advanced Device State Management

```javascript
import React, { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';

function AdvancedDeviceManager() {
  const { wsConnected, connectedDevices } = useWebSocket();
  const [deviceStates, setDeviceStates] = useState({});
  const [deviceMetrics, setDeviceMetrics] = useState({});
  const [connectionAlerts, setConnectionAlerts] = useState([]);

  // Initialize device states
  useEffect(() => {
    const newStates = {};
    connectedDevices.forEach(device => {
      if (!deviceStates[device.id]) {
        newStates[device.id] = {
          ...device,
          connectedAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          activityCount: 0,
          connectionStable: true
        };
      }
    });
    
    if (Object.keys(newStates).length > 0) {
      setDeviceStates(prev => ({ ...prev, ...newStates }));
    }
  }, [connectedDevices]);

  // Monitor device health
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const alerts = [];
      
      Object.values(deviceStates).forEach(device => {
        const lastActivity = new Date(device.lastActivity);
        const timeSinceActivity = now - lastActivity;
        
        // Check for low battery
        if (device.batteryLevel < 20) {
          alerts.push({
            type: 'warning',
            deviceId: device.id,
            message: `Low battery: ${device.batteryLevel}%`
          });
        }
        
        // Check for connection issues
        if (timeSinceActivity > 30000) { // 30 seconds
          alerts.push({
            type: 'error',
            deviceId: device.id,
            message: 'Device not responding'
          });
        }
      });
      
      setConnectionAlerts(alerts);
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, [deviceStates]);

  const updateDeviceActivity = useCallback((deviceId) => {
    setDeviceStates(prev => ({
      ...prev,
      [deviceId]: {
        ...prev[deviceId],
        lastActivity: new Date().toISOString(),
        activityCount: (prev[deviceId]?.activityCount || 0) + 1
      }
    }));
  }, []);

  const calculateUptime = (connectedAt) => {
    const now = new Date();
    const connected = new Date(connectedAt);
    const uptimeMs = now - connected;
    
    const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
    const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="advanced-device-manager">
      <div className="device-overview">
        <h3>Device Overview</h3>
        <div className="metrics">
          <div className="metric">
            <label>Connected:</label>
            <span>{connectedDevices.length}</span>
          </div>
          <div className="metric">
            <label>Alerts:</label>
            <span className={connectionAlerts.length > 0 ? 'warning' : 'ok'}>
              {connectionAlerts.length}
            </span>
          </div>
        </div>
      </div>

      {connectionAlerts.length > 0 && (
        <div className="alerts">
          <h4>Device Alerts</h4>
          {connectionAlerts.map((alert, index) => (
            <div key={index} className={`alert ${alert.type}`}>
              <strong>{alert.deviceId}:</strong> {alert.message}
            </div>
          ))}
        </div>
      )}

      <div className="device-details">
        {connectedDevices.map(device => {
          const state = deviceStates[device.id];
          return (
            <div key={device.id} className="device-detail-card">
              <h4>{device.name || `Cosmo ${device.serial}`}</h4>
              
              <div className="device-metrics">
                <div className="metric-row">
                  <span>Uptime:</span>
                  <span>{state ? calculateUptime(state.connectedAt) : 'N/A'}</span>
                </div>
                <div className="metric-row">
                  <span>Activity Count:</span>
                  <span>{state?.activityCount || 0}</span>
                </div>
                <div className="metric-row">
                  <span>Last Activity:</span>
                  <span>
                    {state ? new Date(state.lastActivity).toLocaleTimeString() : 'N/A'}
                  </span>
                </div>
              </div>
              
              <div className="device-actions">
                <button onClick={() => updateDeviceActivity(device.id)}>
                  Test Connection
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AdvancedDeviceManager;
```

### 3. Device Selection Hook

```javascript
import { useState, useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';

export function useDeviceSelection(options = {}) {
  const { connectedDevices } = useWebSocket();
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [selectionHistory, setSelectionHistory] = useState([]);
  
  const {
    autoSelect = true,
    preferPrevious = true,
    onDeviceSelect,
    onDeviceDisconnect
  } = options;

  // Auto-selection logic
  useEffect(() => {
    if (!autoSelect) return;
    
    if (connectedDevices.length > 0 && !selectedDevice) {
      let deviceToSelect;
      
      if (preferPrevious && selectionHistory.length > 0) {
        // Try to reconnect to previously selected device
        const lastSelected = selectionHistory[selectionHistory.length - 1];
        deviceToSelect = connectedDevices.find(d => d.id === lastSelected.id);
      }
      
      // Fallback to first available device
      if (!deviceToSelect) {
        deviceToSelect = connectedDevices[0];
      }
      
      console.log('[useDeviceSelection] Auto-selecting device:', deviceToSelect.id);
      setSelectedDevice(deviceToSelect.id);
      onDeviceSelect?.(deviceToSelect);
      
    } else if (connectedDevices.length === 0 && selectedDevice) {
      console.log('[useDeviceSelection] No devices connected, clearing selection');
      setSelectedDevice(null);
      onDeviceDisconnect?.(selectedDevice);
    }
  }, [connectedDevices, selectedDevice, autoSelect, preferPrevious, selectionHistory]);

  // Track selection history
  useEffect(() => {
    if (selectedDevice) {
      const device = connectedDevices.find(d => d.id === selectedDevice);
      if (device) {
        setSelectionHistory(prev => [
          ...prev.filter(h => h.id !== device.id), // Remove duplicates
          {
            id: device.id,
            name: device.name,
            serial: device.serial,
            selectedAt: new Date().toISOString()
          }
        ]);
      }
    }
  }, [selectedDevice, connectedDevices]);

  const selectDevice = (deviceId) => {
    const device = connectedDevices.find(d => d.id === deviceId);
    if (device) {
      console.log('[useDeviceSelection] Manually selecting device:', deviceId);
      setSelectedDevice(deviceId);
      onDeviceSelect?.(device);
    } else {
      console.warn('[useDeviceSelection] Device not found:', deviceId);
    }
  };

  const clearSelection = () => {
    console.log('[useDeviceSelection] Clearing device selection');
    setSelectedDevice(null);
  };

  const getSelectedDevice = () => {
    return connectedDevices.find(d => d.id === selectedDevice) || null;
  };

  return {
    selectedDevice,
    selectedDeviceObject: getSelectedDevice(),
    selectDevice,
    clearSelection,
    selectionHistory,
    availableDevices: connectedDevices
  };
}
```

## Device Information Display

### Battery Level Indicator
```javascript
function BatteryIndicator({ level, charging = false }) {
  const getBatteryColor = (level) => {
    if (level > 60) return '#4CAF50'; // Green
    if (level > 30) return '#FF9800'; // Orange
    if (level > 15) return '#F44336'; // Red
    return '#9C27B0'; // Purple (critical)
  };

  const getBatteryIcon = (level) => {
    if (charging) return '🔌';
    if (level > 75) return '🔋';
    if (level > 50) return '🔋';
    if (level > 25) return '🪫';
    return '🪫';
  };

  return (
    <div className="battery-indicator">
      <span className="battery-icon">{getBatteryIcon(level)}</span>
      <div className="battery-bar">
        <div 
          className="battery-fill"
          style={{
            width: `${level}%`,
            backgroundColor: getBatteryColor(level)
          }}
        />
      </div>
      <span className="battery-text">{level}%</span>
    </div>
  );
}
```

### Connection Status Indicator
```javascript
function ConnectionStatus({ device }) {
  const getStatusColor = (state) => {
    switch (state) {
      case 'connected': return '#4CAF50';
      case 'connecting': return '#FF9800';
      case 'disconnected': return '#9E9E9E';
      case 'error': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusIcon = (state) => {
    switch (state) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'disconnected': return '⚫';
      case 'error': return '🔴';
      default: return '⚫';
    }
  };

  return (
    <div className="connection-status">
      <span className="status-icon">{getStatusIcon(device.connectionState)}</span>
      <span 
        className="status-text"
        style={{ color: getStatusColor(device.connectionState) }}
      >
        {device.connectionState}
      </span>
      {device.lastSeen && (
        <small className="last-seen">
          Last seen: {new Date(device.lastSeen).toLocaleTimeString()}
        </small>
      )}
    </div>
  );
}
```

## Error Handling

### Device Connection Errors
```javascript
function DeviceErrorHandler({ error, onRetry, onDismiss }) {
  const getErrorMessage = (error) => {
    switch (error.type) {
      case 'CONNECTION_FAILED':
        return 'Failed to connect to device. Please check if the device is turned on and nearby.';
      case 'DEVICE_NOT_FOUND':
        return 'Device not found. It may have been turned off or moved out of range.';
      case 'PAIRING_FAILED':
        return 'Device pairing failed. Please try again or restart the device.';
      case 'COMMUNICATION_ERROR':
        return 'Communication error with device. Connection may be unstable.';
      default:
        return error.message || 'An unknown error occurred with the device.';
    }
  };

  return (
    <div className="device-error">
      <div className="error-icon">⚠️</div>
      <div className="error-content">
        <h4>Device Error</h4>
        <p>{getErrorMessage(error)}</p>
        <div className="error-actions">
          {onRetry && (
            <button onClick={onRetry} className="retry-button">
              Retry Connection
            </button>
          )}
          <button onClick={onDismiss} className="dismiss-button">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
```

## Best Practices

1. **Always handle device disconnection gracefully** - Show appropriate UI states
2. **Implement device selection persistence** - Remember user's preferred device
3. **Monitor device health** - Track battery, signal strength, and activity
4. **Provide clear visual feedback** - Use colors and icons for device states
5. **Handle multiple devices properly** - Allow users to switch between devices
6. **Log device events strategically** - Help with debugging connection issues
7. **Implement retry mechanisms** - Handle temporary connection failures
8. **Show device capabilities** - Inform users what each device can do

## Related Documentation

- [01-INTEGRATION-websocket-communication.md](./01-INTEGRATION-websocket-communication.md) - WebSocket integration
- [01-INTEGRATION-button-press-handling.md](./01-INTEGRATION-button-press-handling.md) - Button event handling
- [03-API-websocket-message-protocol.md](./03-API-websocket-message-protocol.md) - Message specifications
- [04-DEVELOPMENT-troubleshooting.md](./04-DEVELOPMENT-troubleshooting.md) - Troubleshooting guide
