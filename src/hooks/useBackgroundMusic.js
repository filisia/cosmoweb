import { useCallback, useMemo, useRef, useEffect } from 'react';

// Available background tracks
export const BACKGROUND_TRACKS = [
  { id: 'none', name: 'No Background Music', file: null },
  { id: 'brassbeat', name: 'Brass Beat', file: '/audios/brassbeat.mp3' },
  { id: 'hiphop', name: 'Hip Hop', file: '/audios/hiphop.mp3' },
  { id: 'urbancosmo', name: 'Urban Cosmo', file: '/audios/urbancosmo.mp3' },
  { id: 'peacelovesoul', name: 'Peace Love Soul', file: '/audios/peacelovesoul.mp3' },
  { id: 'funkycosmo', name: 'Funky Cosmo', file: '/audios/funkycosmo.mp3' },
  { id: 'acousticcosmo', name: 'Acoustic Cosmo', file: '/audios/acousticcosmo.mp3' },
];

export default function useBackgroundMusic(selectedTrackId = 'none', isPlaying = false) {
  const audioRef = useRef(null);
  const isInitializedRef = useRef(false);

  // Get the selected track
  const selectedTrack = useMemo(() => {
    return BACKGROUND_TRACKS.find(track => track.id === selectedTrackId) || BACKGROUND_TRACKS[0];
  }, [selectedTrackId]);

  // Initialize audio element
  useEffect(() => {
    if (selectedTrack.file && !audioRef.current) {
      audioRef.current = new Audio(selectedTrack.file);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3; // Set volume to 30% to not overpower game sounds
      isInitializedRef.current = true;
    } else if (!selectedTrack.file && audioRef.current) {
      // Clean up if switching to 'none'
      audioRef.current.pause();
      audioRef.current = null;
      isInitializedRef.current = false;
    }
  }, [selectedTrack]);

  // Play/pause based on isPlaying prop
  useEffect(() => {
    if (!audioRef.current || !selectedTrack.file) return;

    if (isPlaying) {
      audioRef.current.play().catch(error => {
        console.error('[BackgroundMusic] Error playing track:', error);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, selectedTrack.file]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const play = useCallback(() => {
    if (audioRef.current && selectedTrack.file) {
      audioRef.current.play().catch(error => {
        console.error('[BackgroundMusic] Error playing track:', error);
      });
    }
  }, [selectedTrack.file]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const setVolume = useCallback((volume) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume));
    }
  }, []);

  return {
    play,
    pause,
    setVolume,
    selectedTrack,
    isInitialized: isInitializedRef.current,
  };
} 