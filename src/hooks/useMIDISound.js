import { useCallback, useMemo } from 'react';

// MIDI notes corresponding to the Swift example: [72, 76, 79, 83, 84, 88]
// These are C5, E5, G5, B5, C6, E6
const MIDI_NOTES = [72, 76, 79, 83, 84, 88];

export default function useMIDISound(soundEnabled = true) {
  // Create audio context and oscillator
  const audioContext = useMemo(() => {
    if (typeof window !== 'undefined' && window.AudioContext) {
      return new (window.AudioContext || window.webkitAudioContext)();
    }
    return null;
  }, []);

  const playNote = useCallback((noteIndex = 0, velocity = 100, duration = 0.3) => {
    if (!soundEnabled || !audioContext) return;

    try {
      // Get the MIDI note number
      const midiNote = MIDI_NOTES[noteIndex % MIDI_NOTES.length];
      
      // Convert MIDI note to frequency
      const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);
      
      // Create oscillator
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Set oscillator properties
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      
      // Set gain (volume) based on velocity
      const gain = (velocity / 100) * 0.3; // Scale down to prevent clipping
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(gain, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
      
      // Start and stop oscillator
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
      
      console.log(`[MIDI] Playing note ${midiNote} (${frequency.toFixed(1)}Hz) with velocity ${velocity}`);
    } catch (error) {
      console.error('[MIDI] Error playing note:', error);
    }
  }, [soundEnabled, audioContext]);

  return playNote;
} 