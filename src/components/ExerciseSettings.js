import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const durations = [
  { label: '30 seconds', value: 30 },
  { label: '1 minute', value: 60 },
  { label: '2 minutes', value: 120 },
];

export default function ExerciseSettings() {
  const [numCosmos, setNumCosmos] = useState(2);
  const [duration, setDuration] = useState(30);
  const navigate = useNavigate();

  const handlePlay = () => {
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