// HomePage.js
import React, { useEffect, useState } from 'react';
import wsService from './services/WebSocketService';

function HomePage({ colors }) {
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [deviceInfo, setDeviceInfo] = useState({});
  const [wsConnected, setWsConnected] = useState(false);
  const [deviceValues, setDeviceValues] = useState({});
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    wsService.connect();
    
    const removeListener = wsService.addListener((status, data) => {
      switch (status) {
        case 'connected':
          setWsConnected(true);
          setConnectionError(null);
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

  if (!wsConnected || connectionError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <svg className="w-16 h-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
            </svg>
          </div>
          
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Connection Status
          </h2>
          
          <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="space-y-6">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Connection Required
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>Unable to connect to Cosmoid Bridge. Please follow these steps:</p>
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Ensure the Cosmoid Bridge application is running on your computer</li>
                        <li>Check that you're using a supported browser (Chrome or Edge)</li>
                        <li>Verify that no firewall is blocking the connection</li>
                        <li>Try refreshing this page</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <button
                  onClick={() => wsService.connect()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Retry Connection
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="text-center p-2">
        Cosmoids: {connectedDevices.length}
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
