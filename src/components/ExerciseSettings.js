import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../contexts/WebSocketContext';
import wsService from '../services/WebSocketService';

const durations = [
  { label: '30 seconds', value: 30 },
  { label: '1 minute', value: 60 },
  { label: '2 minutes', value: 120 },
];

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

export default function ExerciseSettings() {
  const [numCosmos, setNumCosmos] = useState(2);
  const [duration, setDuration] = useState(30);
  const navigate = useNavigate();
  const { connectedDevices } = useWebSocket();

  const handlePlay = () => {
    // Set colors for the Cosmos that will be used in the game
    const cosmosToUse = connectedDevices.slice(0, numCosmos);
    cosmosToUse.forEach((device, idx) => {
      const [r, g, b] = colorMap[idx % colorMap.length].rgb;
      wsService.setColor(device.id, r, g, b);
    });
    
    navigate('/exercise', { state: { numCosmos, duration } });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-200 to-purple-200">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Exercise Game Settings</h1>
        <div className="mb-4">
          <label className="block mb-2 font-medium">Number of Cosmos</label>
          <input
            type="number"
            min={2}
            max={8}
            value={numCosmos}
            onChange={e => setNumCosmos(Math.max(2, Math.min(8, Number(e.target.value))))}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2 font-medium">Game Duration</label>
          <select
            value={duration}
            onChange={e => setDuration(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded"
          >
            {durations.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handlePlay}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-semibold"
        >
          Play
        </button>
      </div>
    </div>
  );
} 