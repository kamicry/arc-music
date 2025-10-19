// components/MusicPlayer.tsx
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Howl } from 'howler';
import { Play, Pause, SkipBack, SkipForward, Volume2, Heart, Share, Repeat, Shuffle } from 'lucide-react';

// 音乐数据从服务器获取
export type Track = {
  id: number;
  name: string;
  url: string;
  artist?: string;
  album?: string;
  duration?: string;
  cover?: string;
};

const MusicPlayer = () => {
  // 播放器状态
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [musicList, setMusicList] = useState<Track[]>([]);

  const soundRef = useRef<Howl | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoPlayRef = useRef(false);

  const currentSong = musicList[currentSongIndex];

  // 加载服务器音乐列表
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/music');
        if (!res.ok) return;
        const data: Track[] = await res.json();
        setMusicList(data);
      } catch (e) {
        // ignore
      }
    };
    load();
  }, []);

  // 初始化音频
  useEffect(() => {
    if (!currentSong || !currentSong.url) return;

    if (soundRef.current) {
      soundRef.current.unload();
      soundRef.current = null;
    }

    const howl = new Howl({
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
        setDuration(howl.duration());
      },
    });

    soundRef.current = howl;

    if (autoPlayRef.current) {
      try {
        howl.play();
      } catch {
        // ignore
      } finally {
        autoPlayRef.current = false;
      }
    }

    return () => {
      if (soundRef.current) {
        soundRef.current.unload();
        soundRef.current = null;
      }
      stopProgressTimer();
    };
  }, [currentSong?.url]);

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
    if (musicList.length === 0) return;
    if (soundRef.current) {
      soundRef.current.unload();
    }
    autoPlayRef.current = true;
    setCurrentSongIndex((prevIndex) => (prevIndex === musicList.length - 1 ? 0 : prevIndex + 1));
    setProgress(0);
    setCurrentTime(0);
  };

  const playPrevious = () => {
    if (musicList.length === 0) return;
    if (soundRef.current) {
      soundRef.current.unload();
    }
    autoPlayRef.current = true;
    setCurrentSongIndex((prevIndex) => (prevIndex === 0 ? musicList.length - 1 : prevIndex - 1));
    setProgress(0);
    setCurrentTime(0);
  };

  // 选择播放列表中的歌曲
  const playSong = (index: number) => {
    if (musicList.length === 0) return;
    if (soundRef.current) {
      soundRef.current.unload();
    }
    autoPlayRef.current = true;
    setCurrentSongIndex(index);
    setProgress(0);
    setCurrentTime(0);
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
    <div className="relative min-h-screen text-slate-800">
      {/* 背景图层：读取 /bg 目录中的图片（默认 background.jpg），并添加模糊效果 */}
      <div className="absolute inset-0 -z-10">
        <div
          className="h-full w-full bg-center bg-cover scale-105 transform"
          style={{ backgroundImage: "url('/bg/3.jpeg')" }}
        />
        <div className="absolute inset-0 bg-white/15" />
      </div>

      <div className="h-screen flex">
        {/* 左侧：歌曲列表，占 2/3 */}
        <div className="w-2/3 overflow-hidden flex flex-col border-r border-slate-200/70 bg-white/40 backdrop-blur-md">
          <div className="p-6 border-b border-slate-200/70">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
              我的音乐库
            </h1>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {musicList.length === 0 && (
              <div className="text-slate-600 text-sm">暂无音乐，请在服务器的 public/music 目录放入音频文件。</div>
            )}
            {musicList.map((song, index) => (
              <div
                key={song.id}
                className={`
                  group flex items-center p-4 rounded-2xl mb-3 cursor-pointer 
                  transition-all duration-300 transform hover:scale-[1.01]
                  ${index === currentSongIndex 
                    ? 'bg-white/60 shadow-md backdrop-blur-sm' 
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
                  <p className="text-sm text-slate-500 truncate">{song.artist ?? ''}</p>
                </div>

                <div className="flex items-center space-x-3">
                  <button className="opacity-0 group-hover:opacity-100 hover:text-sky-600 transition-all duration-300">
                    <Heart size={16} />
                  </button>
                  <span className="text-sm text-slate-500">{song.duration ?? ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧：播放器，占 1/3 */}
        <div className="w-1/3 h-full bg-white/60 backdrop-blur-lg flex flex-col">
          {/* 顶部控制栏 */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200/70">
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
                <p className="font-bold text-lg text-slate-900">{currentSong?.name ?? '未选择'}</p>
                <p className="text-slate-600">{currentSong?.artist ?? ''}</p>
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
                  {/* 专辑封面（不再旋转） */}
                  <div className="w-40 h-40 rounded-2xl overflow-hidden shadow-xl transition-transform duration-1000">
                    <div className="w-full h-full bg-gradient-to-br from-sky-400 via-blue-400 to-cyan-400 flex items-center justify-center">
                      <div className="text-white text-center">
                        <span className="text-lg font-semibold">专辑封面</span>
                      </div>
                    </div>
                  </div>

                  {/* 歌曲信息 */}
                  <div className="text-left max-w-xs">
                    <h2 className="text-2xl font-bold mb-2 text-slate-900">{currentSong?.name ?? '未选择'}</h2>
                    <p className="text-lg text-slate-700 mb-1">{currentSong?.artist ?? ''}</p>
                    <p className="text-slate-500">{currentSong?.album ?? ''}</p>
                  </div>
                </div>
              </div>

              {/* 进度条 */}
              <div className="w-full max-w-2xl mb-6">
                <div className="h-2 bg-slate-300 rounded-full cursor-pointer group" onClick={handleProgressClick}>
                  <div className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full transition-all duration-300 relative" style={{ width: `${progress}%` }}>
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

                <button onClick={togglePlayPause} className="p-4 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full hover:shadow-2xl transition-all duration-300 transform hover:scale-110 shadow-lg text-white">
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
      </div>
    </div>
  );
};

export default MusicPlayer;
