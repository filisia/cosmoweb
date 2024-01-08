import React, { useState } from 'react';
import { scanForDevices, startNotifications, writeToCharacteristic } from './BLEService';
import BrowserSpecificErrorMessage from './BrowserSpecificErrorMessage';
import './style.css';

function App() {
  const [characteristic, setCharacteristic] = useState(null);
  const serviceUUID = '00001523-1212-efde-1523-785feabcd123';
  const kSensorCharacteristicUUID = '00001524-1212-efde-1523-785feabcd123';
  const kCommandCharacteristicUUID = '00001528-1212-efde-1523-785feabcd123';
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [deviceCircleAssociation, setDeviceCircleAssociation] = useState({});
  const colors = ['blue', 'green', 'yellow', 'orange', 'red', 'purple'];


  const handleConnectToDevice = async (index) => {
    try {
      const device = await scanForDevices();
      const server = await device.gatt.connect();
      setCharacteristic(await startNotifications(server, serviceUUID, kSensorCharacteristicUUID, (event) => handleCharacteristicValueChanged_sensor(event, device.id)));

      if (!connectedDevices.some(dev => dev.id === device.id)) {
        const newConnectedDevices = [...connectedDevices, device];
        setConnectedDevices(newConnectedDevices);
        setDeviceCircleAssociation(prevAssociations => ({
          ...prevAssociations,
          [device.id]: {
            circleIndex: newConnectedDevices.length,
            forceValue: null
          }
        }));

        const deviceIndex = newConnectedDevices.length % colors.length - 1;
        const nextColor = colors[deviceIndex];
        await handleWriteColorToCharacteristic(nextColor, server);
        await handleWriteLuminocityToCharacteristic(64, 0, server, deviceIndex);
      }
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };


  // Callback function for handling characteristic value changes
  function handleCharacteristicValueChanged_sensor(event, deviceId) {
    const value = event.target.value;
    const intValue = value.getUint8(0);
    setDeviceCircleAssociation(prevAssociations => ({
      ...prevAssociations,
      [deviceId]: {
        ...prevAssociations[deviceId],
        forceValue: intValue
      }
    }));
  }
  // Function to write color to the characteristic
  const handleWriteColorToCharacteristic = async (colorParameter, server) => {
    try {
      let commandValues;
      switch (colorParameter) {
        case 'blue':
          commandValues = [2, 0, 0, 4, 1];
          break;
        case 'red':
          commandValues = [2, 4, 0, 0, 1];
          break;
        case 'green':
          commandValues = [2, 0, 4, 0, 1];
          break;
        case 'white':
          commandValues = [2, 4, 4, 4, 1];
          break;
        case 'orange':
          commandValues = [2, 4, 1, 0, 1];
          break;
        case 'darkYellow':
          commandValues = [2, 4, 4, 0, 1];
          break;
        case 'purple':
          commandValues = [2, 4, 0, 4, 1];
          break;
        case 'pink':
          commandValues = [2, 4, 1, 1, 1];
          break;
        case 'fuchsia':
          commandValues = [2, 4, 0, 1, 1];
          break;
        case 'turquoise':
          commandValues = [2, 0, 3, 4, 1];
          break;
        case 'lightGreen':
          commandValues = [2, 1, 4, 1, 1];
          break;
        case 'fluorescentGreen':
          commandValues = [2, 2, 4, 0, 1];
          break;
        case 'yellow':
          commandValues = [2, 4, 3, 0, 1];
          break;
        case 'lightPurple':
          commandValues = [2, 3, 1, 4, 1];
          break;
        case 'iceWhite':
          commandValues = [2, 2, 3, 4, 1];
          break;
        default:
          commandValues = [2, 0, 0, 0, 1]; // Default command
      }

      await writeToCharacteristic(server, serviceUUID, kCommandCharacteristicUUID, commandValues);
      console.log('Value written to characteristic:', colorParameter);
    } catch (error) {
      console.error('Error writing to characteristic:', error);
    }
  };


  
  
  // Function to write luminocity to the characteristic
  const handleWriteLuminocityToCharacteristic = async (intensity, delay, server, deviceIndex) => {
    try {
      let commandValues = [1, intensity, delay];

      await writeToCharacteristic(server, serviceUUID, kCommandCharacteristicUUID, commandValues);
    } catch (error) {
      console.error('Error writing to characteristic:', error);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-around">
        {colors.map((color, index) => {
          const isActive = index < connectedDevices.length;
          const circleClasses = `circle circle-${color} ${isActive ? "circle-connected" : ""}`;
          const deviceId = connectedDevices[index]?.id;

          return (
            <div key={index} className={circleClasses} onClick={() => handleConnectToDevice(index)}>
              {deviceId && deviceCircleAssociation[deviceId] && (
                <p>Force: {deviceCircleAssociation[deviceId].forceValue}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


export default App;
