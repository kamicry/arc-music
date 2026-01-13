import { useState, useCallback } from 'react';
import { Track, LocalTrack, MusicSource } from '../types';

const DEFAULT_SOURCE: MusicSource = 'netease';

export function useMusicList() {
  const [musicList, setMusicList] = useState<Track[]>([]);
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [selectedSource, setSelectedSource] = useState<MusicSource>(DEFAULT_SOURCE);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  // Update track in all relevant states
  const updateTrackInStates = useCallback((updated: Track) => {
    setMusicList((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    setAllTracks((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  }, []);

  // Add new tracks to the list
  const addTracks = useCallback((tracks: Track[]) => {
    setAllTracks((prev) => {
      const existingIds = new Set(prev.map(track => track.id));
      const newTracks = tracks.filter(track => !existingIds.has(track.id));
      return [...prev, ...newTracks];
    });
  }, []);

  // Remove tracks from the list
  const removeTracks = useCallback((trackIds: string[]) => {
    setMusicList((prev) => prev.filter(track => !trackIds.includes(track.id)));
    setAllTracks((prev) => prev.filter(track => !trackIds.includes(track.id)));
  }, []);

  // Filter tracks by source
  const filterBySource = useCallback((source: MusicSource) => {
    setSelectedSource(source);
    const filtered = allTracks.filter(track => track.source === source);
    setMusicList(filtered);
  }, [allTracks]);

  // Set the current list
  const setCurrentList = useCallback((tracks: Track[]) => {
    setMusicList(tracks);
  }, []);

  // Get tracks for a specific source
  const getTracksBySource = useCallback((source: MusicSource) => {
    return allTracks.filter(track => track.source === source);
  }, [allTracks]);

  // Create tracks from local tracks
  const createTracks = useCallback((localTracks: LocalTrack[]): Track[] => {
    return localTracks.map(createTrack);
  }, []);

  // Update cover URL
  const updateCoverUrl = useCallback((url: string | null) => {
    setCoverUrl(url);
  }, []);

  return {
    // State
    musicList,
    allTracks,
    selectedSource,
    coverUrl,
    
    // Actions
    updateTrackInStates,
    addTracks,
    removeTracks,
    filterBySource,
    setCurrentList,
    getTracksBySource,
    createTracks,
    updateCoverUrl,
    setSelectedSource,
  };
}

// Helper function to create a track
function createTrack(track: LocalTrack): Track {
  return {
    ...track,
    url: undefined,
    cover: track.picId ? undefined : null,
    lyric: null,
    tLyric: null,
    fileSizeKb: null,
  };
}