import React, { useEffect, useState } from 'react';
import { useWebSocket } from './contexts/WebSocketContext';

function GrowShrinkGame() {
  const { wsConnected, connectionError, deviceValues, connectedDevices } = useWebSocket();
  const [size, setSize] = useState(100); // Base size
  const [selectedDevice, setSelectedDevice] = useState(null);

  // Update selected device when devices connect/disconnect
  useEffect(() => {
    if (connectedDevices.length > 0) {
      setSelectedDevice(connectedDevices[0].id);
    } else {
      setSelectedDevice(null);
    }
  }, [connectedDevices]);

  // Handle sensor value changes
  useEffect(() => {
    if (!selectedDevice || !deviceValues[selectedDevice]) return;

    const sensorValue = deviceValues[selectedDevice].sensorValue;
    if (sensorValue !== undefined) {
      // Map sensor value (0-255) to size range (50-200)
      const newSize = 50 + (sensorValue * 150 / 255);
      setSize(newSize);
    }
  }, [selectedDevice, deviceValues]);

  if (!wsConnected || connectionError) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-r from-green-300 to-blue-300">
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
    <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-r from-green-300 to-blue-300">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">Grow/Shrink Game</h1>
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
        <p className="text-white mb-4">
          Current Size: {Math.round(size)}px
        </p>
      </div>
      <div 
        className="animate-pulse bg-purple-500 rounded-full transition-all duration-200" 
        style={{ 
          width: `${size}px`, 
          height: `${size}px`,
          boxShadow: '0 0 20px rgba(147, 51, 234, 0.5)'
        }}
      />
    </div>
  );
}

export default GrowShrinkGame;
