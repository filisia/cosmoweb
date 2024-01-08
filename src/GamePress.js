import React, { useEffect, useState } from 'react';
import Confetti from 'react-dom-confetti';

function GamePress({ gameStatus }) {
  const [explodeConfetti, setExplodeConfetti] = useState(false);

  useEffect(() => {
    if (gameStatus === 'Pressed') {
      setExplodeConfetti(true);
      setTimeout(() => setExplodeConfetti(false), 1000);
    }
  }, [gameStatus]);

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

  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-r from-cyan-500 to-blue-500">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Game Press Page</h1>
        <p className={`text-2xl font-semibold ${gameStatus === 'Pressed' ? 'text-green-300' : 'text-red-300'}`}>
          Button State: {gameStatus || 'Idle'}
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
