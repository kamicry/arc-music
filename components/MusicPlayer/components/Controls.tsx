import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Shuffle, Repeat1, ChevronUp, ChevronDown } from 'lucide-react';
import { BitrateOption, MusicSource, PlaybackMode } from '../types/index';
import { BitrateSelector } from './BitrateSelector';

interface ControlsProps {
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  currentTime: number;
  playbackMode: PlaybackMode;
  bitrate: BitrateOption;
  source: MusicSource;
  onTogglePlayPause: () => void;
  onPlayPrevious: () => void;
  onPlayNext: () => void;
  onVolumeChange: (volume: number) => void;
  onProgressClick: (percentage: number) => void;
  onPlaybackModeChange: () => void;
  onBitrateChange: (bitrate: BitrateOption) => void;
  onSourceChange: (source: MusicSource) => void;
}

export function Controls({
  isPlaying,
  volume,
  progress,
  duration,
  currentTime,
  playbackMode,
  bitrate,
  source,
  onTogglePlayPause,
  onPlayPrevious,
  onPlayNext,
  onVolumeChange,
  onProgressClick,
  onPlaybackModeChange,
  onBitrateChange,
  onSourceChange,
}: ControlsProps) {
  const formatTime = (seconds: number): string => {
    if (!Number.isFinite(seconds)) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percentage = ((e.clientX - rect.left) / rect.width) * 100;
    onProgressClick(Math.max(0, Math.min(100, percentage)));
  };

  return (
    <div className="bg-white/80 backdrop-blur border-t border-slate-200/70 p-4">
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-2 bg-slate-300 rounded-full cursor-pointer group overflow-hidden" onClick={handleProgressClick}>
          <div 
            className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full transition-all duration-300 relative" 
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-lg" />
          </div>
        </div>
        <div className="flex justify-between text-sm text-slate-600 mt-2">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {/* Left Controls */}
        <div className="flex items-center space-x-4">
          {/* Bitrate & Source Selectors */}
          <div className="flex items-center space-x-2">
            <BitrateSelector
              selectedBitrate={bitrate}
              onBitrateChange={onBitrateChange}
              size="sm"
              variant="button"
            />
            <BitrateSelector
              selectedBitrate={bitrate}
              onBitrateChange={onBitrateChange}
              size="sm"
              showFileSize={true}
              fileSizeKb={null}
            />
          </div>
        </div>

        {/* Center Controls */}
        <div className="flex items-center space-x-6">
          <button
            onClick={() => {
              // Random play logic would go here
              console.log('Shuffle clicked');
            }}
            className="p-2 text-slate-600 hover:text-slate-900 transition-all duration-300 transform hover:scale-110"
          >
            <Shuffle size={20} />
          </button>

          <button onClick={onPlayPrevious} className="p-3 text-slate-600 hover:text-slate-900 transition-all duration-300 transform hover:scale-110">
            <SkipBack size={24} />
          </button>

          <button onClick={onTogglePlayPause} className="p-4 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full hover:shadow-2xl transition-all duration-300 transform hover:scale-110 shadow-lg text-white">
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>

          <button onClick={onPlayNext} className="p-3 text-slate-600 hover:text-slate-900 transition-all duration-300 transform hover:scale-110">
            <SkipForward size={24} />
          </button>

          <button
            onClick={onPlaybackModeChange}
            className={`p-2 transition-all duration-300 transform hover:scale-110 ${
              playbackMode === 'order' 
                ? 'text-slate-600 hover:text-slate-900' 
                : 'text-sky-600 ring-1 ring-sky-400 rounded-full'
            }`}
          >
            {playbackMode === 'single' ? <Repeat1 size={20} /> : playbackMode === 'shuffle' ? <Shuffle size={20} /> : <Repeat size={20} />}
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-4">
          <Volume2 size={20} className="text-slate-600" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-32 h-1 bg-slate-300 rounded-full appearance-none cursor-pointer slider hover:bg-slate-400 transition-colors"
          />
        </div>
      </div>
    </div>
  );
}