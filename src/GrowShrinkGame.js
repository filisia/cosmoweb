import React, { useEffect, useState } from 'react';

function GrowShrinkGame({ pressValue }) {
  const [size, setSize] = useState(100); // Base size

  useEffect(() => {
    // Assuming pressValue is a number that determines the size
    const newSize = 100 + pressValue;
    setSize(newSize);
    
  }, [pressValue]);

  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-r from-green-300 to-blue-300">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Grow/Shrink Game</h1>
        <div className="animate-pulse bg-purple-500 rounded-full" style={{ width: `${size}px`, height: `${size}px` }}></div>
      </div>
    </div>
  );
}

export default GrowShrinkGame;
