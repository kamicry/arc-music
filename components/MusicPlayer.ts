// components/MusicPlayer.js
'use client';
import { useState, useRef, useEffect } from 'react';
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
  ChevronUp,
  ChevronDown
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
    cover: '/covers/cover1.jpg'
  },
  {
    id: 2,
    name: 'Butter-Fly',
    artist: '和田光司',
    album: 'デジモンアドベンチャー',
    duration: '4:12',
    url: '/music/song2.mp3',
    cover: '/covers/cover2.jpg'
  },
  {
    id: 3,
    name: 'Blue Bird',
    artist: 'いきものがかり',
    album: 'My song Your song',
    duration: '3:35',
    url: '/music/song3.mp3',
    cover: '/covers/cover3.jpg'
  },
  {
    id: 4,
    name: 'シリウス',
    artist: '藍井エイル',
    album: 'AUBE',
    duration: '4:22',
    url: '/music/song4.mp3',
    cover: '/covers/cover4.jpg'
  },
  {
    id: 5,
    name: 'Crossing Field',
    artist: 'LiSA',
    album: 'LANDSPACE',
    duration: '4:08',
    url: '/music/song5.mp3',
    cover: '/covers/cover5.jpg'
  }
];

const MusicPlayer = () => {
  // 播放器状态
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isExpanded, setIsExpanded] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  // 修复前（可能的样子）:
// const soundRef = useRef(null);

//修复后:
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
        setDuration(soundRef.current.duration());
      }
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
        const seek = soundRef.current.seek();
        setCurrentTime(seek);
        setProgress((seek / duration) * 100);
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
    setCurrentSongIndex((prevIndex) => 
      prevIndex === musicList.length - 1 ? 0 : prevIndex + 1
    );
    setProgress(0);
    setCurrentTime(0);
  };

  const playPrevious = () => {
    if (soundRef.current) {
      soundRef.current.unload();
    }
    setCurrentSongIndex((prevIndex) => 
      prevIndex === 0 ? musicList.length - 1 : prevIndex - 1
    );
    setProgress(0);
    setCurrentTime(0);
  };

  // 选择播放列表中的歌曲
  const playSong = (index) => {
    if (soundRef.current) {
      soundRef.current.unload();
    }
    setCurrentSongIndex(index);
    setProgress(0);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  // 进度条点击跳转
  const handleProgressClick = (e) => {
    if (!soundRef.current) return;
    
    const progressBar = e.currentTarget;
    const clickPosition = (e.clientX - progressBar.getBoundingClientRect().left) / progressBar.offsetWidth;
    const newTime = clickPosition * duration;
    
    soundRef.current.seek(newTime);
    setCurrentTime(newTime);
    setProgress(clickPosition * 100);
  };

  // 格式化时间
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // 切换播放器展开/收起状态
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 to-purple-900 text-white">
      {/* 歌曲列表 - 固定占据2/3空间 */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            我的音乐库
          </h1>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          {musicList.map((song, index) => (
            <div
              key={song.id}
              className={`
                group flex items-center p-4 rounded-2xl mb-3 cursor-pointer 
                transition-all duration-300 transform hover:scale-[1.02] 
                ${index === currentSongIndex 
                  ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 shadow-lg' 
                  : 'hover:bg-white/5'
                }
              `}
              onClick={() => playSong(index)}
            >
              <div className={`
                relative w-12 h-12 rounded-lg flex items-center justify-center mr-4
                transition-all duration-300
                ${index === currentSongIndex ? 'shadow-lg' : 'group-hover:shadow-md'}
              `}>
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  {index === currentSongIndex && isPlaying ? (
                    <div className="flex space-x-1">
                      <div className="w-1 h-3 bg-white animate-pulse"></div>
                      <div className="w-1 h-3 bg-white animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-1 h-3 bg-white animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  ) : (
                    <span className="text-xs font-bold">{index + 1}</span>
                  )}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={`font-semibold truncate ${
                  index === currentSongIndex ? 'text-white' : 'text-gray-200'
                }`}>
                  {song.name}
                </p>
                <p className="text-sm text-gray-400 truncate">{song.artist}</p>
              </div>
              
              <div className="flex items-center space-x-3">
                <button className="opacity-0 group-hover:opacity-100 hover:text-pink-400 transition-all duration-300">
                  <Heart size={16} />
                </button>
                <span className="text-sm text-gray-400">{song.duration}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 播放器 - 可展开收起 */}
      <div className={`
        bg-black/30 backdrop-blur-lg border-t border-white/10
        transition-all duration-500 ease-in-out
        ${isExpanded ? 'h-1/3' : 'h-20'}
      `}>
        {/* 收起状态 - 迷你播放器 */}
        {!isExpanded && (
          <div className="h-full flex items-center px-4">
            <div className="flex items-center w-1/3">
              <div className="w-12 h-12 rounded-md bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mr-3">
                {isPlaying ? (
                  <div className="flex space-x-1">
                    <div className="w-1 h-3 bg-white animate-pulse"></div>
                    <div className="w-1 h-3 bg-white animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-1 h-3 bg-white animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-white">▶</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{currentSong.name}</p>
                <p className="text-sm text-gray-400 truncate">{currentSong.artist}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-center w-1/3">
              <button 
                onClick={playPrevious}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <SkipBack size={20} />
              </button>
              <button 
                onClick={togglePlayPause}
                className="p-2 mx-4 bg-purple-600 rounded-full hover:bg-purple-700 transition-colors"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button 
                onClick={playNext}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <SkipForward size={20} />
              </button>
            </div>
            
            <div className="flex items-center justify-end w-1/3">
              <div className="flex items-center space-x-3">
                <div className="w-24">
                  <div 
                    className="h-1 bg-gray-700 rounded-full cursor-pointer"
                    onClick={handleProgressClick}
                  >
                    <div 
                      className="h-full bg-purple-600 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm text-gray-400">{formatTime(currentTime)}</span>
                <button 
                  onClick={toggleExpand}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronUp size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 展开状态 - 完整播放器（居中布局） */}
        {isExpanded && (
          <div className="h-full flex flex-col">
            {/* 顶部控制栏 */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center">
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mr-4">
                  {isPlaying ? (
                    <div className="flex space-x-1">
                      <div className="w-1 h-4 bg-white animate-pulse"></div>
                      <div className="w-1 h-4 bg-white animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-1 h-4 bg-white animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-white">▶</span>
                  )}
                </div>
                <div>
                  <p className="font-bold text-lg">{currentSong.name}</p>
                  <p className="text-gray-400">{currentSong.artist}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <button className="p-2 text-gray-400 hover:text-white transition-colors">
                  <Heart size={20} />
                </button>
                <button className="p-2 text-gray-400 hover:text-white transition-colors">
                  <Share size={20} />
                </button>
                <button 
                  onClick={toggleExpand}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronDown size={20} />
                </button>
              </div>
            </div>
            
            {/* 播放器内容 - 居中布局 */}
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="flex flex-col items-center w-full max-w-4xl">
                {/* 专辑封面和歌曲信息 - 居中 */}
                <div className="flex items-center justify-center mb-8 w-full">
                  <div className="flex items-center space-x-6">
                    {/* 专辑封面 */}
                    <div className={`
                      w-40 h-40 rounded-2xl overflow-hidden shadow-2xl
                      transition-transform duration-1000
                      ${isPlaying ? 'animate-spin-slow' : ''}
                    `}>
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center">
                        <div className="text-white text-center">
                          <span className="text-lg font-semibold">专辑封面</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* 歌曲信息 */}
                    <div className="text-left max-w-xs">
                      <h2 className="text-2xl font-bold mb-2">{currentSong.name}</h2>
                      <p className="text-lg text-gray-300 mb-1">{currentSong.artist}</p>
                      <p className="text-gray-500">{currentSong.album}</p>
                    </div>
                  </div>
                </div>
                
                {/* 进度条 - 居中 */}
                <div className="w-full max-w-2xl mb-6">
                  <div 
                    className="h-2 bg-gray-700 rounded-full cursor-pointer group"
                    onClick={handleProgressClick}
                  >
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300 relative"
                      style={{ width: `${progress}%` }}
                    >
                      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-lg" />
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-400 mt-2">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
                
                {/* 控制按钮 - 居中 */}
                <div className="flex items-center justify-center space-x-6 mb-6">
                  <button className="p-2 text-gray-400 hover:text-white transition-all duration-300 transform hover:scale-110">
                    <Shuffle size={20} />
                  </button>
                  
                  <button 
                    onClick={playPrevious}
                    className="p-3 text-gray-400 hover:text-white transition-all duration-300 transform hover:scale-110"
                  >
                    <SkipBack size={24} />
                  </button>
                  
                  <button 
                    onClick={togglePlayPause}
                    className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full hover:shadow-2xl transition-all duration-300 transform hover:scale-110 shadow-lg"
                  >
                    {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                  </button>
                  
                  <button 
                    onClick={playNext}
                    className="p-3 text-gray-400 hover:text-white transition-all duration-300 transform hover:scale-110"
                  >
                    <SkipForward size={24} />
                  </button>
                  
                  <button className="p-2 text-gray-400 hover:text-white transition-all duration-300 transform hover:scale-110">
                    <Repeat size={20} />
                  </button>
                </div>
                
                {/* 音量控制 - 居中 */}
                <div className="flex items-center justify-center space-x-4">
                  <Volume2 size={20} className="text-gray-400" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-32 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer slider hover:bg-gray-600 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
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
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: linear-gradient(45deg, #a855f7, #ec4899);
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: linear-gradient(45deg, #a855f7, #ec4899);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
};

export default MusicPlayer;
