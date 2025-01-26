import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useGameSettings } from '../contexts/GameSettingsContext';
import useSound from '../hooks/useSound';
import { GAME_SOUNDS } from '../constants/sounds';
import Header from './Header';
import wsService from '../services/WebSocketService';

// Define colors array here since it's used in this component
const colors = ['blue', 'green', 'yellow', 'orange', 'red', 'purple'];

function WhacAMole() {
  const { connectedDevices, deviceValues } = useWebSocket();
  const { settings } = useGameSettings();
  const [activeDevice, setActiveDevice] = useState(null);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [lastPressTime, setLastPressTime] = useState(0);

  // Initialize sounds
  const playHitSound = useSound(GAME_SOUNDS.HIT);
  const playMissSound = useSound(GAME_SOUNDS.MISS);
  const playStartSound = useSound(GAME_SOUNDS.START);
  const playEndSound = useSound(GAME_SOUNDS.END);

  // Replace force monitoring with tap event listener
  useEffect(() => {
    if (!gameStarted || !activeDevice) return;

    const handleTap = (status, data) => {
      if (status === 'characteristicChanged' && 
          data.characteristicUUID === '000015251212efde1523785feabcd123') {
        const now = Date.now();
        const isPressed = data.value[0] === 0;
        
        // Add logging for press/release events
        console.log(`Device ${data.deviceId} ${isPressed ? 'PRESSED' : 'RELEASED'}`);
        console.log(`Active device: ${activeDevice.id}`);
        
        if (isPressed && (now - lastPressTime) > 1000) {
          if (data.deviceId === activeDevice.id) {
            console.log('HIT! Correct device pressed');
            playHitSound();
            setScore(prev => prev + 1);
          } else {
            console.log('MISS! Wrong device pressed');
            playMissSound();
            if (score > 0) {
              setScore(prev => prev - 1);
            }
          }
          setLastPressTime(now);
        }
      }
    };

    const removeListener = wsService.addListener(handleTap);
    return () => removeListener();
  }, [gameStarted, activeDevice, lastPressTime, playHitSound, playMissSound, score]);

  const startGame = () => {
    if (connectedDevices.length === 0) {
      alert('Please connect at least one device to play!');
      return;
    }
    setGameStarted(true);
    setScore(0);
    setTimeLeft(settings.gameLength);
    playStartSound();
  };

  const endGame = () => {
    setGameStarted(false);
    setActiveDevice(null);
    setTimeLeft(0);
    playEndSound();
  };

  // Timer countdown
  useEffect(() => {
    if (gameStarted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);

      if (timeLeft === 0) {
        endGame();
      }

      return () => clearInterval(timer);
    }
  }, [gameStarted, timeLeft]);

  // Device switching logic
  useEffect(() => {
    if (gameStarted && connectedDevices.length > 0) {
      const interval = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * connectedDevices.length);
        setActiveDevice(connectedDevices[randomIndex]);
      }, 2000); // Change active device every 2 seconds

      return () => clearInterval(interval);
    }
  }, [gameStarted, connectedDevices]);

  // Update the device status display
  const getDeviceStatus = (device) => {
    if (!gameStarted) return "Game not started";
    if (device.id === activeDevice?.id) {
      return `PRESS ME NOW!`;
    }
    return "Wait...";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Header 
        title="Whac-A-Mole" 
        subtitle={`Score: ${score} | Time Left: ${timeLeft}s`} 
      />

      {!gameStarted && (
        <div className="mb-4 text-center text-gray-600">
          <p>Press the active Cosmoid when it lights up!</p>
          <p>Each correct press = 1 point</p>
          <p>Connected devices: {connectedDevices.length}</p>
        </div>
      )}

      <div className="mb-8 flex justify-center">
        <button
          onClick={gameStarted ? endGame : startGame}
          className={`px-6 py-2 rounded-lg font-medium ${
            gameStarted
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {gameStarted ? 'End Game' : 'Start Game'}
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-8">
        {connectedDevices.map((device, index) => {
          const color = colors[index % colors.length];
          const isActive = activeDevice?.id === device.id;

          return (
            <div key={device.id} className="text-center">
              <div
                className={`circle circle-${color} ${isActive ? 'circle-active animate-pulse' : ''}`}
              >
              </div>
              <div className={`mt-2 font-medium ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {getDeviceStatus(device)}
              </div>
            </div>
          );
        })}
      </div>

      {connectedDevices.length === 0 && (
        <div className="text-center text-red-500 mt-4">
          Please connect at least one Cosmoid device to play!
        </div>
      )}
    </div>
  );
}

export default WhacAMole; 