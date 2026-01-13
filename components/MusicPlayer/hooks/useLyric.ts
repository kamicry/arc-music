import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Track, LyricLine } from '../types';
import { parseLyricLines } from '../utils/music';

export function useLyric(currentSong: Track | undefined) {
  const [showTranslation, setShowTranslation] = useState(false);
  const [lyricsExpanded, setLyricsExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  const lyricDesktopRef = useRef<HTMLDivElement | null>(null);
  const lyricMobileRef = useRef<HTMLDivElement | null>(null);

  // Parse lyrics
  const originalLyricLines = useMemo(() => 
    parseLyricLines(currentSong ? currentSong.lyric : undefined), 
    [currentSong ? currentSong.lyric : undefined]
  );
  
  const translationLyricLines = useMemo(() => 
    parseLyricLines(currentSong ? currentSong.tLyric : undefined), 
    [currentSong ? currentSong.tLyric : undefined]
  );

  // Determine which lyrics to display
  const displayLyricLines = useMemo<LyricLine[]>(() => {
    const hasTranslation = translationLyricLines.length > 0;
    const hasOriginal = originalLyricLines.length > 0;
    
    if (showTranslation && hasTranslation) {
      return translationLyricLines;
    }
    if (hasOriginal) {
      return originalLyricLines;
    }
    if (hasTranslation) {
      return translationLyricLines;
    }
    return [] as LyricLine[];
  }, [originalLyricLines, showTranslation, translationLyricLines]);

  const hasTranslationLyric = translationLyricLines.length > 0;
  const hasOriginalLyric = originalLyricLines.length > 0;
  const hasAnyLyric = displayLyricLines.length > 0 || hasTranslationLyric || hasOriginalLyric;

  // Calculate active lyric index
  const activeLyricIndex = useMemo(() => {
    if (displayLyricLines.length === 0) return -1;
    
    let index = -1;
    for (let i = 0; i < displayLyricLines.length; i += 1) {
      const entry = displayLyricLines[i];
      if (!Number.isFinite(entry.time)) continue;
      if (entry.time <= currentTime + 0.25) {
        index = i;
      } else if (entry.time > currentTime + 0.25) {
        break;
      }
    }
    
    if (index === -1 && displayLyricLines.length > 0) {
      const firstFinite = displayLyricLines.findIndex((entry) => Number.isFinite(entry.time));
      if (firstFinite === -1) {
        return 0;
      }
      return firstFinite;
    }
    return index;
  }, [currentTime, displayLyricLines]);

  // Generate unique key for active lyric
  const activeLyricKey = useMemo(() => {
    if (activeLyricIndex < 0 || activeLyricIndex >= displayLyricLines.length) return null;
    const entry = displayLyricLines[activeLyricIndex];
    const timeKey = Number.isFinite(entry.time) ? entry.time.toFixed(3) : `idx-${activeLyricIndex}`;
    const songId = currentSong ? currentSong.id : 'unknown';
    return `${songId}-${showTranslation ? 'trans' : 'orig'}-${timeKey}`;
  }, [activeLyricIndex, currentSong ? currentSong.id : null, displayLyricLines, showTranslation]);

  // Get preview lyrics (current line and neighbors)
  const previewLyricLines = useMemo(() => {
    if (displayLyricLines.length === 0) return [] as { index: number; line: LyricLine }[];
    const baseIndex = activeLyricIndex >= 0 && activeLyricIndex < displayLyricLines.length ? activeLyricIndex : 0;
    const indices = new Set<number>();
    
    if (displayLyricLines[baseIndex]) indices.add(baseIndex);
    if (baseIndex > 0) indices.add(baseIndex - 1);
    if (baseIndex + 1 < displayLyricLines.length) indices.add(baseIndex + 1);
    
    if (indices.size === 0) {
      indices.add(0);
    }
    
    return Array.from(indices)
      .sort((a, b) => a - b)
      .map((index) => ({ index, line: displayLyricLines[index] }));
  }, [activeLyricIndex, displayLyricLines]);

  // Scroll to active lyric
  const scrollToActiveLyric = useCallback(() => {
    if (!activeLyricKey) return;
    if (!lyricsExpanded) return;
    
    const containers: (HTMLDivElement | null)[] = [];
    containers.push(lyricDesktopRef.current);
    // Mobile container would be added here if needed
    
    containers.forEach((container) => {
      if (!container) return;
      const target = container.querySelector<HTMLElement>(`[data-lyric-key="${activeLyricKey}"]`);
      if (!target) return;
      
      const offset = target.offsetTop - container.clientHeight / 2 + target.clientHeight / 2;
      if (typeof container.scrollTo === 'function') {
        container.scrollTo({ top: Math.max(offset, 0), behavior: 'smooth' });
      } else {
        container.scrollTop = Math.max(offset, 0);
      }
    });
  }, [activeLyricKey, lyricsExpanded]);

  // Reset states when song changes
  useEffect(() => {
    setShowTranslation(false);
    setLyricsExpanded(false);
  }, [currentSong ? currentSong.id : null]);

  // Update current time (this would be called from the player)
  const updateCurrentTime = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  return {
    // State
    showTranslation,
    lyricsExpanded,
    currentTime,
    originalLyricLines,
    translationLyricLines,
    displayLyricLines,
    hasTranslationLyric,
    hasOriginalLyric,
    hasAnyLyric,
    activeLyricIndex,
    activeLyricKey,
    previewLyricLines,
    
    // Refs
    lyricDesktopRef,
    lyricMobileRef,
    
    // Actions
    setShowTranslation,
    setLyricsExpanded,
    updateCurrentTime,
    scrollToActiveLyric,
  };
}