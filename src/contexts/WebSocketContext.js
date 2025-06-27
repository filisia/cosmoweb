import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import wsService from '../services/WebSocketService';
import { getCharacteristicUUID, getOperationFromUUID } from '../utils/characteristics';

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const [wsConnected, setWsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [deviceValues, setDeviceValues] = useState({});
  const [lockState, setLockState] = useState({ isLocked: false, deviceIds: [] });
  const [connectionLogs, setConnectionLogs] = useState([]);

  const addLog = useCallback((message, level = 'info') => {
    const timestamp = new Date().toISOString();
    setConnectionLogs(prevLogs => [
      ...prevLogs,
      { timestamp, message, level },
    ]);
    console.log(`[${timestamp}] ${message}`); // Also log to console
  }, []);

  const sendCharacteristicOperation = (deviceId, operation, value) => {
    if (wsConnected) {
      addLog(`Sending operation ${operation} to device ${deviceId}`, 'info');
      wsService.send({
        type: 'characteristicChanged',
        deviceId,
        characteristicUUID: getCharacteristicUUID(operation),
        value: Array.isArray(value) ? value : [value]
      });
    } else {
      addLog(`Cannot send operation - WebSocket not connected`, 'error');
    }
  };

  const lockDevices = (deviceIds) => {
    if (wsConnected) {
      addLog(`Locking devices: ${deviceIds.join(', ')}`, 'info');
      wsService.send({
        type: 'lockDevices',
        isLocked: true,
        deviceIds
      });
    } else {
      addLog(`Cannot lock devices - WebSocket not connected`, 'error');
    }
  };

  const unlockDevices = () => {
    if (wsConnected) {
      addLog('Unlocking all devices', 'info');
      wsService.send({
        type: 'lockDevices',
        isLocked: false,
        deviceIds: []
      });
    } else {
      addLog(`Cannot unlock devices - WebSocket not connected`, 'error');
    }
  };

  const handleMessage = useCallback((message) => {
    console.log('[WebSocketContext] Handling message:', message.type, message);

    switch (message.type) {
      case 'connected':
        setWsConnected(true);
        console.log('[WebSocketContext] WebSocket connected');
        break;

      case 'disconnected':
        setWsConnected(false);
        console.log('[WebSocketContext] WebSocket disconnected');
        break;

      case 'devices':
        console.log('[WebSocketContext] Handling devices message:', message.devices);
        setConnectedDevices(message.devices);
        message.devices.forEach(device => {
          // Convert string button states to numeric values for consistency
          let buttonStateValue = 0;
          if (device.buttonState !== undefined) {
            const state = device.buttonState;
            if (state === 1 || state === true || state === 'pressed') {
              buttonStateValue = 1;
            } else if (state === 0 || state === false || state === 'released') {
              buttonStateValue = 0;
            }
          }
          
          console.log('[WebSocketContext] Updating device values for:', device.id, {
            buttonState: buttonStateValue,
            pressValue: device.pressValue || 0,
            connected: device.connected
          });
          
          setDeviceValues(prev => ({
            ...prev,
            [device.id]: {
              ...prev[device.id],
              buttonState: buttonStateValue,
              pressValue: device.pressValue || 0,
              connected: device.connected,
              batteryLevel: device.batteryLevel,
              color: device.color
            }
          }));
        });
        break;

      case 'buttonPress':
        // console.log('[WebSocketContext] 🎯 Button press detected:', message);
        setDeviceValues(prev => ({
          ...prev,
          [message.deviceId]: {
            ...prev[message.deviceId],
            buttonState: 1,
            pressValue: message.pressValue || 0
          }
        }));
        break;

      case 'buttonRelease':
        // console.log('[WebSocketContext] 🎯 Button release detected:', message);
        setDeviceValues(prev => ({
          ...prev,
          [message.deviceId]: {
            ...prev[message.deviceId],
            buttonState: 0,
            pressValue: message.pressValue || 0
          }
        }));
        break;

      case 'buttonStateChanged':
        // console.log('[WebSocketContext] 🎯 Button state changed:', message);
        // Convert string button states to numeric values for consistency
        let buttonStateValue = 0;
        if (message.buttonState || message.state) {
          const state = message.buttonState || message.state;
          if (state === 1 || state === true || state === 'pressed') {
            buttonStateValue = 1;
          } else if (state === 0 || state === false || state === 'released') {
            buttonStateValue = 0;
          }
        }
        
        // console.log('[WebSocketContext] 🎯 Processing button state change:', {
        //   deviceId: message.deviceId,
        //   originalState: message.buttonState || message.state,
        //   convertedState: buttonStateValue,
        //   pressValue: message.pressValue || 0,
        //   timestamp: new Date().toISOString()
        // });
        
        setDeviceValues(prev => {
          const newValues = {
            ...prev,
            [message.deviceId]: {
              ...prev[message.deviceId],
              buttonState: buttonStateValue,
              pressValue: message.pressValue || 0
            }
          };
          console.log('[WebSocketContext] 🎯 Updated device values:', {
            deviceId: message.deviceId,
            newButtonState: newValues[message.deviceId].buttonState,
            newPressValue: newValues[message.deviceId].pressValue
          });
          return newValues;
        });
        break;

      case 'error':
        console.error('[WebSocketContext] Error:', message.error);
        break;

      default:
        console.log('[WebSocketContext] Unhandled message type:', message.type);
    }
  }, [wsService]);

  useEffect(() => {
    // console.log('[WebSocketContext] Setting up WebSocket connection');
    let mounted = true;

    // Connect to WebSocket
    // console.log('[WebSocketContext] Initiating WebSocket connection');
    wsService.connect();

    // Add message listener
    // console.log('[WebSocketContext] Adding message listener');
    const removeListener = wsService.addListener(handleMessage);

    // Cleanup on unmount
    return () => {
      // console.log('[WebSocketContext] Cleaning up WebSocket connection');
      mounted = false;
      removeListener();
      wsService.disconnect();
    };
  }, []);

  const value = {
    wsConnected,
    connectionError,
    connectedDevices,
    deviceValues,
    lockState,
    connectionLogs,
    lockDevices,
    unlockDevices,
    sendCharacteristicOperation,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
