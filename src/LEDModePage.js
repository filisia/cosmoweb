import React, { useState, useEffect } from 'react';
import wsService from './services/WebSocketService';
import { useWebSocket } from './contexts/WebSocketContext';

const ledModes = [
  { name: 'Solid Color', value: 0, description: 'Static single color display' },
  { name: 'Breathing', value: 1, description: 'Smooth pulsing effect' },
  { name: 'Rainbow', value: 2, description: 'Cycling through colors' },
];

const MAX_BRIGHTNESS = 64;

const LEDModePage = () => {
  const { wsConnected, connectionError, connectedDevices } = useWebSocket();
  const [selectedMode, setSelectedMode] = useState('');
  const [brightness, setBrightness] = useState(64);
  const [animationInterval, setAnimationInterval] = useState(null);

  useEffect(() => {
    return () => {
      if (animationInterval) {
        clearInterval(animationInterval);
      }
    };
  }, [animationInterval]);

  const handleModeChange = async (mode) => {
    setSelectedMode(mode);
    
    try {
      const randomColor = {
        r: Math.floor(Math.random() * 4),
        g: Math.floor(Math.random() * 4),
        b: Math.floor(Math.random() * 4)
      };

      switch (mode.value) {
        case 0: // Solid Color
          connectedDevices.forEach(device => {
            // console.log('Setting solid color to:', randomColor);
            wsService.setColor(device.id, randomColor.r, randomColor.g, randomColor.b);
            wsService.setLuminosity(device.id, Math.min(brightness, MAX_BRIGHTNESS));
          });
          break;

        case 1: // Breathing
          // Send 50 commands for breathing effect
          connectedDevices.forEach(device => {
            // Initial color setup
            wsService.setColor(device.id, randomColor.r, randomColor.g, randomColor.b);
            
            // Ramp up brightness
            for (let i = 0; i < 25; i++) {
              const stepBrightness = Math.min(Math.round((i / 24) * brightness), MAX_BRIGHTNESS);
              wsService.setLuminosity(device.id, stepBrightness);
            }
            
            // Ramp down brightness
            for (let i = 24; i >= 0; i--) {
              const stepBrightness = Math.min(Math.round((i / 24) * brightness), MAX_BRIGHTNESS);
              wsService.setLuminosity(device.id, stepBrightness);
            }
          });
          break;

        case 2: // Rainbow
          connectedDevices.forEach(device => {
            // Send 60 color commands for rainbow effect
            for (let i = 0; i < 20; i++) {
              let randomColor = {
                r: Math.floor(Math.random() * 4),
                g: Math.floor(Math.random() * 4),
                b: Math.floor(Math.random() * 4)
              };
              wsService.setColor(device.id, randomColor.r, randomColor.g, randomColor.b);
              wsService.setLuminosity(device.id, Math.min(brightness, MAX_BRIGHTNESS));
            }
          });
          break;
      }
      console.log('LED mode and parameters changed:', mode.name);
    } catch (error) {
      console.error('Error changing LED mode and parameters:', error);
    }
  };

  const handleBrightnessChange = (value) => {

    setBrightness(value);
    const randomColor = {
      r: Math.floor(Math.random() * 4),
      g: Math.floor(Math.random() * 4),
      b: Math.floor(Math.random() * 4)
    };
    // Apply to all connected devices
    connectedDevices.forEach(device => {
      // Send color command first
      wsService.setColor(device.id, randomColor.r, randomColor.g, randomColor.b);
      // Then set brightness
      wsService.setLuminosity(device.id, value);
    });
  };

  if (!wsConnected || connectionError) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-r from-purple-300 to-blue-300">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Connection Required</h1>
          <p className="mb-4">Please ensure Cosmoid Bridge is running and connected.</p>
          <button
            onClick={() => wsService.connect()}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Change LED Mode</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Brightness</label>
        <input
          type="range"
          min="0"
          max={MAX_BRIGHTNESS}
          value={brightness}
          onChange={(e) => handleBrightnessChange(Number(e.target.value))}
          className="w-full"
        />
        <span>{brightness}%</span>
      </div>

      <div className="space-y-4">
        {ledModes.map((mode) => (
          <div key={mode.value} className="border p-4 rounded">
            <button
              onClick={() => handleModeChange(mode)}
              className={`w-full p-2 rounded mb-2 ${
                selectedMode === mode ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              {mode.name}
            </button>
            <p className="text-sm text-gray-600">{mode.description}</p>
          </div>
        ))}
      </div>

      {connectedDevices.length === 0 && (
        <div className="mt-4 p-4 bg-yellow-100 text-yellow-700 rounded">
          No devices connected. Please connect a Cosmoid device to control its LED.
        </div>
      )}
    </div>
  );
};

// Helper function for rainbow effect
const hsvToRgb = (h, s, v) => {
  let r, g, b;
  const i = Math.floor(h / 60);
  const f = h / 60 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
};

export default LEDModePage;
