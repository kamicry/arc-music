// components/MusicPlayer.tsx
'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Howl } from 'howler';
import { LOCAL_TRACKS } from '../data/localTracks';
import { checkBrowserCompatibility } from '../utils/polyfills';

// Import our modular components
import { Header } from './MusicPlayer/components/Header';
import { Player } from './MusicPlayer/components/Player';
import { Controls } from './MusicPlayer/components/Controls';
import { Playlist } from './MusicPlayer/components/Playlist';
import { SearchPanel } from './MusicPlayer/components/SearchPanel';

// Import our custom hooks
import { usePlayer } from './MusicPlayer/hooks/usePlayer';
import { useMusicList } from './MusicPlayer/hooks/useMusicList';
import { useLyric } from './MusicPlayer/hooks/useLyric';
import { useSearch } from './MusicPlayer/hooks/useSearch';

// Import utilities
import { resolveTrack, apiClient } from './MusicPlayer/utils/api';
import { formatTime } from './MusicPlayer/utils/music';

// Import types
import { Track, BitrateOption, MusicSource, SearchApiItem } from './MusicPlayer/types';

const DEFAULT_SOURCE: MusicSource = 'netease';
const DEFAULT_BITRATE: BitrateOption = 320;

type TabType = 'playing' | 'playlist' | 'search';

export default function MusicPlayer() {
  // Use our custom hooks
  const player = usePlayer();
  const musicListManager = useMusicList();
  const search = useSearch();
  const lyric = useLyric(undefined); // Will be updated when current song changes

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('playing');

  // Mobile state
  const [mobileExpanded, setMobileExpanded] = useState(false);

  // State
  const [selectedSource, setSelectedSource] = useState<MusicSource>(DEFAULT_SOURCE);
  const [selectedBitrate, setSelectedBitrate] = useState<BitrateOption>(DEFAULT_BITRATE);
  const [loadingTrackIndex, setLoadingTrackIndex] = useState<number | null>(null);

  // Initialize music list with local tracks
  useEffect(() => {
    const tracks = musicListManager.createTracks(LOCAL_TRACKS);
    musicListManager.setCurrentList(tracks);
    musicListManager.filterBySource(selectedSource);
  }, []);

  // Browser compatibility check
  useEffect(() => {
    const compat = checkBrowserCompatibility();
    if (!compat.isCompatible) {
      console.warn('Browser compatibility issues:', compat.issues);
    }
  }, []);

  // Update lyric current time from player
  useEffect(() => {
    lyric.updateCurrentTime(player.currentTime);
  }, [player.currentTime, lyric]);

  // Get current song from music list
  const currentSong = player.currentSongIndex >= 0 ? musicListManager.musicList[player.currentSongIndex] : undefined;

  // Update lyric hook with current song
  useEffect(() => {
    if (currentSong) {
      // Update lyric hook with current song
      lyric.updateCurrentTime(0);
    }
  }, [currentSong?.id]);

  // Handle source change
  const handleSourceChange = useCallback(async (source: MusicSource) => {
    setSelectedSource(source);
    musicListManager.filterBySource(source);
    
    // If currently playing a song, reload it with new source
    if (currentSong && player.currentSongIndex >= 0) {
      try {
        setLoadingTrackIndex(player.currentSongIndex);
        const resolvedTrack = await resolveTrack(
          musicListManager.musicList[player.currentSongIndex],
          selectedBitrate,
          apiClient
        );
        musicListManager.updateTrackInStates(resolvedTrack);
        
        // Update player with new track
        if (resolvedTrack.url) {
          player.playSound(resolvedTrack.url, false);
        }
      } catch (error) {
        console.error('Failed to resolve track with new source:', error);
        player.setErrorMessage('切换音源失败');
      } finally {
        setLoadingTrackIndex(null);
      }
    }
  }, [currentSong, player.currentSongIndex, selectedBitrate, musicListManager, player]);

  // Handle bitrate change
  const handleBitrateChange = useCallback(async (bitrate: BitrateOption) => {
    setSelectedBitrate(bitrate);
    
    if (currentSong && player.currentSongIndex >= 0) {
      try {
        setLoadingTrackIndex(player.currentSongIndex);
        const resolvedTrack = await resolveTrack(
          musicListManager.musicList[player.currentSongIndex],
          bitrate,
          apiClient
        );
        musicListManager.updateTrackInStates(resolvedTrack);
        
        // If currently playing, restart with new bitrate
        if (player.isPlaying && resolvedTrack.url) {
          player.playSound(resolvedTrack.url, true);
        }
      } catch (error) {
        console.error('Failed to resolve track with new bitrate:', error);
        player.setErrorMessage('切换码率失败');
      } finally {
        setLoadingTrackIndex(null);
      }
    }
  }, [currentSong, player.currentSongIndex, player.isPlaying, musicListManager, player]);

  // Handle play song
  const handlePlaySong = useCallback(async (index: number) => {
    if (index < 0 || index >= musicListManager.musicList.length) return;
    if (loadingTrackIndex !== null && loadingTrackIndex === index) return;

    try {
      player.setLoadingTrackIndex(index);
      player.setErrorMessage(null);
      player.setIsPlaying(false);

      const track = musicListManager.musicList[index];
      if (!track) return;

      const resolvedTrack = await resolveTrack(track, selectedBitrate, apiClient);
      musicListManager.updateTrackInStates(resolvedTrack);

      // Update player state
      player.setCurrentSongIndex(index);

      // Play the track
      if (resolvedTrack.url) {
        player.playSound(resolvedTrack.url, true);
      }
    } catch (error) {
      console.error('Failed to play song:', error);
      player.setErrorMessage(error instanceof Error ? error.message : '播放失败');
    } finally {
      player.setLoadingTrackIndex(null);
    }
  }, [loadingTrackIndex, musicListManager.musicList, selectedBitrate, player]);

  // Handle search result selection
  const handleSearchResultSelect = useCallback((result: SearchApiItem) => {
    // Convert search result to track format
    const newTrack: Track = {
      id: `${selectedSource}-${result.id}`,
      name: result.name || '未知歌曲',
      artist: Array.isArray(result.artist) ? result.artist.join(', ') : result.artist || '',
      album: result.album || '',
      source: selectedSource,
      trackId: String(result.id),
      picId: result.pic_id || undefined,
      lyricId: result.lyric_id || undefined,
      url: undefined,
      cover: null,
      lyric: null,
      tLyric: null,
      fileSizeKb: null,
    };

    // Add to music list
    musicListManager.addTracks([newTrack]);
    musicListManager.filterBySource(selectedSource);

    // Play the new track
    const newIndex = musicListManager.musicList.length - 1;
    void handlePlaySong(newIndex);

    // Switch to playing tab
    setActiveTab('playing');
  }, [selectedSource, musicListManager, handlePlaySong]);

  // Tabs configuration
  const tabs = [
    { id: 'playing' as TabType, label: '正在播放', count: musicListManager.musicList.length },
    { id: 'playlist' as TabType, label: '播放列表', count: musicListManager.musicList.length },
    { id: 'search' as TabType, label: '歌曲搜索', count: search.searchResults.length },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex flex-col">
      {/* Header */}
      <Header 
        selectedSource={selectedSource}
        onSourceChange={handleSourceChange}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Sidebar - Tabs and Content */}
        <div className="w-full md:w-80 lg:w-96 bg-white/60 border-r border-slate-200/70 flex flex-col">
          {/* Tab Navigation */}
          <div className="flex items-center p-4 border-b border-slate-200/70">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                  ${activeTab === tab.id
                    ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }
                `}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
                    activeTab === tab.id ? 'bg-white/20' : 'bg-slate-200'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 flex flex-col min-h-0">
            {activeTab === 'playing' && (
              <Playlist
                tracks={musicListManager.musicList}
                currentSongIndex={player.currentSongIndex}
                isPlaying={player.isPlaying}
                loadingTrackIndex={player.loadingTrackIndex}
                onTrackSelect={handlePlaySong}
              />
            )}

            {activeTab === 'playlist' && (
              <Playlist
                tracks={musicListManager.musicList}
                currentSongIndex={player.currentSongIndex}
                isPlaying={player.isPlaying}
                loadingTrackIndex={player.loadingTrackIndex}
                onTrackSelect={handlePlaySong}
              />
            )}

            {activeTab === 'search' && (
              <SearchPanel
                searchTerm={search.searchTerm}
                searchResults={search.searchResults}
                isSearching={search.isSearching}
                showingSearchResults={search.showingSearchResults}
                errorMessage={search.errorMessage}
                selectedSource={selectedSource}
                onSearch={search.search}
                onClearSearch={search.clearSearch}
                onSourceChange={setSelectedSource}
                onResultSelect={handleSearchResultSelect}
              />
            )}
          </div>
        </div>

        {/* Main Player Area */}
        <div className="flex-1 flex flex-col">
          <Player
            currentSong={currentSong}
            bitrate={selectedBitrate}
            source={selectedSource}
            showTranslation={lyric.showTranslation}
            hasTranslationLyric={lyric.hasTranslationLyric}
            activeLyricIndex={lyric.activeLyricIndex}
            displayLyricLines={lyric.displayLyricLines}
            lyricsExpanded={lyric.lyricsExpanded}
            onBitrateChange={handleBitrateChange}
            onShowTranslation={lyric.setShowTranslation}
            onToggleLyricsExpanded={() => lyric.setLyricsExpanded(!lyric.lyricsExpanded)}
            onShare={() => console.log('Share clicked')}
          />
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="border-t border-slate-200/70">
        <Controls
          isPlaying={player.isPlaying}
          volume={player.volume}
          progress={player.progress}
          duration={player.duration}
          currentTime={player.currentTime}
          playbackMode={player.playbackMode}
          bitrate={selectedBitrate}
          source={selectedSource}
          onTogglePlayPause={player.togglePlayPause}
          onPlayPrevious={() => {
            const prevIndex = player.currentSongIndex > 0 
              ? player.currentSongIndex - 1 
              : musicListManager.musicList.length - 1;
            handlePlaySong(prevIndex);
          }}
          onPlayNext={() => {
            const nextIndex = player.currentSongIndex < musicListManager.musicList.length - 1 
              ? player.currentSongIndex + 1 
              : 0;
            handlePlaySong(nextIndex);
          }}
          onVolumeChange={player.setVolumeLevel}
          onProgressClick={player.seekTo}
          onPlaybackModeChange={() => {
            const modes: Array<'order' | 'single' | 'shuffle'> = ['order', 'single', 'shuffle'];
            const currentIndex = modes.indexOf(player.playbackMode);
            const nextIndex = (currentIndex + 1) % modes.length;
            player.setPlaybackMode(modes[nextIndex]);
          }}
          onBitrateChange={handleBitrateChange}
          onSourceChange={handleSourceChange}
        />
      </div>

      {/* Error Message */}
      {player.errorMessage && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm">{player.errorMessage}</p>
          <button
            onClick={() => player.setErrorMessage(null)}
            className="ml-2 text-red-200 hover:text-white"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}