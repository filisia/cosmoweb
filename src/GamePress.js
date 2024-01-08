// GamePress.js
import React, { useState, useEffect } from 'react';

function GamePress({ gameStatus }) {

    useEffect(() => {
      if (gameStatus === 'Pressed') {
        console.log('Button Pressed');
      } else if (gameStatus === 'Released') {
        console.log('Button Released');
      }
    }, [gameStatus]);
  
    return (
      <div>
        <h1>Game Press Page</h1>
        <p>Button State: {gameStatus}</p>
      </div>
    );
  }
  
export default GamePress;
