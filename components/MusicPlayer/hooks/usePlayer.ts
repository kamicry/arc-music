import { useState, useRef, useCallback, useEffect } from 'react';
import { Howl } from 'howler';
import { Track, PlaybackMode } from '../types';

const DEFAULT_VOLUME = 0.7;

export function usePlayer() {
  // Player state
  const [currentSongIndex, setCurrentSongIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>('order');
  const [loadingTrackIndex, setLoadingTrackIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Refs
  const soundRef = useRef<Howl | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const playRequestIdRef = useRef(0);

  // Helper function to format time
  const formatTime = useCallback((seconds: number): string => {
    if (!Number.isFinite(seconds)) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Stop current sound
  const stopCurrentSound = useCallback(() => {
    if (soundRef.current) {
      soundRef.current.unload();
      soundRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // Play sound
  const playSound = useCallback((url: string, autoplay: boolean = true) => {
    stopCurrentSound();

    const sound = new Howl({
      src: [url],
      html5: false,
      preload: true,
      volume: volume,
      onload: () => {
        const soundDuration = sound.duration();
        setDuration(soundDuration);
        if (autoplay) {
          sound.play();
          setIsPlaying(true);
        }
      },
      onplay: () => {
        setIsPlaying(true);
        // Start progress tracking
        progressIntervalRef.current = setInterval(() => {
          const seek = sound.seek() as number;
          const duration = sound.duration();
          const progress = duration > 0 ? (seek / duration) * 100 : 0;
          setCurrentTime(seek);
          setProgress(progress);
        }, 1000);
      },
      onpause: () => {
        setIsPlaying(false);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      },
      onend: () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      },
      onplayerror: () => {
        setErrorMessage('播放失败，请重试');
        setIsPlaying(false);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      },
    });

    soundRef.current = sound;
  }, [volume, stopCurrentSound]);

  // Play/Pause toggle
  const togglePlayPause = useCallback(() => {
    if (!soundRef.current) return;

    if (isPlaying) {
      soundRef.current.pause();
    } else {
      soundRef.current.play();
    }
  }, [isPlaying]);

  // Set playing state directly
  const setIsPlayingState = useCallback((playing: boolean) => {
    setIsPlaying(playing);
  }, []);

  // Seek to position
  const seekTo = useCallback((percentage: number) => {
    if (!soundRef.current || duration === 0) return;

    const seekTime = (percentage / 100) * duration;
    soundRef.current.seek(seekTime);
    setCurrentTime(seekTime);
    setProgress(percentage);
  }, [duration]);

  // Set volume
  const setVolumeLevel = useCallback((newVolume: number) => {
    setVolume(newVolume);
    if (soundRef.current) {
      soundRef.current.volume(newVolume);
    }
  }, []);

  // Update volume when it changes
  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.volume(volume);
    }
  }, [volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCurrentSound();
    };
  }, [stopCurrentSound]);

  return {
    // State
    currentSongIndex,
    setCurrentSongIndex,
    isPlaying,
    progress,
    volume,
    duration,
    currentTime,
    playbackMode,
    loadingTrackIndex,
    errorMessage,
    setErrorMessage,
    
    // Actions
    playSound,
    togglePlayPause,
    seekTo,
    setVolumeLevel,
    setLoadingTrackIndex,
    setPlaybackMode,
    setIsPlaying: setIsPlayingState,
    
    // Utils
    formatTime,
    stopCurrentSound,
  };
}