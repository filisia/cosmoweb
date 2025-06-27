import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useWebSocket } from '../contexts/WebSocketContext';
import wsService from '../services/WebSocketService';

const colorMap = [
  { name: 'blue', rgb: [0, 0, 4], tailwind: 'border-blue-500', bgTailwind: 'bg-blue-500' },
  { name: 'green', rgb: [0, 4, 0], tailwind: 'border-green-400', bgTailwind: 'bg-green-400' },
  { name: 'yellow', rgb: [4, 3, 0], tailwind: 'border-yellow-400', bgTailwind: 'bg-yellow-400' },
  { name: 'orange', rgb: [4, 1, 0], tailwind: 'border-orange-400', bgTailwind: 'bg-orange-400' },
  { name: 'red', rgb: [4, 0, 0], tailwind: 'border-red-400', bgTailwind: 'bg-red-400' },
  { name: 'purple', rgb: [4, 0, 4], tailwind: 'border-purple-400', bgTailwind: 'bg-purple-400' },
];

export default function ExerciseGame() {
  const location = useLocation();
  const navigate = useNavigate();
  const { numCosmos = 2, duration = 30 } = location.state || {};
  const [activeIndex, setActiveIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'correct' or 'incorrect'
  const { connectedDevices, deviceValues } = useWebSocket();
  const intervalRef = useRef(null);
  const cosmosToUse = useMemo(() => connectedDevices.slice(0, numCosmos), [connectedDevices, numCosmos]);
  const lastPressRef = useRef({});
  const isUnmountingRef = useRef(false);
  const previousButtonStates = useRef({});
  const hasInitializedRef = useRef(false);
  const currentLightingState = useRef({}); // Track current lighting state to prevent unnecessary updates

  // Get the active device from cosmosToUse array
  const activeDevice = useMemo(() => {
    if (!cosmosToUse.length) return null;
    const device = cosmosToUse[activeIndex];
    // console.log(`[ExerciseGame] 🎯 Active device calculated:`, {
    //   activeIndex,
    //   totalDevices: cosmosToUse.length,
    //   activeDevice: device,
    //   allDevices: cosmosToUse.map(d => ({ id: d.id, name: d.name }))
    // });
    return device;
  }, [cosmosToUse, activeIndex]);

  // Handle button press for the active device
  const handleButtonPress = useCallback((deviceId) => {
    // console.log(`[ExerciseGame] 🎯 handleButtonPress called with deviceId: ${deviceId}`);
    // console.log(`[ExerciseGame] 🎯 activeDevice:`, activeDevice);
    // console.log(`[ExerciseGame] 🎯 activeIndex: ${activeIndex}, cosmosToUse:`, cosmosToUse.map(d => d.id));
    
    if (!activeDevice || deviceId !== activeDevice.id) {
      // console.log(`[ExerciseGame] ❌ Button press ignored - deviceId mismatch or no active device`);
      // console.log(`[ExerciseGame] ❌ Expected: ${activeDevice?.id}, Got: ${deviceId}`);
      return;
    }
    console.log(`[ExerciseGame] ✅ Correct button press! Score: ${score + 1}, Moving from index ${activeIndex} to ${(activeIndex + 1) % cosmosToUse.length}`);
    setScore(s => s + 1);
    setActiveIndex(i => (i + 1) % cosmosToUse.length);
  }, [activeDevice, cosmosToUse, score, activeIndex]);

  const checkButtonStates = useCallback(() => {
    if (!gameStarted || !activeDevice || !deviceValues[activeDevice.id]) {
      // console.log(`[ExerciseGame] 🔍 checkButtonStates skipped:`, {
      //   gameStarted,
      //   hasActiveDevice: !!activeDevice,
      //   activeDeviceId: activeDevice?.id,
      //   hasDeviceValue: !!deviceValues[activeDevice?.id]
      // });
      return;
    }
    const deviceValue = deviceValues[activeDevice.id];
    const currentButtonState = deviceValue.buttonState;
    const previousButtonState = previousButtonStates.current[activeDevice.id];
    
    // Ensure previousButtonState is initialized
    if (previousButtonState === undefined) {
      previousButtonStates.current[activeDevice.id] = currentButtonState;
      // console.log(`[ExerciseGame] 🔍 Initialized button state for ${activeDevice.id}: ${currentButtonState}`);
      return;
    }
    
    const wasReleased = !previousButtonState || previousButtonState === 0;
    const isPressed = currentButtonState === 1;
    
    // console.log('[ExerciseGame] 🔍 Checking button states:', {
    //   deviceId: activeDevice.id,
    //   currentButtonState,
    //   previousButtonState,
    //   wasReleased,
    //   isPressed,
    //   gameStarted,
    //   hasDeviceValue: !!deviceValues[activeDevice.id],
    //   timestamp: new Date().toISOString()
    // });
    
    if (wasReleased && isPressed) {
      handleButtonPress(activeDevice.id);
    }
    
    // Update previous button state
    previousButtonStates.current[activeDevice.id] = currentButtonState;
  }, [gameStarted, activeDevice, deviceValues, handleButtonPress]);

  // Check button states immediately when device values change
  useEffect(() => {
    if (gameStarted && activeDevice && deviceValues[activeDevice.id]) {
      checkButtonStates();
    }
  }, [deviceValues, gameStarted, activeDevice, checkButtonStates]);

  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      if (!activeDevice) return;
      checkButtonStates();
    }, 250);
    intervalRef.current = interval;
    return () => clearInterval(interval);
  }, [gameOver, checkButtonStates, activeDevice]);

  useEffect(() => {
    return () => {
      if (!isUnmountingRef.current) {
        isUnmountingRef.current = true;
        cosmosToUse.forEach((device, idx) => {
          // wsService.setMode(device.id, 4);
          const [r, g, b] = colorMap[idx % colorMap.length].rgb;
          wsService.setColor(device.id, r, g, b);
          wsService.setLuminosity(device.id, 64);
        });
      }
    };
  }, []);

  useEffect(() => {
    if (!numCosmos || !duration) {
      navigate('/exercise-settings');
    }
  }, [numCosmos, duration, navigate]);

  useEffect(() => {
    if (gameOver) return;
    
    // Don't start countdown timer if duration is infinite (-1)
    if (duration === -1) return;
    
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
  }, [gameOver, duration]);

  useEffect(() => {
    if (cosmosToUse.length > 0 && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      console.log(`[ExerciseGame] 🎮 Initializing ${cosmosToUse.length} devices`);
      cosmosToUse.forEach((device, idx) => {
        // Set mode, color, and luminosity for each device
        // console.log(`[ExerciseGame] 🎮 Setting up device ${device.id} (index ${idx}) - Color: ${colorMap[idx % colorMap.length].name}, Luminosity: 0`);
        const [r, g, b] = colorMap[idx % colorMap.length].rgb;
        wsService.setColor(device.id, r, g, b);
        wsService.setLuminosity(device.id, 0); // Start with zero luminosity
        currentLightingState.current[device.id] = 0;
        previousButtonStates.current[device.id] = 0; // Initialize to released state
      });
      
      // Set the first device as active (light it up)
      if (cosmosToUse.length > 0) {
        const firstDevice = cosmosToUse[0];
        // console.log(`[ExerciseGame] 🎮 Lighting up first device: ${firstDevice.id}`);
        wsService.setLuminosity(firstDevice.id, 64);
        currentLightingState.current[firstDevice.id] = 64;
      }
    }
  }, [cosmosToUse, wsService]);

  // Light up only the active device
  useEffect(() => {
    if (!activeDevice) return;
    
    // console.log(`[ExerciseGame] 💡 Lighting active device: ${activeDevice.id} (index ${activeIndex})`);
    
    // Turn off all devices first
    cosmosToUse.forEach(device => {
      if (currentLightingState.current[device.id] !== 0) {
        // console.log(`[ExerciseGame] 💡 Turning off device: ${device.id}`);
        wsService.setLuminosity(device.id, 0);
        currentLightingState.current[device.id] = 0;
      }
    });
    
    // Light up the active device
    if (currentLightingState.current[activeDevice.id] !== 64) {
      // console.log(`[ExerciseGame] 💡 Lighting up active device: ${activeDevice.id}`);
      wsService.setLuminosity(activeDevice.id, 64);
      currentLightingState.current[activeDevice.id] = 64;
    }
  }, [activeDevice, activeIndex, cosmosToUse, wsService]);

  // --- UI ---
  if (gameOver) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
          <h1 className="text-3xl font-bold mb-4">Game Over!</h1>
          <p className="text-xl mb-2">Score: {score}</p>
          <button
            onClick={() => navigate('/exercise-settings')}
            className="mt-4 bg-purple-600 text-white py-2 px-4 rounded-full hover:bg-purple-700 font-semibold"
          >
            Back to Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 pt-4 pb-2">
        <button
          onClick={() => navigate('/exercise-settings')}
          className="rounded-full border-2 border-purple-400 text-purple-600 p-2 hover:bg-purple-50 transition"
          aria-label="Back"
        >
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div className="flex-1 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">⏳</span>
            <span className="text-lg font-semibold">
              {duration === -1 ? '∞' : `${String(Math.floor(timeLeft/60)).padStart(2,'0')}:${String(timeLeft%60).padStart(2,'0')}`}
            </span>
          </div>
          <div className="mt-1">
            <span className="inline-flex items-center px-4 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold text-base">
              <span className="mr-2 text-xl">🎵</span> Brass Beat
            </span>
          </div>
          <div className="mt-2">
            <span className="inline-flex items-center px-4 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-base">
              <span className="mr-2 text-xl">🏆</span> Score: {score}
            </span>
          </div>
        </div>
        <button
          onClick={() => navigate('/exercise-settings')}
          className="rounded-full border-2 border-gray-300 text-gray-600 p-2 hover:bg-gray-100 transition ml-2"
          aria-label="End Game"
        >
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor"/></svg>
        </button>
      </div>
      {/* Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="flex flex-row items-center justify-center gap-12 mt-8">
          {cosmosToUse.map((device, idx) => {
            const isActive = idx === activeIndex;
            const colorInfo = colorMap[idx % colorMap.length];
            return (
              <div
                key={device.id}
                className={`flex items-center justify-center rounded-full border-4 transition-all duration-200 ${
                  isActive 
                    ? `${colorInfo.bgTailwind} border-white` 
                    : `${colorInfo.tailwind} bg-white`
                }`}
                style={{
                  width: 180,
                  height: 180,
                  boxShadow: isActive ? '0 0 20px rgba(0, 0, 0, 0.3)' : 'none',
                }}
              >
                {/* Optional: Add a subtle inner glow for active circles */}
                {isActive && (
                  <div 
                    className="w-full h-full rounded-full opacity-20"
                    style={{ 
                      background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)'
                    }} 
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 