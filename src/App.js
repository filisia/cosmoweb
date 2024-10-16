import React, { useState } from 'react';
import { scanForDevices, startNotifications, writeToCharacteristic, onDeviceDisconnected, connectToDevice } from './BLEService';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './style.css';
import GamePress from './GamePress';
import HomePage from './HomePage';
import GrowShrinkGame from './GrowShrinkGame';
import LEDModePage from './LEDModePage';

function App() {
  // State hooks for various purposes
  const [characteristic, setCharacteristic] = useState(null);
  const [server, setServer] = useState(null);
  const serviceUUID = '00001523-1212-efde-1523-785feabcd123';
  const kSensorCharacteristicUUID = '00001524-1212-efde-1523-785feabcd123';
  const kCommandCharacteristicUUID = '00001528-1212-efde-1523-785feabcd123';
  const kButtonStatusCharacteristicUUID = '00001525-1212-efde-1523-785feabcd123';
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [deviceCircleAssociation, setDeviceCircleAssociation] = useState({});
  const colors = ['blue', 'green', 'yellow', 'orange', 'red', 'purple'];
  // State for game status (pressed or released)
  const [gameStatus, setGameStatus] = useState(null);
  const [pressValue, setPressValue] = useState(0); // A state to hold the press value

  // Function to handle device disconnection
  const handleDisconnect = (device) => {
    console.log(`Device ${device.id} disconnected`);
    // Update the state to handle the disconnection
    setConnectedDevices((prevDevices) => prevDevices.filter((dev) => dev.id !== device.id));
  };

  // Function to handle connection to BLE device
  const handleConnectToDevice = async () => {
    try {
      const device = await scanForDevices();
      const gattServer = await connectToDevice(device);
      setServer(gattServer);
      console.log('Connected to device, server:', gattServer);
    } catch (error) {
      console.error('Error connecting to device:', error);
    }
  };

  // Callback function for handling characteristic value changes
  function handleCharacteristicValueChanged_sensor(event, deviceId) {
    const value = event.target.value;
    const intValue = value.getUint8(0);
    setPressValue(intValue);
    setDeviceCircleAssociation(prevAssociations => ({
      ...prevAssociations,
      [deviceId]: {
        ...prevAssociations[deviceId],
        forceValue: intValue
      }
    }));
  }

  // Callback function for handling characteristic value changes
  function handleCharacteristicValueChanged_button(event, deviceId) {
    const value = event.target.value;
    const intValue = value.getUint8(0);
    if (intValue === 0) {
      setGameStatus('Pressed');
    } else {
      setGameStatus('Released');
    }

    return intValue;
  }


  // Function to write color to the characteristic
  const handleWriteColorToCharacteristic = async (colorParameter, server) => {
    try {
      let commandValues;
      // Determine command values based on the color parameter
      switch (colorParameter) {
        // Assign different command values based on the color
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

      // Write the command to the characteristic
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
      // Write the command to the characteristic
      await writeToCharacteristic(server, serviceUUID, kCommandCharacteristicUUID, commandValues);
    } catch (error) {
      console.error('Error writing to characteristic:', error);
    }
  };

  

  return (
    <Router>
      <div>
        <nav className="p-5">
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/game-press">Game Press</Link>
            </li>
            <li>
              <Link to="/grow-shrink-game">Grow/Shrink Game</Link>
            </li>
            <li>
              <Link to="/led-mode">LED Mode</Link>
            </li>
          </ul>
        </nav>

        <Routes>
          <Route path="/game-press" element={<GamePress gameStatus={gameStatus} />} />
          <Route path="/grow-shrink-game" element={<GrowShrinkGame pressValue={pressValue} onWriteLuminocity={handleWriteLuminocityToCharacteristic}  server={server} />} />
          <Route path="/led-mode" element={<LEDModePage server={server} />} />
          <Route path="/" element={
            <HomePage
              colors={colors}
              connectedDevices={connectedDevices}
              deviceCircleAssociation={deviceCircleAssociation}
              handleConnectToDevice={handleConnectToDevice}
              server={server}
            />
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
