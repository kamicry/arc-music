import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { SearchApiItem, MusicSource } from '../types/index';
import { SourceSelector } from './SourceSelector';

interface SearchPanelProps {
  searchTerm: string;
  searchResults: SearchApiItem[];
  isSearching: boolean;
  showingSearchResults: boolean;
  errorMessage: string | null;
  selectedSource: MusicSource;
  onSearch: (keyword: string, source: MusicSource) => void;
  onClearSearch: () => void;
  onSourceChange: (source: MusicSource) => void;
  onResultSelect: (result: SearchApiItem) => void;
}

export function SearchPanel({
  searchTerm,
  searchResults,
  isSearching,
  showingSearchResults,
  errorMessage,
  selectedSource,
  onSearch,
  onClearSearch,
  onSourceChange,
  onResultSelect,
}: SearchPanelProps) {
  const [inputValue, setInputValue] = useState(searchTerm);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSearch(inputValue.trim(), selectedSource);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <div className="flex flex-col h-full bg-white/60">
      {/* Search Header */}
      <div className="p-4 border-b border-slate-200/70">
        <form onSubmit={handleSubmit} className="flex items-center space-x-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="搜索歌曲、歌手或专辑..."
              className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white/70"
            />
            {inputValue && (
              <button
                type="button"
                onClick={() => {
                  setInputValue('');
                  onClearSearch();
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <SourceSelector 
            selectedSource={selectedSource}
            onSourceChange={onSourceChange}
            size="sm"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isSearching}
            className="px-4 py-2.5 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? (
              <div className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
            ) : (
              '搜索'
            )}
          </button>
        </form>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {errorMessage && (
          <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errorMessage}</p>
          </div>
        )}

        {showingSearchResults && !errorMessage && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">
                搜索结果 ({searchResults.length})
              </h3>
              <button
                onClick={onClearSearch}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                清除结果
              </button>
            </div>

            {isSearching ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-6 h-6 border-2 border-slate-300 border-t-sky-500 rounded-full animate-spin" />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Search size={48} className="mx-auto mb-4 text-slate-300" />
                <p>未找到相关歌曲</p>
                <p className="text-sm">试试修改搜索关键词</p>
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((result, index) => (
                  <div
                    key={`${result.id}-${index}`}
                    onClick={() => onResultSelect(result)}
                    className="flex items-center p-3 rounded-lg cursor-pointer hover:bg-white/70 transition-colors border border-transparent hover:border-sky-200"
                  >
                    {/* Track Number */}
                    <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-500 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-xs font-bold text-white">{index + 1}</span>
                    </div>

                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {result.name || '未知歌曲'}
                      </p>
                      <p className="text-sm text-slate-500 truncate">
                        {Array.isArray(result.artist) ? result.artist.join(', ') : result.artist || '未知艺术家'}
                      </p>
                      {result.album && (
                        <p className="text-xs text-slate-400 truncate">
                          {result.album}
                        </p>
                      )}
                    </div>

                    {/* Source Badge */}
                    <div className="flex-shrink-0 ml-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-800">
                        {selectedSource}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!showingSearchResults && !errorMessage && (
          <div className="flex items-center justify-center h-full text-slate-500">
            <div className="text-center">
              <Search size={48} className="mx-auto mb-4 text-slate-300" />
              <p>输入关键词搜索音乐</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}