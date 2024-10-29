import React, { useState, useEffect } from 'react';
import wsService from './services/WebSocketService';

const ledModes = [
  { name: 'Solid Color', value: 0, description: 'Static single color display' },
  { name: 'Breathing', value: 1, description: 'Smooth pulsing effect' },
  { name: 'Rainbow', value: 2, description: 'Cycling through colors' },
  // Add more modes as needed
];

const LEDModePage = ({ server }) => {
  const [selectedMode, setSelectedMode] = useState('');
  const [connected, setConnected] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [color, setColor] = useState({ r: 4, g: 4, b: 4 }); // Default to white
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    wsService.connect();
    const removeListener = wsService.addListener((status, data) => {
      switch (status) {
        case 'connected':
          setConnected(true);
          setConnectionError(null);
          break;
        case 'disconnected':
          setConnected(false);
          break;
        case 'connectionFailed':
          setConnected(false);
          setConnectionError(data.message);
          break;
        case 'eventResult':
          console.log('Command result:', data);
          break;
        default:
          break;
      }
    });

    return () => removeListener();
  }, []);

  const handleModeChange = async (mode) => {
    setSelectedMode(mode);
    try {
      // First set the color
      await wsService.setColor(server.id, color.r, color.g, color.b);
      
      // Then set the brightness
      await wsService.setLuminosity(server.id, brightness);

      console.log('LED mode and parameters changed:', mode.name);
    } catch (error) {
      console.error('Error changing LED mode and parameters:', error);
    }
  };

  const handleBrightnessChange = (value) => {
    setBrightness(value);
    wsService.setLuminosity(server.id, value);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Change LED Mode</h1>
      
      {connectionError ? (
        <div className="mt-4 p-4 bg-yellow-100 text-yellow-700 rounded">
          {connectionError}
        </div>
      ) : (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Brightness</label>
            <input
              type="range"
              min="0"
              max="100"
              value={brightness}
              onChange={(e) => handleBrightnessChange(Number(e.target.value))}
              className="w-full"
              disabled={!connected}
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
                  disabled={!connected}
                >
                  {mode.name}
                </button>
                <p className="text-sm text-gray-600">{mode.description}</p>
              </div>
            ))}
          </div>

          {!connected && !connectionError && (
            <div className="mt-4 p-4 bg-yellow-100 text-yellow-700 rounded">
              Not connected to Cosmoid Bridge. Please ensure the bridge is running and try again.
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LEDModePage;
