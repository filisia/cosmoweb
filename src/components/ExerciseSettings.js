import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../contexts/WebSocketContext';

export default function ExerciseSettings() {
  const navigate = useNavigate();
  const { connectedDevices } = useWebSocket();
  const numCosmos = connectedDevices.length;
  
  // Duration options: [seconds, displayText]
  const durationOptions = [
    [30, '30s'],
    [60, '1m'],
    [120, '2m'],
    [-1, '∞']
  ];
  
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handlePlay = () => {
    navigate('/exercise', { state: { numCosmos, duration: selectedDuration, soundEnabled } });
  };

  const handleHelp = () => {
    alert('Help coming soon!');
  };

  const formatDuration = (seconds) => {
    if (seconds === -1) return 'Infinite';
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds === 60) return '1 minute';
    return `${Math.floor(seconds / 60)} minutes`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-purple-50 py-8">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-xl">
        <div className="flex items-center mb-4">
          <h1 className="text-3xl font-bold tracking-wide text-gray-800">EXERCISE</h1>
        </div>
        <div className="text-gray-700 text-lg mb-2">
          Distribute the Cosmoids across the play area and swiftly press them as they illuminate to earn points before time runs out.
        </div>
        <div className="text-sm text-gray-500 mb-6">
          Skills Area: Joint Attention, Reaction Time, Motor Co-ordination, Spatial Awareness
        </div>
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <div className="text-xs text-gray-500 font-semibold mb-1">MUSIC TRACK</div>
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-base font-medium">
              <span className="mr-2 text-yellow-500 text-xl">🎵</span> Brass Beat
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 font-semibold mb-1">DURATION OF GAME</div>
            <div className="flex gap-2 mt-1">
              {durationOptions.map(([seconds, displayText]) => (
                <div
                  key={seconds}
                  onClick={() => setSelectedDuration(seconds)}
                  className={`w-12 h-9 flex items-center justify-center rounded-lg border-2 text-sm font-bold select-none transition-all cursor-pointer ${
                    selectedDuration === seconds 
                      ? 'border-purple-500 bg-purple-100 text-purple-700' 
                      : 'border-gray-300 bg-white text-gray-600 hover:border-purple-300'
                  }`}
                >
                  {displayText}
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {formatDuration(selectedDuration)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 font-semibold mb-1">NUMBER OF COSMOIDS</div>
            <div className="flex gap-2 mt-1">
              {[1,2,3,4,5,6].map(i => (
                <div
                  key={i}
                  className={`w-9 h-9 flex items-center justify-center rounded-full border-2 text-lg font-bold select-none transition-all ${i <= numCosmos ? 'border-purple-500 bg-purple-100 text-purple-700' : 'border-gray-300 bg-white text-gray-300'}`}
                >
                  {i}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 font-semibold mb-1">SOUND</div>
            <div 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="flex items-center h-9 pl-1 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
            >
              {soundEnabled ? (
                <span className="text-2xl text-green-600">🔊</span>
              ) : (
                <span className="text-2xl text-gray-400">🔇</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-8 mt-8">
          <button
            onClick={handlePlay}
            className="bg-green-500 hover:bg-green-600 text-white text-lg font-bold rounded-full px-10 py-3 shadow-md transition"
          >
            PLAY
          </button>
          <button
            onClick={handleHelp}
            className="bg-white border-2 border-gray-200 hover:border-purple-400 text-gray-700 text-lg font-bold rounded-full px-10 py-3 transition"
          >
            HELP
          </button>
        </div>
      </div>
    </div>
  );
} 