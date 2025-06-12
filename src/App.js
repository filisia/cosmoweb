import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './style.css';
import GamePress from './GamePress';
import HomePage from './HomePage';
import GrowShrinkGame from './GrowShrinkGame';
import LEDModePage from './LEDModePage';
import WhacAMole from './components/WhacAMole';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { GameSettingsProvider } from './contexts/GameSettingsContext';

function App() {
  // Define colors array for the HomePage circles
  const colors = ['blue', 'green', 'yellow', 'orange', 'red', 'purple'];

  return (
    <GameSettingsProvider>
      <WebSocketProvider>
        <Router>
          <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-lg">
              <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-center">
                  <ul className="flex space-x-8 py-4">
                    <li>
                      <Link 
                        to="/" 
                        className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                      >
                        Home
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="/game-press" 
                        className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                      >
                        Game Press
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="/grow-shrink-game" 
                        className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                      >
                        Grow/Shrink Game
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="/led-mode" 
                        className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                      >
                        LED Mode
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="/whac-a-mole" 
                        className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                      >
                        Whac-a-Mole
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              <Routes>
                <Route 
                  path="/" 
                  element={<HomePage colors={colors} />} 
                />
                <Route 
                  path="/game-press" 
                  element={<GamePress />} 
                />
                <Route 
                  path="/grow-shrink-game" 
                  element={<GrowShrinkGame />} 
                />
                <Route 
                  path="/led-mode" 
                  element={<LEDModePage />} 
                />
                <Route 
                  path="/whac-a-mole" 
                  element={<WhacAMole />} 
                />  
              </Routes>
            </main>
          </div>
        </Router>
      </WebSocketProvider>
    </GameSettingsProvider>
  );
}

export default App;
