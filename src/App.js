import React, { useState, useEffect, useRef } from 'react';
import { scanForDevices, connectToDevice, startNotifications, stopNotifications } from './BLEService';
import './style.css'; 

function App() {
  const [characteristic, setCharacteristic] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [interpretedValue, setInterpretedValue] = useState(null); // New state for the interpreted value
  const marioRef = useRef(null); // Ref for the Mario character


  useEffect(() => {
    if (interpretedValue != null) {
      jump(interpretedValue);
    }
  }, [interpretedValue]); // Re-run the effect when interpretedValue changes

  // Function to make Mario jump
  function jump(height) {
    
    let mario = marioRef.current;
    console.log(mario);
    if (mario) {
      // Apply dynamic style for jump height
      mario.style.bottom = `${height * 5}px`; // Scale the jump height

      setTimeout(() => {
        mario.style.bottom = '0px'; // Reset after jump
      }, 300); // Adjust the time to match the jump duration
    }
  }

  const handleConnect = async () => {
    try {
      console.log('Scanning for devices...');
      const device = await scanForDevices();
      const server = await connectToDevice(device);
      console.log('Connected to:', device.name);

      // Assuming serviceUUID and characteristicUUID are known and provided
      const serviceUUID = '00001523-1212-efde-1523-785feabcd123';
      const characteristicUUID = '00001524-1212-efde-1523-785feabcd123';
      
      const char = await startNotifications(server, serviceUUID, characteristicUUID, handleCharacteristicValueChanged);
      setCharacteristic(char);
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
  function handleCharacteristicValueChanged(event) {
    const value = event.target.value;
    // console.log('Characteristic value changed:', value);
    // Reading the first byte as an unsigned 8-bit integer
    const intValue = value.getUint8(0);
    // console.log('Interpreted value:', intValue);
    setInterpretedValue(intValue); // Update the interpreted value

  }

  return (
    <div>
      <h1>First web based Cosmo game!</h1>
      <button onClick={handleConnect}>Connect to Cosmo</button>
      <button onClick={handleStartListening} disabled={!characteristic || isListening}>Start Listening</button>
      <button onClick={handleStopListening} disabled={!characteristic || !isListening}>Stop Listening</button>
      {interpretedValue !== null && <p>Press Value: {interpretedValue}</p>} {/* Display the interpreted value */}
      <div id="mario-character" ref={marioRef} style={{ position: 'absolute', bottom: '0px' }}></div> {/* Mario character */}


    </div>
  );
}

export default App;
