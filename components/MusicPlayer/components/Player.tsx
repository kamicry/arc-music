import React from 'react';
import { Heart, Share2, MoreVertical } from 'lucide-react';
import { Track } from '../types/index';
import { BitrateSelector } from './BitrateSelector';
import { SharePanel } from './SharePanel';
import { BitrateOption, MusicSource } from '../types/index';

interface PlayerProps {
  currentSong: Track | undefined;
  bitrate: BitrateOption;
  source: MusicSource;
  showTranslation: boolean;
  hasTranslationLyric: boolean;
  activeLyricIndex: number;
  displayLyricLines: Array<{ time: number; text: string }>;
  lyricsExpanded: boolean;
  onBitrateChange: (bitrate: BitrateOption) => void;
  onShowTranslation: (show: boolean) => void;
  onToggleLyricsExpanded: () => void;
  onShare: () => void;
}

export function Player({
  currentSong,
  bitrate,
  source,
  showTranslation,
  hasTranslationLyric,
  activeLyricIndex,
  displayLyricLines,
  lyricsExpanded,
  onBitrateChange,
  onShowTranslation,
  onToggleLyricsExpanded,
  onShare,
}: PlayerProps) {
  const [showSharePanel, setShowSharePanel] = React.useState(false);

  const handleShare = () => {
    setShowSharePanel(true);
  };

  const coverNode = currentSong?.cover ? (
    <img
      src={currentSong.cover}
      alt={currentSong.name}
      className="w-full h-full object-cover rounded-lg"
    />
  ) : (
    <div className="w-full h-full bg-gradient-to-br from-sky-400 to-blue-500 rounded-lg flex items-center justify-center">
      <span className="text-white font-bold text-lg">♫</span>
    </div>
  );

  return (
    <>
      <div className="flex-1 flex flex-col bg-white/60">
        {/* Player Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200/70">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-lg overflow-hidden mr-4">
              {coverNode}
            </div>
            <div>
              <p className="font-bold text-lg text-slate-900">
                {currentSong?.name ?? '未选择'}
              </p>
              <p className="text-slate-600">{currentSong?.artist ?? ''}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Bitrate Selector */}
            <BitrateSelector
              selectedBitrate={bitrate}
              onBitrateChange={onBitrateChange}
              size="sm"
              showFileSize={true}
              fileSizeKb={currentSong?.fileSizeKb}
            />
            
            <button className="p-2 text-slate-600 hover:text-slate-800 transition-colors">
              <Heart size={20} />
            </button>
            
            <button
              onClick={handleShare}
              className="p-2 text-slate-600 hover:text-slate-800 transition-colors disabled:opacity-50"
              disabled={!currentSong}
            >
              <Share2 size={20} />
            </button>
            
            <button className="p-2 text-slate-600 hover:text-slate-800 transition-colors disabled:opacity-40">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Player Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
          <div className="flex flex-col items-center w-full max-w-4xl min-h-full justify-center">
            {/* Album Art and Song Info (when lyrics not expanded) */}
            {!lyricsExpanded && (
              <div className="flex items-center justify-center w-full mt-2 md:mt-0 mb-4 md:mb-6">
                <div className="flex items-center space-x-4 md:space-x-6">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl overflow-hidden shadow-lg">
                    {coverNode}
                  </div>

                  <div className="text-left max-w-xs">
                    <h2 className="text-2xl font-bold mb-2 text-slate-900">
                      {currentSong?.name ?? '未选择'}
                    </h2>
                    <p className="text-lg text-slate-700 mb-1">
                      {currentSong?.artist ?? ''}
                    </p>
                    {currentSong?.album && (
                      <p className="text-sm text-slate-500">{currentSong.album}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Lyrics Display */}
            {hasTranslationLyric && (
              <div className={`w-full max-w-2xl ${lyricsExpanded ? 'flex-1 flex flex-col mt-2 md:mt-4 mb-4 md:mb-6' : 'mb-4 md:mb-6'} min-h-0`}>
                <div className={`flex items-center justify-between ${lyricsExpanded ? 'mb-3' : 'mb-2'}`}>
                  <span className="text-sm font-semibold text-slate-600">歌词</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onShowTranslation(!showTranslation)}
                      className="text-xs px-2 py-1 rounded-md border border-sky-400 text-sky-600 hover:bg-sky-50 transition-colors"
                    >
                      {showTranslation ? '查看原文' : '查看翻译'}
                    </button>
                    <button
                      onClick={onToggleLyricsExpanded}
                      className="text-xs px-2 py-1 rounded-md border border-slate-300 text-slate-600 hover:bg-white/70 transition-colors"
                    >
                      {lyricsExpanded ? '收起歌词' : '展开歌词'}
                    </button>
                  </div>
                </div>

                {lyricsExpanded ? (
                  <div className="flex-1 min-h-[8rem] overflow-y-auto max-h-[calc(100vh-22rem)] md:max-h-[calc(100vh-20rem)] custom-scrollbar bg-white/70 border border-slate-200 rounded-xl p-4">
                    {displayLyricLines.length > 0 ? (
                      displayLyricLines.map((line, idx) => {
                        const isActive = idx === activeLyricIndex;
                        const key = `lyric-desktop-${showTranslation ? 'trans' : 'orig'}-${idx}`;
                        return (
                          <p
                            key={key}
                            data-lyric-key={`${currentSong ? currentSong.id : 'unknown'}-${showTranslation ? 'trans' : 'orig'}-${Number.isFinite(line.time) ? line.time.toFixed(3) : `idx-${idx}`}`}
                            className={`leading-relaxed transition-colors ${isActive ? 'text-sky-600 font-bold text-lg' : 'text-slate-700 text-base'}`}
                          >
                            {line.text}
                          </p>
                        );
                      })
                    ) : (
                      <p className="text-sm text-slate-500">暂无歌词</p>
                    )}
                  </div>
                ) : (
                  <div className="bg-white/70 border border-slate-200 rounded-xl p-4">
                    {displayLyricLines.length > 0 ? (
                      displayLyricLines.slice(0, 3).map((line, idx) => {
                        const isActive = idx === activeLyricIndex;
                        const key = `lyric-preview-${showTranslation ? 'trans' : 'orig'}-${idx}`;
                        return (
                          <p
                            key={key}
                            className={`leading-relaxed text-center transition-all ${isActive ? 'text-sky-600 font-semibold text-lg' : 'text-slate-600 text-sm'}`}
                          >
                            {line.text}
                          </p>
                        );
                      })
                    ) : (
                      <p className="text-sm text-slate-500">暂无歌词</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Panel */}
      {currentSong && (
        <SharePanel
          track={currentSong}
          bitrate={bitrate}
          source={source}
          isOpen={showSharePanel}
          onClose={() => setShowSharePanel(false)}
        />
      )}
    </>
  );
}