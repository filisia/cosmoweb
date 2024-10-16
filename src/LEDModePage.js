import React, { useState, useEffect } from 'react';
import { writeToCharacteristic, readCharacteristic } from './BLEService';

const LEDModePage = ({ server }) => {
  const [selectedMode, setSelectedMode] = useState('');
  const [sensorThreshold, setSensorThreshold] = useState(0);
  const [ledLuminosityMultiplier, setLedLuminosityMultiplier] = useState(0);
  const [calibrationEnabled, setCalibrationEnabled] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({
    serialNumber: '',
    firmwareVersion: '',
    hardwareRevision: '',
  });

  const serviceUUID = '00001523-1212-efde-1523-785feabcd123';
  const kCommandCharacteristicUUID = '00001528-1212-efde-1523-785feabcd123';

  // Device Information Service UUIDs
  const deviceInfoServiceUUID = '0000180a-0000-1000-8000-00805f9b34fb';
  const serialNumberUUID = '00002a25-0000-1000-8000-00805f9b34fb';
  const firmwareVersionUUID = '00002a26-0000-1000-8000-00805f9b34fb';
  const hardwareRevisionUUID = '00002a27-0000-1000-8000-00805f9b34fb';

  const ledModes = [
    { name: 'None', value: 0, description: 'LED luminosity is completely independent of the sensor and controlled only by Bluetooth commands. Use this mode when light patterns need to be generated via bluetooth commands.' },
    { name: 'Analog', value: 1, description: 'LED luminosity is proportional to the sensor value multiplied by "Led Luminosity Multiplier".' },
    { name: 'Analog Inverted', value: 2, description: 'LED luminosity is inversely proportional to the sensor value multiplied by "Led Luminosity Multiplier".' },
    { name: 'Button', value: 3, description: 'LED follows the "Button Status" Characteristic value, acting as an indication of the digital state of the sensor.' },
    { name: 'Button Inverted', value: 4, description: 'LED inversely follows the "Button Status" Characteristic value.' },
  ];

  const handleModeChange = async (mode) => {
    setSelectedMode(mode);
    try {
      const command = 3; // Equivalent to Commands.setParams.rawValue
      const calibrationValue = calibrationEnabled ? 1 : 0;
      const commandValues = [
        command,
        sensorThreshold,
        ledLuminosityMultiplier,
        calibrationValue,
        mode.value
      ];
      await writeToCharacteristic(server, serviceUUID, kCommandCharacteristicUUID, commandValues);
      console.log('LED mode and parameters changed:', mode.name);
    } catch (error) {
      console.error('Error changing LED mode and parameters:', error);
    }
  };

  useEffect(() => {
    const readDeviceInfo = async () => {
      try {
        const serialNumber = await readCharacteristic(server, deviceInfoServiceUUID, serialNumberUUID);
        const firmwareVersion = await readCharacteristic(server, deviceInfoServiceUUID, firmwareVersionUUID);
        const hardwareRevision = await readCharacteristic(server, deviceInfoServiceUUID, hardwareRevisionUUID);

        setDeviceInfo({
          serialNumber: new TextDecoder().decode(serialNumber),
          firmwareVersion: new TextDecoder().decode(firmwareVersion),
          hardwareRevision: new TextDecoder().decode(hardwareRevision),
        });
      } catch (error) {
        console.error('Error reading device information:', error);
      }
    };

    if (server) {
      readDeviceInfo();
    }
  }, [server]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Change LED Mode</h1>
      
      {/* Device Information Section */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold mb-2">Device Information</h2>
        <p><strong>Serial Number:</strong> {deviceInfo.serialNumber}</p>
        <p><strong>Firmware Version:</strong> {deviceInfo.firmwareVersion}</p>
        <p><strong>Hardware Revision:</strong> {deviceInfo.hardwareRevision}</p>
      </div>

      {/* Existing LED Mode Selection */}
      <div className="space-y-4">
        {ledModes.map((mode) => (
          <div key={mode.value} className="border p-4 rounded">
            <button
              onClick={() => handleModeChange(mode)}
              className={`w-full p-2 rounded mb-2 ${
                selectedMode === mode ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              {mode.name}
            </button>
            <p className="text-sm text-gray-600">{mode.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LEDModePage;
