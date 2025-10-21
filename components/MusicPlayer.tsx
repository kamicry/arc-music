// components/MusicPlayer.tsx
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Howl } from 'howler';
import { Play, Pause, SkipBack, SkipForward, Volume2, Heart, Share, Repeat, Shuffle, Repeat1, ChevronUp, ChevronDown, Search } from 'lucide-react';

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
  const [currentSongIndex, setCurrentSongIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [musicList, setMusicList] = useState<Track[]>([]);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  type PlaybackMode = 'order' | 'single' | 'shuffle';
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>('order');
  // 移动端：是否展开半屏播放器
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const soundRef = useRef<Howl | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoPlayRef = useRef(false);
  const latestCoverForUrlRef = useRef<string | null>(null);
  const coverObjectUrlRef = useRef<string | null>(null);
  const playbackModeRef = useRef<PlaybackMode>('order');

  const currentSong = musicList[currentSongIndex];

  // 加载服务器音乐列表
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/music');
        if (!res.ok) return;
        const data: Track[] = await res.json();
        setAllTracks(data);
        setMusicList(data);
        setCurrentSongIndex(-1);
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
        if (playbackModeRef.current === 'single') {
          try {
            howl.seek(0);
            howl.play();
          } catch {}
          return;
        }
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

  // 同步播放模式到 ref
  useEffect(() => {
    playbackModeRef.current = playbackMode;
  }, [playbackMode]);

  // 解析内嵌专辑封面
  useEffect(() => {
    const url = currentSong?.url;
    setCoverUrl(currentSong?.cover || null);
    if (!url) return;

    let aborted = false;
    latestCoverForUrlRef.current = url;

    const synchsafeToSize = (bytes: Uint8Array) => {
      return (bytes[0] & 0x7f) * 0x200000 + (bytes[1] & 0x7f) * 0x4000 + (bytes[2] & 0x7f) * 0x80 + (bytes[3] & 0x7f);
    };

    const textDecoder = new TextDecoder('iso-8859-1');

    const parseApic = (buf: ArrayBuffer) => {
      const bytes = new Uint8Array(buf);
      if (bytes.length < 10) return null as string | null;
      if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) return null;
      const ver = bytes[3];
      const tagSize = synchsafeToSize(bytes.subarray(6, 10));
      let offset = 10;
      const end = 10 + tagSize;
      while (offset + 10 <= bytes.length && offset + 10 <= end) {
        // frame header
        const id = textDecoder.decode(bytes.subarray(offset, offset + 4));
        let frameSize = 0;
        if (ver === 4) {
          frameSize = synchsafeToSize(bytes.subarray(offset + 4, offset + 8));
        } else {
          frameSize =
            (bytes[offset + 4] << 24) | (bytes[offset + 5] << 16) | (bytes[offset + 6] << 8) | bytes[offset + 7];
        }
        const frameStart = offset + 10;
        if (frameSize <= 0) break;
        if (id === 'APIC') {
          const enc = bytes[frameStart];
          let i = frameStart + 1;
          // MIME type (latin1, null-terminated)
          let mimeEnd = i;
          while (mimeEnd < frameStart + frameSize && bytes[mimeEnd] !== 0x00) mimeEnd++;
          const mime = textDecoder.decode(bytes.subarray(i, mimeEnd)) || 'image/jpeg';
          i = mimeEnd + 1;
          // picture type
          i += 1;
          // description (encoding dependent, null-terminated)
          if (enc === 0x00 || enc === 0x03) {
            while (i < frameStart + frameSize && bytes[i] !== 0x00) i++;
            i += 1;
          } else if (enc === 0x01 || enc === 0x02) {
            // UTF-16 with BOM or without; terminate with 0x00 0x00
            while (i + 1 < frameStart + frameSize) {
              if (bytes[i] === 0x00 && bytes[i + 1] === 0x00) {
                i += 2;
                break;
              }
              i += 2;
            }
          }
          const imgStart = i;
          const imgEnd = Math.min(frameStart + frameSize, bytes.length);
          const imgBytes = bytes.subarray(imgStart, imgEnd);
          const blob = new Blob([imgBytes], { type: mime });
          return URL.createObjectURL(blob);
        }
        offset = frameStart + frameSize;
      }
      return null as string | null;
    };

    const fetchCover = async () => {
      try {
        const headResp = await fetch(url, { headers: { Range: 'bytes=0-10240' }, cache: 'no-store' });
        const headBuf = await headResp.arrayBuffer();
        const headerBytes = new Uint8Array(headBuf);
        if (headerBytes.length >= 10 && headerBytes[0] === 0x49 && headerBytes[1] === 0x44 && headerBytes[2] === 0x33) {
          const size = synchsafeToSize(headerBytes.subarray(6, 10));
          const total = 10 + size;
          const rangeEnd = Math.max(10240, total);
          const resp = await fetch(url, { headers: { Range: `bytes=0-${rangeEnd - 1}` }, cache: 'no-store' });
          const buf = await resp.arrayBuffer();
          if (aborted) return;
          const cover = parseApic(buf);
          if (!aborted && latestCoverForUrlRef.current === url) {
            if (cover && cover.startsWith('blob:')) {
              if (coverObjectUrlRef.current && coverObjectUrlRef.current !== cover) {
                try { URL.revokeObjectURL(coverObjectUrlRef.current); } catch {}
              }
              coverObjectUrlRef.current = cover;
            }
            setCoverUrl(cover);
          }
        } else {
          // Not ID3v2, try a larger chunk
          const resp = await fetch(url, { cache: 'no-store' });
          const buf = await resp.arrayBuffer();
          if (aborted) return;
          const cover = parseApic(buf);
          if (!aborted && latestCoverForUrlRef.current === url) {
            if (cover && cover.startsWith('blob:')) {
              if (coverObjectUrlRef.current && coverObjectUrlRef.current !== cover) {
                try { URL.revokeObjectURL(coverObjectUrlRef.current); } catch {}
              }
              coverObjectUrlRef.current = cover;
            }
            setCoverUrl(cover);
          }
        }
      } catch {
        // ignore
      }
    };

    setCoverUrl(currentSong?.cover || null);
    fetchCover();

    return () => {
      aborted = true;
      if (coverObjectUrlRef.current) {
        try { URL.revokeObjectURL(coverObjectUrlRef.current); } catch {}
        coverObjectUrlRef.current = null;
      }
    };
  }, [currentSong?.url]);

  // 进度计时器
  const startProgressTimer = () => {
    stopProgressTimer();
    progressIntervalRef.current = setInterval(() => {
      const s = soundRef.current;
      if (s && s.playing()) {
        const seek = (s.seek() as number) || 0;
        const dur = s.duration();
        setCurrentTime(seek);
        if (dur && isFinite(dur) && dur > 0) {
          const pct = Math.max(0, Math.min(100, (seek / dur) * 100));
          setProgress(pct);
        } else {
          setProgress(0);
        }
      }
    }, 500);
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
    setCurrentSongIndex((prevIndex) => {
      if (musicList.length === 0) return prevIndex;
      if (playbackMode === 'shuffle') {
        if (musicList.length === 1) return prevIndex >= 0 ? prevIndex : 0;
        let next = prevIndex;
        while (next === prevIndex) {
          next = Math.floor(Math.random() * musicList.length);
        }
        return next;
      }
      const base = prevIndex < 0 ? 0 : prevIndex;
      return base === musicList.length - 1 ? 0 : base + 1;
    });
    setProgress(0);
    setCurrentTime(0);
  };

  const playPrevious = () => {
    if (musicList.length === 0) return;
    if (soundRef.current) {
      soundRef.current.unload();
    }
    autoPlayRef.current = true;
    setCurrentSongIndex((prevIndex) => {
      if (musicList.length === 0) return prevIndex;
      if (playbackMode === 'shuffle') {
        if (musicList.length === 1) return prevIndex >= 0 ? prevIndex : 0;
        let next = prevIndex;
        while (next === prevIndex) {
          next = Math.floor(Math.random() * musicList.length);
        }
        return next;
      }
      const base = prevIndex < 0 ? 0 : prevIndex;
      return base <= 0 ? musicList.length - 1 : base - 1;
    });
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

  // 搜索并更新当前播放列表
  const handleSearch = () => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      setMusicList(allTracks);
    } else {
      const filtered = allTracks.filter((t) =>
        (t.name && t.name.toLowerCase().includes(term)) ||
        (t.artist && t.artist.toLowerCase().includes(term)) ||
        (t.album && t.album.toLowerCase().includes(term))
      );
      setMusicList(filtered);
    }
    if (soundRef.current) {
      soundRef.current.unload();
      soundRef.current = null;
    }
    setIsPlaying(false);
    setCurrentSongIndex(-1);
    setCoverUrl(null);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
  };

  // 进度条点击跳转
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const s = soundRef.current;
    if (!s) return;

    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    let clickPosition = (e.clientX - rect.left) / rect.width;
    if (isNaN(clickPosition)) clickPosition = 0;
    clickPosition = Math.max(0, Math.min(1, clickPosition));

    const dur = s.duration();
    const baseDur = dur && isFinite(dur) && dur > 0 ? dur : duration || 0;
    const newTime = clickPosition * baseDur;

    s.seek(newTime);
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

  const coverNodeSmall = (
    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center mr-4">
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverUrl} alt="cover" className="w-full h-full object-cover" />
      ) : isPlaying ? (
        <div className="flex space-x-1">
          <div className="w-1 h-4 bg-white animate-pulse"></div>
          <div className="w-1 h-4 bg-white animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-1 h-4 bg-white animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      ) : (
        <span className="text-sm font-bold text-white">▶</span>
      )}
    </div>
  );

  const coverNodeLarge = (
    <div className="w-56 h-56 rounded-2xl overflow-hidden shadow-xl transition-transform duration-1000">
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverUrl} alt="cover" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-sky-400 via-blue-400 to-cyan-400 flex items-center justify-center">
          <div className="text-white text-center">
            <span className="text-lg font-semibold">专辑封面</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative min-h-screen text-slate-800">
      <div className="absolute inset-0 -z-10">
        <div
          className="h-full w-full bg-center bg-cover scale-105 transform"
          style={{ backgroundImage: "url('/bg/3.jpeg')" }}
        />
        <div className="absolute inset-0 bg-white/50" />
      </div>

      <div className="h-screen flex flex-col md:flex-row">
        {/* 移动端：底部小播放器，可展开半屏；桌面端：右侧 1/3 宽 */}
        {/* 左侧/下方：歌曲列表 */}
        <div
          className={`
            flex-1 flex flex-col overflow-hidden p-4
            md:w-2/3 md:border-r md:border-slate-200/70 md:bg-white/40
          `}
        >
          <div className="px-4 py-2 md:px-6 md:py-3 border-b border-slate-200/70 shrink-0">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
              Arc-music
            </h1>
          </div>

          <div className="p-3 md:p-6 border-b border-slate-200/60 shrink-0">
            <div className="flex space-x-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                placeholder="搜索歌曲/歌手/专辑"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white/70 text-slate-800 placeholder-slate-500"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-sky-400 to-blue-500 text-white hover:shadow-md inline-flex items-center"
              >
                <Search size={16} className="mr-1" />
                搜索
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pb-24 md:pb-0">
            {musicList.length === 0 && (
              <div className="text-slate-600 text-sm">{allTracks.length === 0 ? '暂无音乐，请在服务器的 public/music 目录放入音频文件。' : '未找到匹配的歌曲'}</div>
            )}
            {musicList.map((song, index) => (
              <div
                key={song.id}
                className={`
                  group flex items-center p-4 rounded-2xl mb-3 cursor-pointer 
                  transition-all duration-300 transform hover:scale-[1.01]
                  ${index === currentSongIndex 
                    ? 'bg-white/60 shadow-md' 
                    : 'hover:bg-white/50'
                  }
                `}
                onClick={() => playSong(index)}
              >
                <div
                  className={`
                    relative w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center mr-4
                    transition-all duration-300
                    ${index === currentSongIndex ? 'shadow-md' : 'group-hover:shadow-sm'}
                  `}
                >
                  <div className="w-full h-full bg-gradient-to-br from-sky-400 to-blue-500 rounded-lg flex items-center justify-center overflow-hidden">
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

        {/* 播放器 */}
        <div
          className="
            hidden md:flex md:w-1/3 md:h-full md:flex-col bg-white/60
          "
        >
          {/* 顶部控制栏 */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200/70">
            <div className="flex items-center">
              {coverNodeSmall}
              <div>
                <p className="font-bold text-lg text-slate-900">{currentSong?.name ?? '未选择'}</p>
                <p className="text-slate-600">{currentSong?.artist ?? ''}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-slate-600">
              <button className="p-2 hover:text-slate-800 transition-colors">
                <Heart size={20} />
              </button>
              <button
                onClick={() => { if (currentSong?.url) { window.open(currentSong.url, '_blank'); } }}
                className="p-2 hover:text-slate-800 transition-colors disabled:opacity-50"
                disabled={!currentSong?.url}
              >
                <Share size={20} />
              </button>
            </div>
          </div>

          {/* 播放器内容 */}
          <div className="flex-1 flex items-center justify-center p-4 md:p-6">
            <div className="flex flex-col items-center w-full max-w-4xl">
              {/* 专辑封面和歌曲信息 */}
              <div className="flex items-center justify-center mb-4 md:mb-8 w-full">
                <div className="flex items-center space-x-4 md:space-x-6">
                  {coverNodeLarge}

                  {/* 歌曲信息 */}
                  <div className="text-left max-w-xs">
                    <h2 className="text-2xl font-bold mb-2 text-slate-900">{currentSong?.name ?? '未选择'}</h2>
                    <p className="text-lg text-slate-700 mb-1">{currentSong?.artist ?? ''}</p>
                    <p className="text-slate-500">{currentSong?.album ?? ''}</p>
                  </div>
                </div>
              </div>

              {/* 进度条 */}
              <div className="w-full max-w-2xl mb-4 md:mb-6">
                <div className="h-2 bg-slate-300 rounded-full cursor-pointer group overflow-hidden" onClick={handleProgressClick}>
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
              <div className="flex items-center justify-center space-x-6 mb-2 md:mb-6">
                <button onClick={() => {
                  // 随机切换一首歌
                  if (musicList.length === 0) return;
                  if (soundRef.current) {
                    soundRef.current.unload();
                  }
                  autoPlayRef.current = true;
                  const prev = currentSongIndex;
                  let idx = Math.floor(Math.random() * musicList.length);
                  if (musicList.length > 1) {
                    while (idx === prev) idx = Math.floor(Math.random() * musicList.length);
                  }
                  setCurrentSongIndex(idx);
                  setProgress(0);
                  setCurrentTime(0);
                }} className="p-2 text-slate-600 hover:text-slate-900 transition-all duration-300 transform hover:scale-110">
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

                <button
                  onClick={() => setPlaybackMode((m) => (m === 'order' ? 'single' : m === 'single' ? 'shuffle' : 'order'))}
                  className={`p-2 transition-all duration-300 transform hover:scale-110 ${playbackMode === 'order' ? 'text-slate-600 hover:text-slate-900' : 'text-sky-600 ring-1 ring-sky-400 rounded-full'}`}
                >
                  {playbackMode === 'single' ? <Repeat1 size={20} /> : playbackMode === 'shuffle' ? <Shuffle size={20} /> : <Repeat size={20} />}
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
        {/* 移动端：底部小播放器与半屏展开（带动画） */}
        <div
          className={`md:hidden fixed bottom-0 left-0 right-0 h-20 z-30 bg-white/80 backdrop-blur border-t border-slate-200 flex items-center px-3 transform transition-transform duration-300 ease-in-out ${mobileExpanded ? 'translate-y-full pointer-events-none' : 'translate-y-0'}`}
        >
          <div className="flex items-center flex-1 min-w-0" onClick={() => setMobileExpanded(true)}>
            {coverNodeSmall}
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 truncate">{currentSong?.name ?? '未选择'}</p>
              <p className="text-sm text-slate-600 truncate">{currentSong?.artist ?? ''}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 pl-3">
            <button onClick={(e) => { e.stopPropagation(); playPrevious(); }} className="p-2 text-slate-600 hover:text-slate-900">
              <SkipBack size={20} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); togglePlayPause(); }} className="p-2 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full text-white">
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); playNext(); }} className="p-2 text-slate-600 hover:text-slate-900">
              <SkipForward size={20} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setMobileExpanded(true); }} className="p-2 text-slate-600 hover:text-slate-900">
              <ChevronUp size={20} />
            </button>
          </div>
        </div>
        <div
          className={`md:hidden fixed inset-x-0 bottom-0 z-40 h-[50vh] bg-white/90 backdrop-blur rounded-t-2xl shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${mobileExpanded ? 'translate-y-0' : 'translate-y-full pointer-events-none'}`}
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-200/70">
            <div className="flex items-center">
              {coverNodeSmall}
              <div>
                <p className="font-bold text-lg text-slate-900">{currentSong?.name ?? '未选择'}</p>
                <p className="text-slate-600">{currentSong?.artist ?? ''}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-slate-600">
              <button className="p-2 hover:text-slate-800 transition-colors">
                <Heart size={20} />
              </button>
              <button
                onClick={() => { if (currentSong?.url) { window.open(currentSong.url, '_blank'); } }}
                className="p-2 hover:text-slate-800 transition-colors disabled:opacity-50"
                disabled={!currentSong?.url}
              >
                <Share size={20} />
              </button>
              <button onClick={() => setMobileExpanded(false)} className="p-2 hover:text-slate-800">
                <ChevronDown size={20} />
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="flex flex-col items-center w-full">
              <div className="w-full mb-3">
                <div className="h-2 bg-slate-300 rounded-full cursor-pointer group overflow-hidden" onClick={handleProgressClick}>
                  <div className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full transition-all duration-300 relative" style={{ width: `${progress}%` }}>
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-lg" />
                  </div>
                </div>
                <div className="flex justify-between text-sm text-slate-600 mt-2">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
              <div className="flex items-center justify-center space-x-6 mb-2">
                <button onClick={() => {
                  if (musicList.length === 0) return;
                  if (soundRef.current) {
                    soundRef.current.unload();
                  }
                  autoPlayRef.current = true;
                  const prev = currentSongIndex;
                  let idx = Math.floor(Math.random() * musicList.length);
                  if (musicList.length > 1) {
                    while (idx === prev) idx = Math.floor(Math.random() * musicList.length);
                  }
                  setCurrentSongIndex(idx);
                  setProgress(0);
                  setCurrentTime(0);
                }} className="p-2 text-slate-600 hover:text-slate-900">
                  <Shuffle size={20} />
                </button>
                <button onClick={playPrevious} className="p-2 text-slate-600 hover:text-slate-900">
                  <SkipBack size={24} />
                </button>
                <button onClick={togglePlayPause} className="p-3 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full text-white">
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>
                <button onClick={playNext} className="p-2 text-slate-600 hover:text-slate-900">
                  <SkipForward size={24} />
                </button>
                <button
                  onClick={() => setPlaybackMode((m) => (m === 'order' ? 'single' : m === 'single' ? 'shuffle' : 'order'))}
                  className={`p-2 ${playbackMode === 'order' ? 'text-slate-600 hover:text-slate-900' : 'text-sky-600 ring-1 ring-sky-400 rounded-full'}`}
                >
                  {playbackMode === 'single' ? <Repeat1 size={20} /> : playbackMode === 'shuffle' ? <Shuffle size={20} /> : <Repeat size={20} />}
                </button>
              </div>
              <div className="flex items-center justify-center space-x-3">
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
