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
  const [lockState, setLockState] = useState({ isLocked: false, deviceIds: [] });
  const [connectionLogs, setConnectionLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toISOString();
    setConnectionLogs(prev => [...prev, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${message}`); // Also log to console
  };

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

  useEffect(() => {
    console.log('[WebSocketContext] Setting up WebSocket connection');
    let mounted = true;

    const handleMessage = (data) => {
      if (!mounted) {
        console.log('[WebSocketContext] Ignoring message after unmount:', data.type);
        return;
      }

      console.log('[WebSocketContext] Handling message:', data.type);
      addLog(`Received message: ${data.type}`);
      addLog(`Message data: ${JSON.stringify(data)}`);

      switch (data.type) {
        case 'connected':
          console.log('[WebSocketContext] WebSocket connected');
          console.log('[WebSocketContext] Calling setConnected(true)');
          setWsConnected(true);
          addLog('WebSocket connected successfully');
          addLog('Requesting device list...');
          wsService.getDevices();
          break;

        case 'disconnected':
          console.log('[WebSocketContext] WebSocket disconnected');
          console.log('[WebSocketContext] Calling setConnected(false)');
          setWsConnected(false);
          addLog('WebSocket disconnected');
          break;

        case 'devicesList':
          console.log('[WebSocketContext] Received devices list:', data.devices?.length);
          if (data.devices && Array.isArray(data.devices)) {
            addLog(`Received ${data.devices.length} devices`);
            setConnectedDevices(prevDevices => {
              if (prevDevices.length !== data.devices.length) {
                console.log('[WebSocketContext] Devices list length changed, preparing to update state');
                console.log('[WebSocketContext] Calling setConnectedDevices(...)');
                return data.devices;
              }

              const devicesChanged = prevDevices.some((device, index) => 
                !data.devices[index] || 
                device.id !== data.devices[index].id ||
                device.name !== data.devices[index].name
              );

              if (!devicesChanged) {
                console.log('[WebSocketContext] Devices list unchanged (shallow ID/name check), skipping state update');
                return prevDevices;
              }
              
              console.log('[WebSocketContext] Devices list changed, preparing to update state');
              console.log('[WebSocketContext] Calling setConnectedDevices(...)');
              return data.devices;
            });
          }
          break;

        case 'deviceInfo':
          console.log('[WebSocketContext] Received device info:', data.deviceId);
          if (data.deviceId) {
            addLog(`Received device info for: ${data.deviceId}`);
            setDeviceInfo(prevDevices => {
              const deviceIndex = prevDevices.findIndex(device => device.id === data.deviceId);
              if (deviceIndex === -1) {
                console.log('[WebSocketContext] Received deviceInfo for unknown device', data.deviceId);
                return prevDevices;
              }

              const existingDevice = prevDevices[deviceIndex];
              const infoChanged = 
                existingDevice.serialNumber !== data.serialNumber ||
                existingDevice.firmwareRevision !== data.firmwareRevision ||
                existingDevice.hardwareRevision !== data.hardwareRevision ||
                existingDevice.batteryLevel !== data.batteryLevel ||
                existingDevice.connected !== data.connected ||
                existingDevice.rssi !== data.rssi;

              if (!infoChanged) {
                console.log('[WebSocketContext] Device info unchanged, skipping state update for device', data.deviceId);
                return prevDevices;
              }

              const newDevices = [...prevDevices];
              newDevices[deviceIndex] = { ...existingDevice, ...data };
              console.log('[WebSocketContext] Device info changed, preparing to update state for device', data.deviceId);
              console.log('[WebSocketContext] Calling setDeviceInfo(...)');
              return newDevices;
            });
          }
          break;

        case 'characteristicChanged':
          console.log('[WebSocketContext] Characteristic changed:', {
            deviceId: data.deviceId,
            characteristicUUID: data.characteristicUUID,
            value: data.value
          });
          if (data.deviceId && data.characteristicUUID) {
            addLog(`Characteristic changed for device ${data.deviceId}: ${data.characteristicUUID} with value: ${data.value}`);
            
            switch (data.characteristicUUID) {
              case '000015251212efde1523785feabcd123':
                const buttonState = data.value?.[0];
                console.log('[WebSocketContext] Button status changed:', buttonState, 'for device:', data.deviceId);
                addLog(`Button state changed: ${buttonState} for device: ${data.deviceId}`);

                setDeviceValues(prevDeviceValues => {
                  const existingDeviceValues = prevDeviceValues[data.deviceId];
                  if (existingDeviceValues?.buttonStatus === buttonState) {
                    console.log('[WebSocketContext] Button status unchanged, skipping state update for device', data.deviceId);
                    return prevDeviceValues;
                  }

                  console.log('[WebSocketContext] Button status changed, preparing to update state for device', data.deviceId);
                  console.log('[WebSocketContext] Calling setDeviceValues(...)');
                  return {
                    ...prevDeviceValues,
                    [data.deviceId]: {
                      ...existingDeviceValues,
                      buttonStatus: buttonState
                    }
                  };
                });
                break;

              case '000015241212efde1523785feabcd123':
                const pressValue = data.value?.[0];
                console.log('[WebSocketContext] Press value changed:', pressValue, 'for device:', data.deviceId);
                addLog(`Press value changed: ${pressValue} for device: ${data.deviceId}`);
                
                setDeviceValues(prevDeviceValues => {
                  const existingDeviceValues = prevDeviceValues[data.deviceId];
                  if (existingDeviceValues?.pressValue === pressValue) {
                    console.log('[WebSocketContext] Press value unchanged, skipping state update for device', data.deviceId);
                    return prevDeviceValues;
                  }

                  console.log('[WebSocketContext] Press value changed, preparing to update state for device', data.deviceId);
                  console.log('[WebSocketContext] Calling setDeviceValues(...)');
                  return {
                    ...prevDeviceValues,
                    [data.deviceId]: {
                      ...existingDeviceValues,
                      pressValue: pressValue
                    }
                  };
                });
                break;

              default:
                console.log('[WebSocketContext] Unhandled characteristic UUID:', data.characteristicUUID);
                addLog(`Unhandled characteristic UUID: ${data.characteristicUUID}`);
                break;
            }
          }
          break;

        case 'error':
          console.error('[WebSocketContext] Bridge error:', data.error);
          addLog(`Bridge error: ${data.error || 'Unknown error occurred'}`);
          break;

        default:
          console.log('[WebSocketContext] Unhandled message type:', data.type);
          addLog(`Unhandled message type: ${data.type}`);
      }
    };

    // Connect to WebSocket
    console.log('[WebSocketContext] Initiating WebSocket connection');
    wsService.connect();

    // Add message listener
    console.log('[WebSocketContext] Adding message listener');
    const removeListener = wsService.addListener(handleMessage);

    // Cleanup on unmount
    return () => {
      console.log('[WebSocketContext] Cleaning up WebSocket connection');
      mounted = false;
      removeListener();
      wsService.disconnect();
    };
  }, []);

  const value = {
    wsConnected,
    connectionError,
    connectedDevices,
    deviceInfo,
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
