import React, { useState } from 'react';
import wsService from './services/WebSocketService';
import { useWebSocket } from './contexts/WebSocketContext';

const ledModes = [
  { name: 'Solid Color', value: 0, description: 'Static single color display' },
  { name: 'Breathing', value: 1, description: 'Smooth pulsing effect' },
  { name: 'Rainbow', value: 2, description: 'Cycling through colors' },
];

const LEDModePage = () => {
  const { wsConnected, connectionError, connectedDevices } = useWebSocket();
  const [selectedMode, setSelectedMode] = useState('');
  const [brightness, setBrightness] = useState(100);
  const [color, setColor] = useState({ r: 4, g: 4, b: 4 }); // Default to white

  const handleModeChange = async (mode) => {
    setSelectedMode(mode);
    try {
      // Apply to all connected devices
      for (const device of connectedDevices) {
        // First set the color
        await wsService.setColor(device.id, color.r, color.g, color.b);
        
        // Then set the brightness
        await wsService.setLuminosity(device.id, brightness);
      }
      console.log('LED mode and parameters changed:', mode.name);
    } catch (error) {
      console.error('Error changing LED mode and parameters:', error);
    }
  };

  const handleBrightnessChange = (value) => {
    setBrightness(value);
    // Apply to all connected devices
    connectedDevices.forEach(device => {
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
          max="100"
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

export default LEDModePage;
