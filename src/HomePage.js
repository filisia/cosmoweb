// HomePage.js
import React, { useEffect, useState } from 'react';
import wsService from './services/WebSocketService';

function HomePage({ colors }) {
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [deviceInfo, setDeviceInfo] = useState({});
  const [wsConnected, setWsConnected] = useState(false);
  const [deviceValues, setDeviceValues] = useState({});

  useEffect(() => {
    wsService.connect();
    
    const removeListener = wsService.addListener((status, data) => {
      switch (status) {
        case 'connected':
          setWsConnected(true);
          break;
        case 'disconnected':
          setWsConnected(false);
          setConnectedDevices([]);
          break;
        case 'devicesList':
          setConnectedDevices(data);
          data.forEach(device => {
            wsService.getDeviceInfo(device.id);
          });
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
          // Handle force sensor characteristic changes
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

  return (
    <div className="p-4 space-y-4">
      <div className="text-center p-2">
        Cosmoids: {connectedDevices.length}
        {!wsConnected && (
          <div className="mt-2 text-red-500">
            Not connected to Cosmoid Bridge
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        {connectedDevices.map((device, index) => {
          const color = colors[index % colors.length];
          const deviceDetails = deviceInfo[device.id];
          const values = deviceValues[device.id];

          return (
            <div key={device.id} className="text-center">
              <div className={`circle circle-${color} circle-connected`}>
                {values?.forceValue !== undefined && (
                  <p>
                    <strong>{values.forceValue}</strong><br />Force value
                  </p>
                )}
              </div>
              {deviceDetails && (
                <div className="mt-2 text-sm">
                  <p>S/N: {deviceDetails.serialNumber || 'N/A'}</p>
                  <p>HW Rev: {deviceDetails.hardwareRevision || 'N/A'}</p>
                  <p>FW Ver: {deviceDetails.firmwareRevision || 'N/A'}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default HomePage;
