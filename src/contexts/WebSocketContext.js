import React, { createContext, useContext, useState, useEffect } from 'react';
import wsService from '../services/WebSocketService';
import { getCharacteristicUUID, getOperationFromUUID } from '../utils/characteristics';

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const [wsConnected, setWsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [deviceInfo, setDeviceInfo] = useState({});
  const [deviceValues, setDeviceValues] = useState({});

  useEffect(() => {
    wsService.connect();
    
    const removeListener = wsService.addListener((status, data) => {
      switch (status) {
        case 'connected':
          setWsConnected(true);
          setConnectionError(null);
          // Request device list when connected
          wsService.send({ type: 'getDevices' });
          break;
        case 'disconnected':
          setWsConnected(false);
          setConnectedDevices([]);
          break;
        case 'connectionFailed':
          setWsConnected(false);
          setConnectionError(data.message);
          break;
        case 'devicesList':
          if (Array.isArray(data.devices)) {
            setConnectedDevices(data.devices);
            data.devices.forEach(device => {
              wsService.getDeviceInfo(device.id);
              wsService.subscribeToCharacteristic(
                device.id,
                '000015241212efde1523785feabcd123'
              );
            });
          }
          break;
        case 'deviceInfo':
          setDeviceInfo(prev => ({
            ...prev,
            [data.deviceId]: {
              serialNumber: data.serialNumber,
              hardwareRevision: data.hardwareRevision,
              firmwareRevision: data.firmwareRevision
            }
          }));
          break;
        case 'characteristicChanged':
          if (data.characteristicUUID === '000015241212efde1523785feabcd123') {
            setDeviceValues(prev => ({
              ...prev,
              [data.deviceId]: {
                ...prev[data.deviceId],
                forceValue: data.value[0]
              }
            }));
          }
          break;
        default:
          break;
      }
    });

    return () => removeListener();
  }, []);

  const value = {
    wsConnected,
    connectionError,
    connectedDevices,
    deviceInfo,
    deviceValues,
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

const sendCharacteristicOperation = (deviceId, operation, value) => {
  if (ws.current?.readyState === WebSocket.OPEN) {
    ws.current.send(JSON.stringify({
      type: 'characteristicChanged',
      deviceId,
      characteristicUUID: getCharacteristicUUID(operation),
      value: Array.isArray(value) ? value : [value]
    }));
  }
};

// Example usage in a component:
const handleButtonStatus = (value) => {
  sendCharacteristicOperation(deviceId, 'READ_BUTTON_STATUS', value);
};

// Handle incoming messages
const handleMessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === 'characteristicChanged') {
    const operation = getOperationFromUUID(message.characteristicUUID);
    
    switch (operation) {
      case 'READ_BUTTON_STATUS':
        // Handle button state change
        break;
      case 'READ_SENSOR_VALUE':
        // Handle sensor value change
        break;
      // ... handle other operations
    }
  }
};
