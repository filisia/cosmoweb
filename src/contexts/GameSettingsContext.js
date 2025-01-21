import React, { createContext, useContext, useState } from 'react';

const GameSettingsContext = createContext();

export function GameSettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    difficulty: 'medium',
    soundEnabled: true,
    vibrationEnabled: true,
    gameLength: 60, // seconds
  });

  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <GameSettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </GameSettingsContext.Provider>
  );
}

export function useGameSettings() {
  const context = useContext(GameSettingsContext);
  if (!context) {
    throw new Error('useGameSettings must be used within a GameSettingsProvider');
  }
  return context;
} 