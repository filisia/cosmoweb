// GamePress.js
import React, { useEffect, useState } from 'react';
import Confetti from 'react-dom-confetti';

// GamePress component definition
function GamePress({ gameStatus }) {
  // State hook to control the confetti explosion
  const [explodeConfetti, setExplodeConfetti] = useState(false);

  // Effect hook to handle changes in gameStatus
  useEffect(() => {
    // Trigger confetti explosion when the button is pressed
    if (gameStatus === 'Pressed') {
      setExplodeConfetti(true);
      // Reset the confetti explosion after 1 second
      setTimeout(() => setExplodeConfetti(false), 1000);
    }
  }, [gameStatus]);

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

  return (
    // Main container for the GamePress component
    <div className="flex justify-center items-center h-screen bg-gradient-to-r from-cyan-500 to-blue-500">
      <div className="text-center">
        {/* Title for the Game Press Page */}
        <h1 className="text-4xl font-bold text-white mb-4">Game Press Page</h1>
        {/* Display the current game status */}
        <p className={`text-2xl font-semibold ${gameStatus === 'Pressed' ? 'text-green-300' : 'text-red-300'}`}>
          Button State: {gameStatus || 'Idle'}
        </p>
        {/* Container for confetti animation */}
        <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}>
          {/* Confetti component triggered by state */}
          <Confetti active={explodeConfetti} config={confettiConfig} />
        </div>
      </div>
    </div>
  );
}

export default GamePress;
