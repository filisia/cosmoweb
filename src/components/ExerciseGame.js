import React, { useEffect, useState, useRef, useMemo } from 'react';
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
  const intervalRef = useRef();
  const cosmosToUse = useMemo(() => connectedDevices.slice(0, numCosmos), [connectedDevices, numCosmos]);
  const lastPressRef = useRef({});
  const isUnmountingRef = useRef(false);

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

  // Listen for button press on all Cosmos, but only react if it's the active one
  useEffect(() => {
    if (gameOver) return;
    if (!cosmosToUse.length) return;
    const activeDevice = cosmosToUse[activeIndex];
    if (!activeDevice) return;

    console.log('Checking button states:', {
      activeDevice: activeDevice.id,
      deviceValues,
      lastPressRef: lastPressRef.current
    });

    cosmosToUse.forEach((device, idx) => {
      const buttonState = deviceValues[device.id]?.buttonState;
      console.log(`Device ${device.id} button state:`, buttonState);
      
      if (buttonState === 'pressed' && !lastPressRef.current[device.id]) {
        console.log(`Button pressed for device ${device.id}, active device is ${activeDevice.id}`);
        lastPressRef.current[device.id] = true;
        if (device.id === activeDevice.id) {
          console.log('Correct button pressed!');
          setFeedback('correct');
          setScore(s => s + 1);
          setTimeout(() => {
            setFeedback(null);
            setActiveIndex(i => (i + 1) % cosmosToUse.length);
          }, 500);
        } else {
          console.log('Wrong button pressed!');
          setFeedback('incorrect');
          setTimeout(() => {
            setFeedback(null);
          }, 500);
        }
      } else if (buttonState === 'released') {
        console.log(`Button released for device ${device.id}`);
        lastPressRef.current[device.id] = false;
      }
    });
  }, [deviceValues, activeIndex, cosmosToUse, gameOver]);

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
              idx === activeIndex ? 'circle-active animate-pulse' : ''
            } ${
              feedback === 'correct' && idx === activeIndex ? 'ring-4 ring-green-500' :
              feedback === 'incorrect' && idx === activeIndex ? 'ring-4 ring-red-500' : ''
            }`}
            style={{ 
              width: 100, 
              height: 100, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: 32,
              transform: idx === activeIndex ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 0.2s ease-in-out'
            }}
          />
        ))}
      </div>
    </div>
  );
} 