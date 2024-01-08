import React, { useEffect, useState } from 'react';
import Confetti from 'react-dom-confetti';

function GamePress({ gameStatus }) {
  const [explodeConfetti, setExplodeConfetti] = useState(false);

  useEffect(() => {
    if (gameStatus === 'Pressed') {
      setExplodeConfetti(true);
      setTimeout(() => setExplodeConfetti(false), 1000); // Reset confetti
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
    <div>
      <h1>Game Press Page</h1>
      <p>Button State: {gameStatus}</p>
      <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}>
        <Confetti active={explodeConfetti} config={confettiConfig} />
      </div>
    </div>
  );
}

export default GamePress;
