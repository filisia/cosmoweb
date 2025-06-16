import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useWebSocket } from '../contexts/WebSocketContext';
import wsService from '../services/WebSocketService';

const colorMap = [
  { name: 'blue', rgb: [0, 0, 4] },
  { name: 'green', rgb: [0, 4, 0] },
  { name: 'yellow', rgb: [4, 4, 0] },
  { name: 'orange', rgb: [4, 2, 0] },
  { name: 'red', rgb: [4, 0, 0] },
  { name: 'purple', rgb: [2, 0, 4] },
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
  const { connectedDevices, deviceValues } = useWebSocket();
  const intervalRef = useRef();
  const cosmosToUse = connectedDevices.slice(0, numCosmos);
  const lastPressRef = useRef(false);

  // Set colors on mount and when activeIndex changes
  useEffect(() => {
    if (!cosmosToUse.length) return;
    cosmosToUse.forEach((device, idx) => {
      if (idx === activeIndex) {
        const [r, g, b] = colorMap[idx % colorMap.length].rgb;
        wsService.setColor(device.id, r, g, b);
      } else {
        wsService.setColor(device.id, 0, 0, 0); // turn off
      }
    });
    // Cleanup: turn off all on unmount
    return () => {
      cosmosToUse.forEach(device => wsService.setColor(device.id, 0, 0, 0));
    };
  }, [activeIndex, cosmosToUse]);

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

  // Listen for button press on the active Cosmo
  useEffect(() => {
    if (gameOver) return;
    const activeDevice = cosmosToUse[activeIndex];
    if (!activeDevice) return;
    const buttonState = deviceValues[activeDevice.id]?.buttonStatus;
    // Only count a press if it wasn't pressed last render
    if ((buttonState === true || buttonState === 0) && !lastPressRef.current) {
      setScore(s => s + 1);
      setActiveIndex(i => (i + 1) % cosmosToUse.length);
      lastPressRef.current = true;
    } else if (buttonState !== true && buttonState !== 0) {
      lastPressRef.current = false;
    }
  }, [deviceValues, activeIndex, cosmosToUse, gameOver]);

  if (gameOver) {
    // Turn off all devices when game is over
    cosmosToUse.forEach(device => wsService.setColor(device.id, 0, 0, 0));
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
      </div>
      <div className="flex flex-wrap justify-center gap-6">
        {cosmosToUse.map((device, idx) => (
          <div
            key={device.id}
            className={`circle circle-${colorMap[idx % colorMap.length].name} ${idx === activeIndex ? 'circle-active animate-pulse' : ''}`}
            style={{ width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}
          >
            {device.name || device.id}
          </div>
        ))}
      </div>
    </div>
  );
} 