import React from 'react';
import { BITRATE_OPTIONS, BitrateOption } from '../types/index';

interface BitrateSelectorProps {
  selectedBitrate: BitrateOption;
  onBitrateChange: (bitrate: BitrateOption) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'button' | 'dropdown';
  showFileSize?: boolean;
  fileSizeKb?: number | null;
}

export function BitrateSelector({ 
  selectedBitrate, 
  onBitrateChange, 
  size = 'md',
  variant = 'dropdown',
  showFileSize = false,
  fileSizeKb
}: BitrateSelectorProps) {
  const formatFileSize = (kb: number | null | undefined): string => {
    if (!kb) return '';
    const mb = (kb / 1024).toFixed(1);
    return `${mb}MB`;
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  if (variant === 'dropdown') {
    return (
      <select
        value={selectedBitrate}
        onChange={(e) => onBitrateChange(Number(e.target.value) as BitrateOption)}
        className={`
          ${sizeClasses[size]} 
          bg-white/70 border border-slate-300 rounded-lg
          text-slate-700 font-medium
          focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent
          cursor-pointer
        `}
      >
        {BITRATE_OPTIONS.map((bitrate) => (
          <option key={bitrate} value={bitrate}>
            {showFileSize && fileSizeKb ? 
              `${bitrate}kbps - ${formatFileSize(fileSizeKb)}` : 
              `${bitrate}kbps`
            }
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="flex items-center space-x-1 bg-white/70 rounded-lg p-1">
      {BITRATE_OPTIONS.map((bitrate) => (
        <button
          key={bitrate}
          onClick={() => onBitrateChange(bitrate)}
          className={`
            ${sizeClasses[size]} font-medium rounded-md transition-all duration-200
            ${selectedBitrate === bitrate
              ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }
          `}
          title={showFileSize && fileSizeKb ? `${bitrate}kbps - ${formatFileSize(fileSizeKb)}` : `${bitrate}kbps`}
        >
          {bitrate}k
        </button>
      ))}
    </div>
  );
}