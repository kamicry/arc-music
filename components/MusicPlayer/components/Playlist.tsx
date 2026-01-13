import React from 'react';
import { Heart, MoreVertical, Play, Pause } from 'lucide-react';
import { Track } from '../types/index';

interface PlaylistProps {
  tracks: Track[];
  currentSongIndex: number;
  isPlaying: boolean;
  loadingTrackIndex: number | null;
  onTrackSelect: (index: number) => void;
  onShowTrackInfo?: (track: Track) => void;
}

export function Playlist({ 
  tracks, 
  currentSongIndex, 
  isPlaying, 
  loadingTrackIndex, 
  onTrackSelect,
  onShowTrackInfo 
}: PlaylistProps) {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="p-4 space-y-2">
        {tracks.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-slate-500">
            <p>暂无歌曲</p>
          </div>
        ) : (
          tracks.map((song, index) => (
            <div
              key={song.id}
              onClick={() => onTrackSelect(index)}
              className={`
                group flex items-center p-3 rounded-lg cursor-pointer transition-all duration-300
                ${index === currentSongIndex 
                  ? 'bg-gradient-to-r from-sky-400/20 to-blue-500/20 border border-sky-400/30' 
                  : 'hover:bg-white/70 hover:shadow-sm'
                }
              `}
            >
              {/* Track Number/Status */}
              <div className="relative w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center mr-4 transition-all duration-300">
                <div className="w-full h-full bg-gradient-to-br from-sky-400 to-blue-500 rounded-lg flex items-center justify-center overflow-hidden">
                  {loadingTrackIndex === index ? (
                    <div className="w-5 h-5 border-2 border-white/80 border-t-transparent rounded-full animate-spin"></div>
                  ) : index === currentSongIndex && isPlaying ? (
                    <div className="flex space-x-1">
                      <div className="w-1 h-3 bg-white animate-pulse"></div>
                      <div className="w-1 h-3 bg-white animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-1 h-3 bg-white animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-white">{index + 1}</span>
                  )}
                </div>
              </div>

              {/* Track Info */}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold truncate ${index === currentSongIndex ? 'text-slate-900' : 'text-slate-700'}`}>
                  {song.name}
                </p>
                <p className="text-sm text-slate-500 truncate">{song.artist ?? ''}</p>
              </div>

              {/* Track Actions */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={(e) => { e.stopPropagation(); onShowTrackInfo?.(song); }}
                  className="opacity-0 group-hover:opacity-100 hover:text-slate-600 transition-all duration-300"
                >
                  <MoreVertical size={16} />
                </button>
                <button className="opacity-0 group-hover:opacity-100 hover:text-sky-600 transition-all duration-300">
                  <Heart size={16} />
                </button>
                <span className="text-sm text-slate-500">{song.duration ?? ''}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}