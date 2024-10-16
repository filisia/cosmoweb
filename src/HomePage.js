// HomePage.js
import React, { useEffect, useState } from 'react';
import { readCharacteristic } from './BLEService';

// HomePage component definition
function HomePage({ server, colors, connectedDevices, deviceCircleAssociation, handleConnectToDevice }) {
  // console.log('Server:', server);

  // Calculate the number of connected devices
  const numberOfConnectedDevices = connectedDevices.length;

  const deviceInfoServiceUUID = '0000180a-0000-1000-8000-00805f9b34fb';
  const serialNumberCharacteristicUUID = '00002a25-0000-1000-8000-00805f9b34fb';
  const hardwareRevisionCharacteristicUUID = '00002a27-0000-1000-8000-00805f9b34fb';
  const firmwareRevisionCharacteristicUUID = '00002a26-0000-1000-8000-00805f9b34fb';

  const [deviceInfo, setDeviceInfo] = useState({});

  useEffect(() => {
    const readDeviceInfo = async () => {
      try {
        console.log('Attempting to read device information...');
        const serialNumber = await readCharacteristic(server, deviceInfoServiceUUID, serialNumberCharacteristicUUID);
        const hardwareRevision = await readCharacteristic(server, deviceInfoServiceUUID, hardwareRevisionCharacteristicUUID);
        const firmwareRevision = await readCharacteristic(server, deviceInfoServiceUUID, firmwareRevisionCharacteristicUUID);

        console.log('Serial Number:', serialNumber);

        setDeviceInfo({
          serialNumber: serialNumber ? new TextDecoder().decode(serialNumber) : 'N/A',
          hardwareRevision: hardwareRevision ? new TextDecoder().decode(hardwareRevision) : 'N/A',
          firmwareRevision: firmwareRevision ? new TextDecoder().decode(firmwareRevision) : 'N/A',
        });
      } catch (error) {
        console.error('Error reading device info:', error);
      }
    };

    if (server) {
      readDeviceInfo();
    }
  }, [server]);

  return (
    // Main container for the HomePage component
    <div className="p-4 space-y-4">
      {/* Display the number of connected devices */}
      <div className="text-center p-2">
        Cosmoids: {numberOfConnectedDevices}
      </div>
      {/* Container for device circles */}
      <div className="flex flex-wrap justify-center gap-4">
        {colors.map((color, index) => {
          // Determine if the circle should be active (connected) or not
          const isActive = index < numberOfConnectedDevices;
          // Check if this is the next color in line to be connected
          const isNextToConnect = index === numberOfConnectedDevices;
          // Determine the next color to use, looping back to the start if necessary
          const nextColor = colors[index] || colors[0];
          // Define CSS classes for the circle based on active status and next color
          const circleClasses = `circle ${isActive ? `circle-${color}` : 'circle-disconnected'} ${isNextToConnect ? `border-${nextColor}` : ''}`;
          // Define CSS classes for the plus symbol based on next color
          const plusClasses = `circle-plus ${isNextToConnect ? `plus-${nextColor}` : ''}`;
          
          // Get the device and its details if it's connected
          const device = connectedDevices[index];
          const deviceId = device?.id;
          const deviceInfo = deviceId ? deviceCircleAssociation[deviceId] : null;

          return (
            // Render the circle for each device/color
            <div key={index} className="text-center">
              <div 
                className={circleClasses} 
                onClick={() => isNextToConnect && handleConnectToDevice()}
              >
                {/* Conditionally render the plus symbol or force value */}
                {isNextToConnect ? (
                  <span className={plusClasses}>+</span>
                ) : isActive && deviceInfo ? (
                  // Display the force value if available
                  <p>
                    <strong>{deviceInfo.forceValue}</strong><br />Force value
                  </p>
                ) : null}
              </div>
              {isActive && deviceInfo && (
                <div className="mt-2 text-sm">
                  <p>S/N: {deviceInfo.serialNumber || 'N/A'}</p>
                  <p>HW Rev: {deviceInfo.hardwareRevision || 'N/A'}</p>
                  <p>FW Ver: {deviceInfo.firmwareVersion || 'N/A'}</p>
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
