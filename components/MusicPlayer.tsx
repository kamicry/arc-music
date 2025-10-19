// components/MusicPlayer.tsx
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Howl } from 'howler';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Heart,
  Share,
  Repeat,
  Shuffle,
} from 'lucide-react';

// 音乐数据
const musicList = [
  {
    id: 1,
    name: '光るなら',
    artist: 'Goose house',
    album: 'FLY HIGH!',
    duration: '4:15',
    url: '/music/song1.mp3',
    cover: '/covers/cover1.jpg',
  },
  {
    id: 2,
    name: 'Butter-Fly',
    artist: '和田光司',
    album: 'デジモンアドベンチャー',
    duration: '4:12',
    url: '/music/song2.mp3',
    cover: '/covers/cover2.jpg',
  },
  {
    id: 3,
    name: 'Blue Bird',
    artist: 'いきものがかり',
    album: 'My song Your song',
    duration: '3:35',
    url: '/music/song3.mp3',
    cover: '/covers/cover3.jpg',
  },
  {
    id: 4,
    name: 'シリウス',
    artist: '藍井エイル',
    album: 'AUBE',
    duration: '4:22',
    url: '/music/song4.mp3',
    cover: '/covers/cover4.jpg',
  },
  {
    id: 5,
    name: 'Crossing Field',
    artist: 'LiSA',
    album: 'LANDSPACE',
    duration: '4:08',
    url: '/music/song5.mp3',
    cover: '/covers/cover5.jpg',
  },
];

const MusicPlayer = () => {
  // 播放器状态
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const soundRef = useRef<Howl | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentSong = musicList[currentSongIndex];

  // 初始化音频
  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.unload();
    }

    soundRef.current = new Howl({
      src: [currentSong.url],
      html5: true,
      volume: volume,
      onplay: () => {
        setIsPlaying(true);
        startProgressTimer();
      },
      onpause: () => {
        setIsPlaying(false);
        stopProgressTimer();
      },
      onend: () => {
        playNext();
      },
      onload: () => {
        if (soundRef.current) {
          setDuration(soundRef.current.duration());
        }
      },
    });

    return () => {
      if (soundRef.current) {
        soundRef.current.unload();
      }
      stopProgressTimer();
    };
  }, [currentSong]);

  // 更新音量
  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.volume(volume);
    }
  }, [volume]);

  // 进度计时器
  const startProgressTimer = () => {
    stopProgressTimer();
    progressIntervalRef.current = setInterval(() => {
      if (soundRef.current && soundRef.current.playing()) {
        const seek = soundRef.current.seek() as number;
        setCurrentTime(seek);
        setProgress((seek / (duration || 1)) * 100);
      }
    }, 1000);
  };

  const stopProgressTimer = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  // 播放控制
  const togglePlayPause = () => {
    if (!soundRef.current) return;

    if (isPlaying) {
      soundRef.current.pause();
    } else {
      soundRef.current.play();
    }
  };

  const playNext = () => {
    if (soundRef.current) {
      soundRef.current.unload();
    }
    setCurrentSongIndex((prevIndex) => (prevIndex === musicList.length - 1 ? 0 : prevIndex + 1));
    setProgress(0);
    setCurrentTime(0);
  };

  const playPrevious = () => {
    if (soundRef.current) {
      soundRef.current.unload();
    }
    setCurrentSongIndex((prevIndex) => (prevIndex === 0 ? musicList.length - 1 : prevIndex - 1));
    setProgress(0);
    setCurrentTime(0);
  };

  // 选择播放列表中的歌曲
  const playSong = (index: number) => {
    if (soundRef.current) {
      soundRef.current.unload();
    }
    setCurrentSongIndex(index);
    setProgress(0);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  // 进度条点击跳转
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!soundRef.current) return;

    const progressBar = e.currentTarget;
    const clickPosition = (e.clientX - progressBar.getBoundingClientRect().left) / progressBar.offsetWidth;
    const newTime = clickPosition * duration;

    soundRef.current.seek(newTime);
    setCurrentTime(newTime);
    setProgress(clickPosition * 100);
  };

  // 格式化时间
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="h-screen flex bg-gradient-to-br from-sky-100 to-blue-100 text-slate-800">
      {/* 左侧：歌曲列表，占 2/3 */}
      <div className="w-2/3 overflow-hidden flex flex-col border-r border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
            我的音乐库
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          {musicList.map((song, index) => (
            <div
              key={song.id}
              className={`
                group flex items-center p-4 rounded-2xl mb-3 cursor-pointer 
                transition-all duration-300 transform hover:scale-[1.01]
                ${index === currentSongIndex 
                  ? 'bg-gradient-to-r from-sky-300/50 to-blue-300/50 shadow-md' 
                  : 'hover:bg-white/50'
                }
              `}
              onClick={() => playSong(index)}
            >
              <div
                className={`
                  relative w-12 h-12 rounded-lg flex items-center justify-center mr-4
                  transition-all duration-300
                  ${index === currentSongIndex ? 'shadow-md' : 'group-hover:shadow-sm'}
                `}
              >
                <div className="w-full h-full bg-gradient-to-br from-sky-400 to-blue-500 rounded-lg flex items-center justify-center">
                  {index === currentSongIndex && isPlaying ? (
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

              <div className="flex-1 min-w-0">
                <p className={`font-semibold truncate ${index === currentSongIndex ? 'text-slate-900' : 'text-slate-700'}`}>
                  {song.name}
                </p>
                <p className="text-sm text-slate-500 truncate">{song.artist}</p>
              </div>

              <div className="flex items-center space-x-3">
                <button className="opacity-0 group-hover:opacity-100 hover:text-sky-600 transition-all duration-300">
                  <Heart size={16} />
                </button>
                <span className="text-sm text-slate-500">{song.duration}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 右侧：播放器，占 1/3 */}
      <div className="w-1/3 h-full bg-white/60 backdrop-blur-lg flex flex-col">
        {/* 顶部控制栏 */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center">
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center mr-4">
              {isPlaying ? (
                <div className="flex space-x-1">
                  <div className="w-1 h-4 bg-white animate-pulse"></div>
                  <div className="w-1 h-4 bg-white animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1 h-4 bg-white animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              ) : (
                <span className="text-sm font-bold text-white">▶</span>
              )}
            </div>
            <div>
              <p className="font-bold text-lg text-slate-900">{currentSong.name}</p>
              <p className="text-slate-600">{currentSong.artist}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-slate-600">
            <button className="p-2 hover:text-slate-800 transition-colors">
              <Heart size={20} />
            </button>
            <button className="p-2 hover:text-slate-800 transition-colors">
              <Share size={20} />
            </button>
          </div>
        </div>

        {/* 播放器内容 */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="flex flex-col items-center w-full max-w-4xl">
            {/* 专辑封面和歌曲信息 */}
            <div className="flex items-center justify-center mb-8 w-full">
              <div className="flex items-center space-x-6">
                {/* 专辑封面 */}
                <div
                  className={`
                    w-40 h-40 rounded-2xl overflow-hidden shadow-xl
                    transition-transform duration-1000
                    ${isPlaying ? 'animate-spin-slow' : ''}
                  `}
                >
                  <div className="w-full h-full bg-gradient-to-br from-sky-400 via-blue-400 to-cyan-400 flex items-center justify-center">
                    <div className="text-white text-center">
                      <span className="text-lg font-semibold">专辑封面</span>
                    </div>
                  </div>
                </div>

                {/* 歌曲信息 */}
                <div className="text-left max-w-xs">
                  <h2 className="text-2xl font-bold mb-2 text-slate-900">{currentSong.name}</h2>
                  <p className="text-lg text-slate-700 mb-1">{currentSong.artist}</p>
                  <p className="text-slate-500">{currentSong.album}</p>
                </div>
              </div>
            </div>

            {/* 进度条 */}
            <div className="w-full max-w-2xl mb-6">
              <div className="h-2 bg-slate-300 rounded-full cursor-pointer group" onClick={handleProgressClick}>
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

            {/* 控制按钮 */}
            <div className="flex items-center justify-center space-x-6 mb-6">
              <button className="p-2 text-slate-600 hover:text-slate-900 transition-all duration-300 transform hover:scale-110">
                <Shuffle size={20} />
              </button>

              <button onClick={playPrevious} className="p-3 text-slate-600 hover:text-slate-900 transition-all duration-300 transform hover:scale-110">
                <SkipBack size={24} />
              </button>

              <button
                onClick={togglePlayPause}
                className="p-4 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full hover:shadow-2xl transition-all duration-300 transform hover:scale-110 shadow-lg text-white"
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>

              <button onClick={playNext} className="p-3 text-slate-600 hover:text-slate-900 transition-all duration-300 transform hover:scale-110">
                <SkipForward size={24} />
              </button>

              <button className="p-2 text-slate-600 hover:text-slate-900 transition-all duration-300 transform hover:scale-110">
                <Repeat size={20} />
              </button>
            </div>

            {/* 音量控制 */}
            <div className="flex items-center justify-center space-x-4">
              <Volume2 size={20} className="text-slate-600" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-32 h-1 bg-slate-300 rounded-full appearance-none cursor-pointer slider hover:bg-slate-400 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.35);
        }
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: linear-gradient(45deg, #38bdf8, #3b82f6);
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: linear-gradient(45deg, #38bdf8, #3b82f6);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
};

export default MusicPlayer;
