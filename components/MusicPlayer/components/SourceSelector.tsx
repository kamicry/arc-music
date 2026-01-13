import React from 'react';
import { AVAILABLE_SOURCES, MusicSource } from '../types/index';

interface SourceSelectorProps {
  selectedSource: MusicSource;
  onSourceChange: (source: MusicSource) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'button' | 'dropdown';
}

export function SourceSelector({ 
  selectedSource, 
  onSourceChange, 
  size = 'md',
  variant = 'button' 
}: SourceSelectorProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  if (variant === 'dropdown') {
    return (
      <select
        value={selectedSource}
        onChange={(e) => onSourceChange(e.target.value as MusicSource)}
        className={`
          ${sizeClasses[size]} 
          bg-white/70 border border-slate-300 rounded-lg
          text-slate-700 font-medium
          focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent
          cursor-pointer
        `}
      >
        {AVAILABLE_SOURCES.map((source) => (
          <option key={source.value} value={source.value}>
            {source.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="flex items-center space-x-1 bg-white/70 rounded-lg p-1">
      {AVAILABLE_SOURCES.map((source) => (
        <button
          key={source.value}
          onClick={() => onSourceChange(source.value)}
          className={`
            ${sizeClasses[size]} font-medium rounded-md transition-all duration-200
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
  );
}