import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useWebSocket } from '../contexts/WebSocketContext';
import wsService from '../services/WebSocketService';

const colorMap = [
  { name: 'blue', rgb: [0, 1, 4] },
  { name: 'green', rgb: [1, 4, 2] },
  { name: 'yellow', rgb: [4, 4, 0] },
  { name: 'orange', rgb: [4, 3, 0] },
  { name: 'red', rgb: [4, 1, 2] },
  { name: 'purple', rgb: [4, 1, 4] },
  { name: 'darkYellow', rgb: [3, 3, 0] },
  { name: 'purple2', rgb: [2, 0, 3] },
];

export default function ExerciseGame() {
  const location = useLocation();
  const navigate = useNavigate();
  const { numCosmos = 2, duration = 30 } = location.state || {};
  const [activeIndex, setActiveIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null); // 'correct' or 'incorrect'
  const { connectedDevices, deviceValues } = useWebSocket();
  const intervalRef = useRef(null);
  const cosmosToUse = useMemo(() => connectedDevices.slice(0, numCosmos), [connectedDevices, numCosmos]);
  const lastPressRef = useRef({});
  const isUnmountingRef = useRef(false);

  // Get the active device from cosmosToUse array
  const activeDevice = useMemo(() => {
    if (!cosmosToUse.length) return null;
    return cosmosToUse[activeIndex];
  }, [cosmosToUse, activeIndex]);

  // Handle button press for the active device
  const handleButtonPress = useCallback((deviceId) => {
    if (!activeDevice || deviceId !== activeDevice.id) {
      console.log('Wrong button pressed!');
      setFeedback('incorrect');
      setTimeout(() => {
        setFeedback(null);
      }, 500);
      return;
    }

    console.log('Correct button pressed!');
    setFeedback('correct');
    setScore(s => s + 1);
    setTimeout(() => {
      setFeedback(null);
      setActiveIndex(i => (i + 1) % cosmosToUse.length);
    }, 500);
  }, [activeDevice, cosmosToUse.length]);

  const checkButtonStates = useCallback(() => {
    console.log('Checking button states:', {
      activeDevice,
      deviceValues,
      lastPressRef
    });

    if (!activeDevice || !deviceValues[activeDevice.id]) {
      console.log('No active device or device values');
      return;
    }

    const deviceValue = deviceValues[activeDevice.id];
    console.log(`Device ${activeDevice.id} button state:`, deviceValue.buttonState);
    console.log(`Device ${activeDevice.id} press value:`, deviceValue.pressValue);

    // Check if button is pressed (buttonState === 1)
    if (deviceValue.buttonState === 1) {
      const now = Date.now();
      // Only trigger if we haven't seen a press in the last 500ms
      if (!lastPressRef.current[activeDevice.id] || now - lastPressRef.current[activeDevice.id] > 500) {
        console.log(`Button press detected for device ${activeDevice.id}`);
        lastPressRef.current[activeDevice.id] = now;
        handleButtonPress(activeDevice.id);
      }
    }
  }, [activeDevice, deviceValues, handleButtonPress]);

  // Listen for button press on all Cosmos, but only react if it's the active one
  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      if (!activeDevice) return;
      checkButtonStates();
    }, 100);

    intervalRef.current = interval;
    return () => clearInterval(interval);
  }, [gameOver, checkButtonStates, activeDevice]);

  // Cleanup: turn off all devices only when component unmounts
  useEffect(() => {
    return () => {
      if (!isUnmountingRef.current) {
        isUnmountingRef.current = true;
        cosmosToUse.forEach((device, idx) => {
          wsService.setMode(device.id, 4); // Set to Button Inverted mode
          const [r, g, b] = colorMap[idx % colorMap.length].rgb;
          wsService.setColor(device.id, r, g, b);
        });
      }
    };
  }, []); // Empty dependency array means this only runs on mount/unmount

  useEffect(() => {
    if (!numCosmos || !duration) {
      navigate('/exercise-settings');
    }
  }, [numCosmos, duration, navigate]);

  useEffect(() => {
    if (gameOver) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(intervalRef.current);
          setGameOver(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [gameOver]);

  // Add debug logging for device values changes
  useEffect(() => {
    console.log('[ExerciseGame] Device values updated:', deviceValues);
  }, [deviceValues]);

  if (gameOver) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-200 to-purple-200">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
          <h1 className="text-3xl font-bold mb-4">Game Over!</h1>
          <p className="text-xl mb-2">Score: {score}</p>
          <button
            onClick={() => navigate('/exercise-settings')}
            className="mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 font-semibold"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-200 to-purple-200">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold mb-2">Exercise Game</h1>
        <p className="text-lg">Time Left: {timeLeft}s</p>
        <p className="text-lg">Score: {score}</p>
        {feedback && (
          <p className={`text-xl font-bold mt-2 ${
            feedback === 'correct' ? 'text-green-600' : 'text-red-600'
          }`}>
            {feedback === 'correct' ? '✓ Correct!' : '✗ Wrong button!'}
          </p>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-6">
        {cosmosToUse.map((device, idx) => (
          <div
            key={device.id}
            className={`circle circle-${colorMap[idx % colorMap.length].name} ${
              idx === activeIndex ? 'circle-active animate-pulse' : 'opacity-50'
            } ${
              feedback === 'correct' && idx === activeIndex ? 'ring-4 ring-green-500' :
              feedback === 'incorrect' && idx === activeIndex ? 'ring-4 ring-red-500' : ''
            }`}
            style={{ 
              width: idx === activeIndex ? 100 : 80, 
              height: idx === activeIndex ? 100 : 80, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: idx === activeIndex ? 32 : 24,
              transform: idx === activeIndex ? 'scale(1.1)' : 'scale(1)',
              transition: 'all 0.2s ease-in-out'
            }}
          />
        ))}
      </div>
    </div>
  );
} 