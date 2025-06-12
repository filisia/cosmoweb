// GamePress.js
import React, { useEffect, useState } from 'react';
import Confetti from 'react-dom-confetti';
import { useWebSocket } from './contexts/WebSocketContext';

function GamePress() {
  const { wsConnected, connectionError, deviceValues, connectedDevices } = useWebSocket();
  const [explodeConfetti, setExplodeConfetti] = useState(false);
  const [gameStatus, setGameStatus] = useState('Idle');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [lastButtonState, setLastButtonState] = useState(null);
  
  // Debug: Log props on mount and when they change
  useEffect(() => {
    console.log('[GamePress] Component mounted/updated with props:', {
      wsConnected,
      connectionError,
      deviceValues,
      connectedDevices,
      selectedDevice
    });
  }, [wsConnected, connectionError, deviceValues, connectedDevices, selectedDevice]);

  // Update selected device when devices connect/disconnect
  useEffect(() => {
    console.log('[GamePress] Connected devices changed:', connectedDevices);
    if (connectedDevices.length > 0) {
      const newSelectedDevice = connectedDevices[0].id;
      console.log('[GamePress] Setting selected device to:', newSelectedDevice);
      setSelectedDevice(newSelectedDevice);
    } else {
      console.log('[GamePress] No devices connected, clearing selected device');
      setSelectedDevice(null);
    }
  }, [connectedDevices]);

  // Handle button state changes
  useEffect(() => {
    console.log('[GamePress] Checking for button state changes:', {
      selectedDevice,
      deviceValues,
      deviceValuesForSelected: selectedDevice ? deviceValues[selectedDevice] : null
    });
    
    if (!selectedDevice) {
      console.log('[GamePress] No device selected');
      return;
    }
    
    if (!deviceValues || !deviceValues[selectedDevice]) {
      console.log('[GamePress] No device values available for selected device:', {
        selectedDevice,
        deviceValues: deviceValues ? Object.keys(deviceValues) : 'null'
      });
      return;
    }

    const deviceValue = deviceValues[selectedDevice];
    console.log('[GamePress] Device values for selected device:', {
      deviceId: selectedDevice,
      buttonStatus: deviceValue.buttonStatus,
      pressValue: deviceValue.pressValue,
      rawDeviceValue: JSON.stringify(deviceValue)
    });

    // Check both buttonStatus and pressValue
    // Note: buttonStatus can be undefined if not yet received
    const buttonState = deviceValue.buttonStatus;
    const pressValue = deviceValue.pressValue;
    
    console.log('[GamePress] Current vs last button state:', {
      current: buttonState,
      last: lastButtonState,
      pressValue
    });

    // Only update if button state has changed and is not undefined
    if (buttonState !== undefined && buttonState !== lastButtonState) {
      console.log('[GamePress] Button state changed:', {
        from: lastButtonState,
        to: buttonState,
        pressValue
      });
      
      setLastButtonState(buttonState);
      
      // Bridge app sends buttonState as a boolean: true when pressed, false when released
      // or as a number: 0 when pressed, 255 when released
      // Handle both cases
      const status = buttonState === true || buttonState === 0 ? 'Pressed' : 'Released';
      console.log('[GamePress] Setting game status to:', status);
      
      setGameStatus(status);
      
      if (status === 'Pressed') {
        console.log('[GamePress] Triggering confetti');
        setExplodeConfetti(true);
        setTimeout(() => setExplodeConfetti(false), 1000);
      }
    }
  }, [selectedDevice, deviceValues, lastButtonState]);

  // Configuration object for the confetti effect
  const confettiConfig = {
    angle: 90,
    spread: 360,
    startVelocity: 40,
    elementCount: 200,
    dragFriction: 0.12,
    duration: 3000,
    stagger: 3,
    width: "10px",
    height: "10px",
    perspective: "500px",
    colors: ["#a864fd", "#29cdff", "#78ff44", "#ff718d", "#fdff6a"]
  };

  if (!wsConnected || connectionError) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-r from-cyan-500 to-blue-500">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Connection Required</h1>
          <p className="mb-4">Please ensure Cosmoid Bridge is running and connected.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-r from-cyan-500 to-blue-500">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">Game Press Page</h1>
        {connectedDevices.length > 0 ? (
          <div className="mb-4">
            <label className="text-white mr-2">Select Device:</label>
            <select 
              value={selectedDevice || ''} 
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="bg-white text-gray-800 px-3 py-1 rounded"
            >
              {connectedDevices.map(device => (
                <option key={device.id} value={device.id}>
                  {device.name || device.id}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p className="text-white">No devices connected</p>
        )}
        <div className="mb-4">
          <p className={`text-2xl font-semibold ${gameStatus === 'Pressed' ? 'text-green-300' : 'text-red-300'}`}>
            Button State: {gameStatus}
          </p>
          {selectedDevice && deviceValues[selectedDevice] && (
            <div>
              <p className="text-white text-sm mt-2">
                Raw Values: Button={deviceValues[selectedDevice].buttonStatus !== undefined ? deviceValues[selectedDevice].buttonStatus : 'undefined'}, 
                Press={deviceValues[selectedDevice].pressValue !== undefined ? deviceValues[selectedDevice].pressValue : 'undefined'}
              </p>
              <p className="text-white text-xs mt-1">
                Device ID: {selectedDevice}
              </p>
            </div>
          )}
        </div>
      </div>
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      }}>
        <Confetti active={explodeConfetti} config={confettiConfig} />
      </div>
    </div>
  );
}

export default GamePress;
