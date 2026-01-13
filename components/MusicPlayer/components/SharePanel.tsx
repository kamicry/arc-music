import React, { useState } from 'react';
import { Share2, Copy, Check, X } from 'lucide-react';
import { Track, BitrateOption, MusicSource } from '../types/index';
import { createShareUrl, copyToClipboard } from '../utils/music';

interface SharePanelProps {
  track: Track;
  bitrate: BitrateOption;
  source: MusicSource;
  isOpen: boolean;
  onClose: () => void;
}

export function SharePanel({ track, bitrate, source, isOpen, onClose }: SharePanelProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = createShareUrl(track, bitrate, source);

  const handleCopyUrl = async () => {
    try {
      await copyToClipboard(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handleCopyEmbed = () => {
    const embedCode = `<iframe src="${shareUrl}" width="400" height="300" frameborder="0"></iframe>`;
    copyToClipboard(embedCode)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((error) => {
        console.error('Failed to copy embed code:', error);
      });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Share2 size={20} className="text-sky-600" />
            <h3 className="text-lg font-semibold text-slate-900">分享歌曲</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Track Info */}
        <div className="mb-4 p-3 bg-slate-50 rounded-lg">
          <p className="font-semibold text-slate-900">{track.name}</p>
          <p className="text-sm text-slate-600">{track.artist || '未知艺术家'}</p>
          <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
            <span>音源: {source}</span>
            <span>码率: {bitrate}kbps</span>
          </div>
        </div>

        {/* Share URL */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">分享链接</label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-sm text-slate-600"
            />
            <button
              onClick={handleCopyUrl}
              className="px-3 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors flex items-center space-x-1"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span className="text-sm">{copied ? '已复制' : '复制'}</span>
            </button>
          </div>
        </div>

        {/* Embed Code */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">嵌入代码</label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={`<iframe src="${shareUrl}" width="400" height="300" frameborder="0"></iframe>`}
              readOnly
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-sm text-slate-600"
            />
            <button
              onClick={handleCopyEmbed}
              className="px-3 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center space-x-1"
            >
              <Copy size={16} />
              <span className="text-sm">复制</span>
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}