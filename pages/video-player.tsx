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
  error?: string; // 添加可选属性
}

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

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        color: '#00a1d6',
        marginBottom: '30px'
      }}>
        B站视频播放器
      </h1>

      {/* 分页控制 */}
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
              borderRadius: '4px'
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
            disabled={pagination.currentPage <= 1}
            style={{
              padding: '5px 10px',
              backgroundColor: pagination.currentPage <= 1 ? '#ccc' : '#00a1d6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: pagination.currentPage <= 1 ? 'not-allowed' : 'pointer'
            }}
          >
            上一页
          </button>

          <span>
            第 {pagination.currentPage} 页 / 共 {(pagination.totalPages || 1)} 页
          </span>

          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasMore}
            style={{
              padding: '5px 10px',
              backgroundColor: !pagination.hasMore ? '#ccc' : '#00a1d6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: !pagination.hasMore ? 'not-allowed' : 'pointer'
            }}
          >
            下一页
          </button>
        </div>

        <div>
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
        {/* 播放列表 */}
        <div style={{
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          padding: '15px',
          maxHeight: '600px',
          overflowY: 'auto'
        }}>
          <h2 style={{ 
            marginTop: 0, 
            marginBottom: '15px',
            paddingBottom: '10px',
            borderBottom: '1px solid #eee'
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
                    border: currentVideo?.bv === video.bv ? '1px solid #00a1d6' : '1px solid #eee',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = currentVideo?.bv === video.bv ? '#d4f0ff' : '#f5f5f5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = currentVideo?.bv === video.bv ? '#e6f7ff' : 'white';
                  }}
                >
                  <div style={{ 
                    fontWeight: currentVideo?.bv === video.bv ? 'bold' : 'normal',
                    fontSize: '14px',
                    lineHeight: '1.4'
                  }}>
                    {index + 1}. {video.title}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#666', 
                    marginTop: '5px',
                    fontFamily: 'monospace'
                  }}>
                    {video.bv}
                  </div>
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
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
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
                    borderRadius: '4px'
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
                border: '1px solid #eee'
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
                      fontSize: '14px'
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
                    padding: '8px 16px',
                    backgroundColor: videos.length <= 1 ? '#ccc' : '#00a1d6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: videos.length <= 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  上一个
                </button>
                
                <button
                  onClick={playNext}
                  disabled={videos.length <= 1}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: videos.length <= 1 ? '#ccc' : '#00a1d6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: videos.length <= 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  下一个
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              padding: '40px',
              textAlign: 'center',
              color: '#666'
            }}>
              {loading ? '加载中...' : '请从左侧播放列表中选择一个视频'}
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
        fontSize: '14px'
      }}>
        <h3 style={{ marginTop: 0 }}>功能说明:</h3>
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
