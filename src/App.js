import React, { useState, useEffect, useRef } from 'react';
import { scanForDevices, connectToDevice, startNotifications, stopNotifications, writeToCharacteristic } from './BLEService';
import './style.css';

function App() {
  const [characteristic, setCharacteristic] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [interpretedValue, setInterpretedValue] = useState(null); // New state for the interpreted value
  const marioRef = useRef(null); // Ref for the Mario character
  const serviceUUID = '00001523-1212-efde-1523-785feabcd123';
  const kSensorCharacteristicUUID = '00001524-1212-efde-1523-785feabcd123';
  const kCommandCharacteristicUUID = '00001528-1212-efde-1523-785feabcd123';
  const [server, setServer] = useState(null); // State for the server
  const [selectedColor, setSelectedColor] = useState('');
  const [luminosity, setLuminosity] = useState(0);

  // useEffect(() => {
  //   if (interpretedValue != null) {
  //     jump(interpretedValue);
  //   }
  // }, [interpretedValue]); // Re-run the effect when interpretedValue changes

  // Function to make Mario jump
  function jump(height) {

    let mario = marioRef.current;
    // console.log(mario);
    if (mario) {
      // Apply dynamic style for jump height
      mario.style.bottom = `${height * 5}px`; // Scale the jump height

      // setTimeout(() => {
      //   mario.style.bottom = '0px'; // Reset after jump
      // }, 300); // Adjust the time to match the jump duration
    }
  }

  const handleConnect = async () => {
    try {
      console.log('Scanning for devices...');
      const device = await scanForDevices();
      const connectedServer = await device.gatt.connect();
      setServer(connectedServer); // Set the server state

      const char_sensor = await startNotifications(connectedServer, serviceUUID,
        kSensorCharacteristicUUID, handleCharacteristicValueChanged_sensor);
      setCharacteristic(char_sensor);

      setIsListening(true); // Update the isListening
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleStartListening = () => {
    if (characteristic) {
      console.log('Starting notifications...');
      setIsListening(true);
    }
  };

  const handleStopListening = () => {
    if (characteristic) {
      console.log('Stopping notifications...');
      stopNotifications(characteristic);
      setIsListening(false);
    }
  };

  // Callback function for handling characteristic value changes
  function handleCharacteristicValueChanged_sensor(event) {
    const value = event.target.value;
    const intValue = value.getUint8(0);
    setInterpretedValue(intValue); // Update the interpreted value

  }

  // Function to write color to the characteristic
  const handleWriteColorToCharacteristic = async (colorParameter) => {
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

  const handleColorChange = (event) => {
    const color = event.target.value;
    setSelectedColor(color);
    if (color !== '--none--') {
      handleWriteColorToCharacteristic(color);
    }
  };

  // Function to write luminocity to the characteristic
  const handleWriteLuminocityToCharacteristic = async (intensity, delay) => {
    try {
      let commandValues = [1, intensity, delay];

      await writeToCharacteristic(server, serviceUUID, kCommandCharacteristicUUID, commandValues);
    } catch (error) {
      console.error('Error writing to characteristic:', error);
    }
  };

  const handleLuminosityChange = (event) => {
    setLuminosity(event.target.value);
  };

  const handleSetLuminosity = () => {
    handleWriteLuminocityToCharacteristic(parseInt(luminosity, 10), 0);
  };


  //   return (
  //     <div>
  //       <h1>Interacting with Cosmo</h1>
  //       <button onClick={handleConnect}>Connect to Cosmo</button>
  //       <button onClick={handleStartListening} disabled={!characteristic || isListening}>Start Listening</button>
  //       <button onClick={handleStopListening} disabled={!characteristic || !isListening}>Stop Listening</button>

  //       {interpretedValue !== null && (
  //         <>
  //           <div>
  //             Press Value: {interpretedValue}
  //           </div>
  //           <div>
  //             <label htmlFor="color-select">Set Color: </label>
  //             <select id="color-select" value={selectedColor} onChange={handleColorChange}>
  //               <option value="--none--">--none--</option>
  //               <option value="blue">Blue</option>
  //               <option value="red">Red</option>
  //               <option value="green">Green</option>
  //               <option value="white">White</option>
  //               <option value="orange">Orange</option>
  //               <option value="darkYellow">Dark Yellow</option>
  //               <option value="purple">Purple</option>
  //               <option value="pink">Pink</option>
  //               <option value="fuchsia">Fuchsia</option>
  //               <option value="turquoise">Turquoise</option>
  //               <option value="lightGreen">Light Green</option>
  //               <option value="fluorescentGreen">Fluorescent Green</option>
  //               <option value="yellow">Yellow</option>
  //               <option value="lightPurple">Light Purple</option>
  //               <option value="iceWhite">Ice White</option>
  //             </select>
  //           </div>
  //           <div>
  //             <label htmlFor="luminosity-range">Set Luminosity (0-64): </label>
  //             <input
  //               type="range"
  //               id="luminosity-range"
  //               min="0"
  //               max="64"
  //               value={luminosity}
  //               onChange={handleLuminosityChange}
  //             />
  //             <span>{luminosity}</span>
  //             <button onClick={handleSetLuminosity}>Set Luminosity</button>
  //           </div>
  //         </>
  //       )}

  //     </div >

  //   );
  // }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Interacting with Cosmo</h1>
      <div className="mb-4">
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={handleConnect}>Connect to Cosmo</button>
        <button onClick={handleStartListening} disabled={!characteristic || isListening}>Start Listening</button>
        <button onClick={handleStopListening} disabled={!characteristic || !isListening}>Stop Listening</button>

      </div>

      {interpretedValue !== null && (
        <div className="space-y-40">
          <div>
            <p className="text-lg">Press Value: {interpretedValue}</p>
          </div>
          <div>
            <label htmlFor="color-select" className="block mb-2">Set Color: </label>
            <select id="color-select" value={selectedColor} onChange={handleColorChange} className="border border-gray-300 rounded px-4 py-2 focus:border-blue-500">
              <option value="--none--">--none--</option>
              <option value="blue">Blue</option>
              <option value="red">Red</option>
              <option value="green">Green</option>
              <option value="white">White</option>
              <option value="orange">Orange</option>
              <option value="darkYellow">Dark Yellow</option>
              <option value="purple">Purple</option>
              <option value="pink">Pink</option>
              <option value="fuchsia">Fuchsia</option>
              <option value="turquoise">Turquoise</option>
              <option value="lightGreen">Light Green</option>
              <option value="fluorescentGreen">Fluorescent Green</option>
              <option value="yellow">Yellow</option>
              <option value="lightPurple">Light Purple</option>
              <option value="iceWhite">Ice White</option>
            </select>
          </div>
          <div>
            <label htmlFor="luminosity-range" className="block mb-2">Set Luminosity (0-64): </label>
            <input
              type="range"
              id="luminosity-range"
              min="0"
              max="64"
              value={luminosity}
              onChange={handleLuminosityChange}
              className="w-full"
            />
            <span className="text-lg">{luminosity}</span>
            <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ml-4" onClick={handleSetLuminosity}>Set Luminosity</button>
          </div>
        </div>
      )}

    </div>
  );

}


export default App;
