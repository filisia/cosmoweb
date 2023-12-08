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


  useEffect(() => {
    if (interpretedValue != null) {
      jump(interpretedValue);
    }
  }, [interpretedValue]); // Re-run the effect when interpretedValue changes

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

  // Function to write to a characteristic
  const handleWriteColorToCharacteristic = async () => {
    try {
      const valueToWrite = [2, 0, 0, 4, 1];
      
      await writeToCharacteristic(server, serviceUUID, kCommandCharacteristicUUID, valueToWrite);
      // console.log('Value written to characteristic');
    } catch (error) {
      console.error('Error writing to characteristic:', error);
    }
  };

  return (
    <div>
      <h1>First web based Cosmo game!</h1>
      <button onClick={handleConnect}>Connect to Cosmo</button>
      <button onClick={handleStartListening} disabled={!characteristic || isListening}>Start Listening</button>
      <button onClick={handleStopListening} disabled={!characteristic || !isListening}>Stop Listening</button>
      {interpretedValue !== null && <p>Press Value: {interpretedValue}</p>}
      <div id="mario-character" ref={marioRef} style={{ position: 'absolute', bottom: '0px' }}></div> {/* Mario character */}

      <button onClick={handleWriteColorToCharacteristic}>Write to Characteristic</button>



    </div>
  );
}

export default App;
