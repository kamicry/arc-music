// pages/video-player.tsx
import { useState, useEffect, useRef } from 'react';

interface VideoInfo {
  bv: string;
  title: string;
  video: string;
}

interface ApiResponse {
  success: boolean;
  count: number;
  videos: VideoInfo[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    hasMore: boolean;
    totalPages?: number;
  };
  error?: string;
}

// 播放列表滚动条样式组件
const PlaylistScrollbarStyles = () => (
  <style jsx global>{`
    .playlist-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: #00a1d6 #f1f1f1;
    }
    
    .playlist-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    
    .playlist-scrollbar::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }
    
    .playlist-scrollbar::-webkit-scrollbar-thumb {
      background: #00a1d6;
      border-radius: 3px;
    }
    
    .playlist-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #008fb3;
    }
  `}</style>
);

// 全局滚动条样式组件
const GlobalScrollbarStyles = () => (
  <style jsx global>{`
    /* 全局滚动条样式 */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    
    ::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }
    
    /* Firefox 滚动条样式 */
    * {
      scrollbar-width: thin;
      scrollbar-color: #c1c1c1 #f1f1f1;
    }
    
    /* 动画 */
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `}</style>
);

export default function VideoPlayer() {
  // 状态管理
  const [videos, setVideos] = useState<VideoInfo[]>([]);
  const [currentVideo, setCurrentVideo] = useState<VideoInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState<{
    currentPage: number;
    pageSize: number;
    totalItems: number;
    hasMore: boolean;
    totalPages?: number;
  }>({
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    hasMore: false
  });

  // 视频元素引用
  const videoRef = useRef<HTMLVideoElement>(null);

  // 获取播放列表
  const fetchPlaylist = async (page: number = pagination.currentPage, pageSize: number = pagination.pageSize) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/parse-favorites?page=${page}&pageSize=${pageSize}`);
      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setVideos(data.videos);
        setPagination(data.pagination);
        
        // 如果还没有当前播放的视频，自动选择第一个
        if (!currentVideo && data.videos.length > 0) {
          setCurrentVideo(data.videos[0]);
        }
      } else {
        setError(data.error || '获取播放列表失败');
      }
    } catch (err) {
      setError('网络请求失败，请检查API服务是否正常');
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载
  useEffect(() => {
    fetchPlaylist(1, 10);
  }, []);

  // 处理视频结束事件，实现自动连播
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleVideoEnd = () => {
      if (videos.length === 0) return;
      
      const currentIndex = videos.findIndex(v => v.bv === currentVideo?.bv);
      if (currentIndex === -1) return;
      
      // 播放下一个视频
      const nextIndex = (currentIndex + 1) % videos.length;
      setCurrentVideo(videos[nextIndex]);
    };

    videoElement.addEventListener('ended', handleVideoEnd);
    
    return () => {
      videoElement.removeEventListener('ended', handleVideoEnd);
    };
  }, [videos, currentVideo]);

  // 分页控制
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > (pagination.totalPages || 1)) return;
    fetchPlaylist(newPage, pagination.pageSize);
  };

  const handlePageSizeChange = (newSize: number) => {
    if (newSize < 1 || newSize > 20) return;
    fetchPlaylist(1, newSize);
  };

  // 播放指定视频
  const playVideo = (video: VideoInfo) => {
    setCurrentVideo(video);
    // 滚动到播放器位置
    setTimeout(() => {
      document.getElementById('video-player-section')?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  };

  // 播放下一个视频
  const playNext = () => {
    if (videos.length === 0) return;
    
    const currentIndex = videos.findIndex(v => v.bv === currentVideo?.bv);
    if (currentIndex === -1) return;
    
    const nextIndex = (currentIndex + 1) % videos.length;
    setCurrentVideo(videos[nextIndex]);
  };

  // 播放上一个视频
  const playPrev = () => {
    if (videos.length === 0) return;
    
    const currentIndex = videos.findIndex(v => v.bv === currentVideo?.bv);
    if (currentIndex === -1) return;
    
    const prevIndex = (currentIndex - 1 + videos.length) % videos.length;
    setCurrentVideo(videos[prevIndex]);
  };

  // 计算分页按钮状态
  const canGoPrev = pagination.currentPage > 1;
  const canGoNext = pagination.hasMore;

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
    }}>
      {/* 添加全局滚动条样式 */}
      <GlobalScrollbarStyles />
      <PlaylistScrollbarStyles />

      <h1 style={{ 
        textAlign: 'center', 
        color: '#00a1d6',
        marginBottom: '30px'
      }}>
        B站视频播放器
      </h1>

      {/* 分页控制 - 修复按钮状态 */}
      <div style={{
        backgroundColor: '#f5f5f5',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>每页显示:</span>
          <select 
            value={pagination.pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            style={{
              padding: '5px 10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            <option value={5}>5个视频</option>
            <option value={10}>10个视频</option>
            <option value={15}>15个视频</option>
            <option value={20}>20个视频</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={!canGoPrev}
            style={{
              padding: '8px 16px',
              backgroundColor: canGoPrev ? '#00a1d6' : '#cccccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: canGoPrev ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              if (canGoPrev) {
                e.currentTarget.style.backgroundColor = '#008fb3';
              }
            }}
            onMouseLeave={(e) => {
              if (canGoPrev) {
                e.currentTarget.style.backgroundColor = '#00a1d6';
              }
            }}
          >
            上一页
          </button>

          <span style={{ minWidth: '120px', textAlign: 'center' }}>
            第 {pagination.currentPage} 页 / 共 {(pagination.totalPages || 1)} 页
          </span>

          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!canGoNext}
            style={{
              padding: '8px 16px',
              backgroundColor: canGoNext ? '#00a1d6' : '#cccccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: canGoNext ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              if (canGoNext) {
                e.currentTarget.style.backgroundColor = '#008fb3';
              }
            }}
            onMouseLeave={(e) => {
              if (canGoNext) {
                e.currentTarget.style.backgroundColor = '#00a1d6';
              }
            }}
          >
            下一页
          </button>
        </div>

        <div style={{ fontWeight: 'bold' }}>
          共 {pagination.totalItems} 个视频
        </div>
      </div>

      {/* 错误显示 */}
      {error && (
        <div style={{
          padding: '15px',
          backgroundColor: '#ffe6e6',
          border: '1px solid #ffcccc',
          borderRadius: '8px',
          marginBottom: '20px',
          color: '#cc0000'
        }}>
          {error}
        </div>
      )}

      {/* 主要内容区域 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 2fr',
        gap: '20px',
        alignItems: 'start'
      }}>
        {/* 播放列表 - 使用 CSS 类名应用滚动条样式 */}
        <div className="playlist-scrollbar" style={{
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          padding: '15px',
          maxHeight: '600px',
          overflowY: 'auto',
        }}>
          <h2 style={{ 
            marginTop: 0, 
            marginBottom: '15px',
            paddingBottom: '10px',
            borderBottom: '1px solid #eee',
            position: 'sticky',
            top: 0,
            backgroundColor: '#f9f9f9',
            zIndex: 1
          }}>
            播放列表 ({videos.length})
          </h2>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              加载中...
            </div>
          ) : videos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              暂无视频
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {videos.map((video, index) => (
                <div
                  key={video.bv}
                  onClick={() => playVideo(video)}
                  style={{
                    padding: '12px',
                    borderRadius: '6px',
                    backgroundColor: currentVideo?.bv === video.bv ? '#e6f7ff' : 'white',
                    border: currentVideo?.bv === video.bv ? '2px solid #00a1d6' : '1px solid #eee',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = currentVideo?.bv === video.bv ? '#d4f0ff' : '#f5f5f5';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = currentVideo?.bv === video.bv ? '#e6f7ff' : 'white';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ 
                    fontWeight: currentVideo?.bv === video.bv ? 'bold' : 'normal',
                    fontSize: '14px',
                    lineHeight: '1.4'
                  }}>
                    <span style={{
                      display: 'inline-block',
                      width: '24px',
                      height: '24px',
                      lineHeight: '24px',
                      textAlign: 'center',
                      backgroundColor: currentVideo?.bv === video.bv ? '#00a1d6' : '#ddd',
                      color: currentVideo?.bv === video.bv ? 'white' : '#666',
                      borderRadius: '50%',
                      marginRight: '8px',
                      fontSize: '12px'
                    }}>
                      {index + 1}
                    </span>
                    {video.title}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#666', 
                    marginTop: '5px',
                    fontFamily: 'monospace',
                    marginLeft: '32px'
                  }}>
                    {video.bv}
                  </div>
                  
                  {/* 当前播放指示器 */}
                  {currentVideo?.bv === video.bv && (
                    <div style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#00a1d6',
                      borderRadius: '50%',
                      animation: 'pulse 1.5s infinite'
                    }}></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 视频播放器 */}
        <div id="video-player-section">
          {currentVideo ? (
            <div style={{
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              position: 'sticky',
              top: '20px'
            }}>
              <h2 style={{ 
                marginTop: 0, 
                marginBottom: '15px',
                fontSize: '18px',
                lineHeight: '1.4'
              }}>
                {currentVideo.title}
              </h2>

              {/* 视频播放器 */}
              <div style={{ 
                position: 'relative', 
                paddingBottom: '56.25%', /* 16:9 宽高比 */
                height: 0,
                marginBottom: '15px'
              }}>
                <video
                  ref={videoRef}
                  controls
                  autoPlay
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    borderRadius: '8px',
                    backgroundColor: '#000'
                  }}
                  src={currentVideo.video}
                >
                  您的浏览器不支持视频播放。
                </video>
              </div>

              {/* 视频信息 */}
              <div style={{ 
                backgroundColor: 'white',
                padding: '15px',
                borderRadius: '6px',
                border: '1px solid #eee',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                <div style={{ marginBottom: '10px' }}>
                  <strong>BV号:</strong> 
                  <span style={{ 
                    fontFamily: 'monospace', 
                    marginLeft: '8px',
                    backgroundColor: '#f0f0f0',
                    padding: '2px 6px',
                    borderRadius: '3px'
                  }}>
                    {currentVideo.bv}
                  </span>
                </div>
                
                <div style={{ marginBottom: '10px' }}>
                  <strong>视频链接:</strong>
                  <a 
                    href={currentVideo.video} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      display: 'block',
                      wordBreak: 'break-all',
                      color: '#00a1d6',
                      marginTop: '5px',
                      fontSize: '14px',
                      textDecoration: 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.textDecoration = 'underline';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.textDecoration = 'none';
                    }}
                  >
                    {currentVideo.video}
                  </a>
                </div>
              </div>

              {/* 播放控制 */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '15px',
                marginTop: '15px'
              }}>
                <button
                  onClick={playPrev}
                  disabled={videos.length <= 1}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: videos.length <= 1 ? '#ccc' : '#00a1d6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: videos.length <= 1 ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (videos.length > 1) {
                      e.currentTarget.style.backgroundColor = '#008fb3';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (videos.length > 1) {
                      e.currentTarget.style.backgroundColor = '#00a1d6';
                    }
                  }}
                >
                  ⏮ 上一个
                </button>
                
                <button
                  onClick={playNext}
                  disabled={videos.length <= 1}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: videos.length <= 1 ? '#ccc' : '#00a1d6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: videos.length <= 1 ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (videos.length > 1) {
                      e.currentTarget.style.backgroundColor = '#008fb3';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (videos.length > 1) {
                      e.currentTarget.style.backgroundColor = '#00a1d6';
                    }
                  }}
                >
                  下一个 ⏭
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              padding: '40px',
              textAlign: 'center',
              color: '#666',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '300px'
            }}>
              {loading ? (
                <>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #f3f3f3',
                    borderTop: '4px solid #00a1d6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginBottom: '15px'
                  }}></div>
                  加载中...
                </>
              ) : (
                <>
                  <div style={{ fontSize: '48px', marginBottom: '15px' }}>📺</div>
                  请从左侧播放列表中选择一个视频
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 功能说明 */}
      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#f0f8ff',
        borderRadius: '8px',
        fontSize: '14px',
        border: '1px solid #d4ebff'
      }}>
        <h3 style={{ marginTop: 0, color: '#00a1d6' }}>功能说明:</h3>
        <ul style={{ paddingLeft: '20px', marginBottom: 0 }}>
          <li>使用分页控件调整显示的播放列表</li>
          <li>点击左侧列表中的视频标题开始播放</li>
          <li>当前播放的视频会高亮显示</li>
          <li>视频播放结束后会自动播放下一个</li>
          <li>可以使用"上一个"/"下一个"按钮手动切换</li>
          <li>显示当前视频的BV号和原始链接</li>
        </ul>
      </div>
    </div>
  );
}
