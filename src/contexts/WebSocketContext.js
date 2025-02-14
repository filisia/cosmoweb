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

  const sendCharacteristicOperation = (deviceId, operation, value) => {
    if (wsConnected) {
      wsService.send({
        type: 'characteristicChanged',
        deviceId,
        characteristicUUID: getCharacteristicUUID(operation),
        value: Array.isArray(value) ? value : [value]
      });
    }
  };

  useEffect(() => {
    wsService.connect();
    
    const removeListener = wsService.addListener((status, data) => {
      switch (status) {
        case 'connected':
          setWsConnected(true);
          setConnectionError(null);
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
                getCharacteristicUUID('READ_BUTTON_STATUS')
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
          try {
            const operation = getOperationFromUUID(data.characteristicUUID);
            switch (operation) {
              case 'READ_BUTTON_STATUS':
                setDeviceValues(prev => ({
                  ...prev,
                  [data.deviceId]: {
                    ...prev[data.deviceId],
                    buttonStatus: data.value[0]
                  }
                }));
                break;
              // Add other characteristic handlers here
              default:
                break;
            }
          } catch (error) {
            console.error('Unknown characteristic UUID:', error);
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
