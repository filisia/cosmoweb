import React, { useEffect, useState } from 'react';
import wsService from './services/WebSocketService';
import { useWebSocket } from './contexts/WebSocketContext';

function GrowShrinkGame() {
  const { wsConnected, connectionError } = useWebSocket();
  const [size, setSize] = useState(100); // Base size

  useEffect(() => {
    const removeListener = wsService.addListener((status, data) => {
      if (status === 'characteristicChanged' && 
          data.characteristicUUID === '000015241212efde1523785feabcd123') {
        const pressValue = data.value[0];
        const newSize = 100 + pressValue;
        setSize(newSize);
      }
    });

    return () => removeListener();
  }, []);

  if (!wsConnected || connectionError) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-r from-green-300 to-blue-300">
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
    <div className="flex justify-center items-center h-screen bg-gradient-to-r from-green-300 to-blue-300">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Grow/Shrink Game</h1>
        <div 
          className="animate-pulse bg-purple-500 rounded-full transition-all duration-200" 
          style={{ width: `${size}px`, height: `${size}px` }}
        />
      </div>
    </div>
  );
}

export default GrowShrinkGame;
