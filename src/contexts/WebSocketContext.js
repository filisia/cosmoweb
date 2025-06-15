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

  useEffect(() => {
    console.log('[WebSocketContext] Setting up WebSocket connection');
    let mounted = true;

    const handleMessage = (data) => {
      if (!mounted) {
        console.log('[WebSocketContext] Ignoring message after unmount:', data.type);
        return;
      }

      console.log('[WebSocketContext] Handling message:', data.type);
      console.log('[WebSocketContext] Full message data:', data);
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

        case 'deviceDisconnected':
          // The deviceId can be either in data.device.id or directly in data.deviceId
          const disconnectedId = data.device?.id || data.deviceId;
          console.log('[WebSocketContext] Device disconnected:', disconnectedId);
          addLog(`Device disconnected: ${disconnectedId}`);
          // Remove the disconnected device from the list
          setConnectedDevices(prevDevices => {
            const currentDevices = Array.isArray(prevDevices) ? prevDevices : [];
            // Filter out the disconnected device
            return currentDevices.filter(device => device.id !== disconnectedId);
          });
          break;

        case 'deviceConnected':
          console.log('[WebSocketContext] Device connected:', data.device?.id);
          addLog(`Device connected: ${data.device?.id}`);
          // Update connected devices immediately with the new device
          setConnectedDevices(prevDevices => {
            const currentDevices = Array.isArray(prevDevices) ? prevDevices : [];
            const deviceIndex = currentDevices.findIndex(d => d.id === data.device.id);
            
            if (deviceIndex === -1) {
              // Device not in list, add it
              return [...currentDevices, data.device];
            } else {
              // Update existing device
              const newDevices = [...currentDevices];
              newDevices[deviceIndex] = { ...newDevices[deviceIndex], ...data.device, connected: true };
              return newDevices;
            }
          });
          // Request updated device list
          wsService.getDevices();
          break;

        case 'devicesList':
          console.log('[WebSocketContext] Received devices list:', data.devices?.length);
          console.log('[WebSocketContext] Raw devices data:', JSON.stringify(data.devices));
          if (data.devices && Array.isArray(data.devices)) {
            addLog(`Received ${data.devices.length} devices`);
            setConnectedDevices(prevDevices => {
              const currentDevices = Array.isArray(prevDevices) ? prevDevices : [];
              
              // Always update the devices list with new data
              console.log('[WebSocketContext] Updating devices list with new data');
              
              // Accept all devices from the bridge app as they are already filtered
              // The bridge app now properly filters out disconnected devices
              const updatedDevices = data.devices.map(device => {
                // Log each device for debugging
                console.log(`[WebSocketContext] Processing device ${device.id}:`, {
                  connected: device.connected,
                  name: device.name,
                  serial: device.serial,
                  firmware: device.firmware,
                  batteryLevel: device.batteryLevel
                });
                
                // Ensure connected is explicitly set to true for all devices from bridge
                // since the bridge now only sends truly connected devices
                if (device.connected !== true) {
                  console.log(`[WebSocketContext] Setting device ${device.id} as connected explicitly`);
                    return { ...device, connected: true };
                  }
                  return device;
                });
              
              console.log('[WebSocketContext] Updated devices:', updatedDevices);
              return updatedDevices;
            });
          }
          break;

        case 'deviceInfo':
          console.log('[WebSocketContext] Received device info:', data.deviceId);
          if (data.deviceId) {
            addLog(`Received device info for: ${data.deviceId}`);
            setConnectedDevices(prevDevices => {
              const currentDevices = Array.isArray(prevDevices) ? prevDevices : [];

              const deviceIndex = currentDevices.findIndex(device => device.id === data.deviceId);
              if (deviceIndex === -1) {
                console.log('[WebSocketContext] Received deviceInfo for unknown device', data.deviceId);
                return currentDevices;
              }

              const existingDevice = currentDevices[deviceIndex];
              const infoChanged = 
                existingDevice.serialNumber !== data.serialNumber ||
                existingDevice.firmwareRevision !== data.firmwareRevision ||
                existingDevice.hardwareRevision !== data.hardwareRevision ||
                existingDevice.batteryLevel !== data.batteryLevel ||
                existingDevice.connected !== data.connected ||
                existingDevice.rssi !== data.rssi;

              if (!infoChanged) {
                console.log('[WebSocketContext] Device info unchanged, skipping state update for device', data.deviceId);
                return currentDevices;
              }

              const newDevices = [...currentDevices];
              newDevices[deviceIndex] = { ...existingDevice, ...data };
              console.log('[WebSocketContext] Device info changed, preparing to update state for device', data.deviceId);
              console.log('[WebSocketContext] Calling setConnectedDevices(...)');
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
            addLog(`Characteristic changed for device ${data.deviceId}: ${data.characteristicUUID} with value: ${JSON.stringify(data.value)}`);
            
            switch (data.characteristicUUID) {
              case '000015251212efde1523785feabcd123':
                const buttonState = data.value?.[0];
                console.log('[WebSocketContext] Button status changed:', buttonState, 'for device:', data.deviceId);
                addLog(`Button state changed: ${buttonState} for device: ${data.deviceId}`);

                setDeviceValues(prevDeviceValues => {
                  const currentDeviceValues = typeof prevDeviceValues === 'object' && prevDeviceValues !== null ? prevDeviceValues : {};
                  const existingDeviceValues = currentDeviceValues[data.deviceId];

                  if (existingDeviceValues?.buttonStatus === buttonState) {
                    console.log('[WebSocketContext] Button status unchanged, skipping state update for device', data.deviceId);
                    return prevDeviceValues;
                  }

                  console.log('[WebSocketContext] Button status changed, preparing to update state for device', data.deviceId);
                  console.log('[WebSocketContext] Calling setDeviceValues(...)');
                  return {
                    ...currentDeviceValues,
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
                  const currentDeviceValues = typeof prevDeviceValues === 'object' && prevDeviceValues !== null ? prevDeviceValues : {};
                  const existingDeviceValues = currentDeviceValues[data.deviceId];

                  if (existingDeviceValues?.pressValue === pressValue) {
                    console.log('[WebSocketContext] Press value unchanged, skipping state update for device', data.deviceId);
                    return prevDeviceValues;
                  }

                  console.log('[WebSocketContext] Press value changed, preparing to update state for device', data.deviceId);
                  console.log('[WebSocketContext] Calling setDeviceValues(...)');
                  return {
                    ...currentDeviceValues,
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

        case 'buttonStateChanged':
          console.log('[WebSocketContext] Button state changed event received:', {
            deviceId: data.deviceId,
            buttonState: data.buttonState,
            pressValue: data.pressValue
          });
          addLog(`Button state changed for device ${data.deviceId}: state=${data.buttonState}, press=${data.pressValue}`);
          
          if (data.deviceId) {
            setDeviceValues(prevDeviceValues => {
              const currentDeviceValues = typeof prevDeviceValues === 'object' && prevDeviceValues !== null ? prevDeviceValues : {};
              const existingDeviceValues = currentDeviceValues[data.deviceId] || {};
              
              // Check if values actually changed
              if (existingDeviceValues.buttonStatus === data.buttonState && 
                  existingDeviceValues.pressValue === data.pressValue) {
                console.log('[WebSocketContext] Button state unchanged, skipping state update for device', data.deviceId);
                return prevDeviceValues;
              }
              
              console.log('[WebSocketContext] Button state changed event, updating state for device', data.deviceId, {
                from: {
                  buttonStatus: existingDeviceValues.buttonStatus,
                  pressValue: existingDeviceValues.pressValue
                },
                to: {
                  buttonStatus: data.buttonState,
                  pressValue: data.pressValue
                }
              });
              
              return {
                ...currentDeviceValues,
                [data.deviceId]: {
                  ...existingDeviceValues,
                  buttonStatus: data.buttonState,
                  pressValue: data.pressValue
                }
              };
            });
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
