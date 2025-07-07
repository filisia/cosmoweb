import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './style.css';
// import GamePress from './GamePress';
import HomePage from './HomePage';
// import GrowShrinkGame from './GrowShrinkGame';
// import LEDModePage from './LEDModePage';
// import WhacAMole from './components/WhacAMole';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { GameSettingsProvider } from './contexts/GameSettingsContext';
import ExerciseSettings from './components/ExerciseSettings';
import ExerciseGame from './components/ExerciseGame';
import cosmoLogo from './assets/images/cosmo_logo.png';

function App() {
  // Define colors array for the HomePage circles
  const colors = ['blue', 'green', 'yellow', 'orange', 'red', 'purple'];

  return (
    <GameSettingsProvider>
      <WebSocketProvider>
        <Router>
          <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-lg">
              <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <img src={cosmoLogo} alt="Cosmo Logo" style={{ width: 80, objectFit: 'contain' }} />
                </div>
                <div className="flex justify-center flex-1">
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
                        to="/exercise-settings" 
                        className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                      >
                        Exercise
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
                  path="/exercise-settings" 
                  element={<ExerciseSettings />} 
                />
                <Route 
                  path="/exercise" 
                  element={<ExerciseGame />} 
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
