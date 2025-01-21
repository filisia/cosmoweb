import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useGameSettings } from '../contexts/GameSettingsContext';
import useSound from '../hooks/useSound';
import { GAME_SOUNDS } from '../constants/sounds';
import Header from './Header';
import DeviceGrid from './DeviceGrid';

function WhacAMole() {
  const { connectedDevices, deviceValues } = useWebSocket();
  const { settings } = useGameSettings();
  const [activeDevice, setActiveDevice] = useState(null);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [lastPressTime, setLastPressTime] = useState(0);
  const FORCE_THRESHOLD = 20; // Minimum force required to register a hit

  // Initialize sounds
  const playHitSound = useSound(GAME_SOUNDS.HIT);
  const playMissSound = useSound(GAME_SOUNDS.MISS);
  const playStartSound = useSound(GAME_SOUNDS.START);
  const playEndSound = useSound(GAME_SOUNDS.END);

  // Monitor force values for automatic hit detection
  useEffect(() => {
    if (!gameStarted || !activeDevice) return;

    const now = Date.now();
    const deviceValue = deviceValues[activeDevice.id]?.forceValue || 0;
    
    // Only register hits once per second to prevent multiple triggers
    if (deviceValue > FORCE_THRESHOLD && (now - lastPressTime) > 1000) {
      playHitSound();
      setScore(prev => prev + 1);
      setLastPressTime(now);
    }
  }, [deviceValues, activeDevice, gameStarted, lastPressTime, playHitSound]);

  const handleDeviceClick = (device) => {
    if (!gameStarted) return;

    const deviceValue = deviceValues[device.id]?.forceValue || 0;
    
    if (device.id === activeDevice?.id && deviceValue > FORCE_THRESHOLD) {
      playHitSound();
      setScore(prev => prev + 1);
    } else {
      playMissSound();
      if (score > 0) {
        setScore(prev => prev - 1);
      }
    }
  };

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

  // Helper function to get device status message
  const getDeviceStatus = (device) => {
    if (!gameStarted) return "Game not started";
    if (device.id === activeDevice?.id) {
      const force = deviceValues[device.id]?.forceValue || 0;
      return `PRESS ME NOW! (Current force: ${force})`;
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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {connectedDevices.map((device) => (
          <div
            key={device.id}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              activeDevice?.id === device.id 
                ? 'border-blue-500 bg-blue-50 animate-pulse' 
                : 'border-gray-200'
            }`}
            onClick={() => handleDeviceClick(device)}
          >
            <div className="text-center">
              <div className="font-medium">{device.name}</div>
              <div className="text-sm text-gray-500">ID: {device.id}</div>
              <div className={`mt-2 font-medium ${
                activeDevice?.id === device.id ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {getDeviceStatus(device)}
              </div>
            </div>
          </div>
        ))}
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