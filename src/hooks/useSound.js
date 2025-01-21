import { useEffect, useCallback, useMemo } from 'react';
import { useGameSettings } from '../contexts/GameSettingsContext';

export default function useSound(soundUrl) {
  const { settings } = useGameSettings();
  const audio = useMemo(() => new Audio(soundUrl), [soundUrl]);

  const play = useCallback(() => {
    if (settings.soundEnabled) {
      audio.currentTime = 0;
      audio.play().catch(error => console.log('Audio playback error:', error));
    }
  }, [audio, settings.soundEnabled]);

  useEffect(() => {
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [audio]);

  return play;
} 