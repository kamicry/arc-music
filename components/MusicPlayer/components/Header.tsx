import React from 'react';
import { AVAILABLE_SOURCES } from '../types';
import { MusicSource } from '../types/index';

interface HeaderProps {
  selectedSource: MusicSource;
  onSourceChange: (source: MusicSource) => void;
}

export function Header({ selectedSource, onSourceChange }: HeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/60 backdrop-blur border-b border-slate-200/70">
      {/* Logo */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">♫</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900">MKOnlinePlayer</h1>
      </div>

      {/* Source Selector */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-slate-600">音源:</span>
        <div className="flex items-center space-x-1 bg-white/70 rounded-lg p-1">
          {AVAILABLE_SOURCES.map((source) => (
            <button
              key={source.value}
              onClick={() => onSourceChange(source.value)}
              className={`
                px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200
                ${selectedSource === source.value
                  ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }
              `}
            >
              {source.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}