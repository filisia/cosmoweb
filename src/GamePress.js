// GamePress.js
import React, { useEffect, useState } from 'react';
import Confetti from 'react-dom-confetti';
import wsService from './services/WebSocketService';
import { useWebSocket } from './contexts/WebSocketContext';

function GamePress() {
  const { wsConnected, connectionError } = useWebSocket();
  const [explodeConfetti, setExplodeConfetti] = useState(false);
  const [gameStatus, setGameStatus] = useState('Idle');

  useEffect(() => {
    const removeListener = wsService.addListener((status, data) => {
      if (status === 'characteristicChanged' && 
          data.characteristicUUID === '000015251212efde1523785feabcd123') {
        const buttonStatus = data.value[0] === 0 ? 'Pressed' : 'Released';
        setGameStatus(buttonStatus);
        
        if (buttonStatus === 'Pressed') {
          setExplodeConfetti(true);
          setTimeout(() => setExplodeConfetti(false), 1000);
        }
      }
    });

    return () => removeListener();
  }, []);

  // Configuration object for the confetti effect
  const confettiConfig = {
    angle: 90,
    spread: 360,
    startVelocity: 40,
    elementCount: 200,
    dragFriction: 0.12,
    duration: 3000,
    stagger: 3,
    width: "10px",
    height: "10px",
    perspective: "500px",
    colors: ["#a864fd", "#29cdff", "#78ff44", "#ff718d", "#fdff6a"]
  };

  if (!wsConnected || connectionError) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-r from-cyan-500 to-blue-500">
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
    <div className="flex justify-center items-center h-screen bg-gradient-to-r from-cyan-500 to-blue-500">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Game Press Page</h1>
        <p className={`text-2xl font-semibold ${gameStatus === 'Pressed' ? 'text-green-300' : 'text-red-300'}`}>
          Button State: {gameStatus}
        </p>
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}>
          <Confetti active={explodeConfetti} config={confettiConfig} />
        </div>
      </div>
    </div>
  );
}

export default GamePress;
