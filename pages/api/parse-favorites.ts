// pages/api/parse-favorites.ts
import { NextApiRequest, NextApiResponse } from 'next';

// 定义返回数据的类型
interface VideoInfo {
  bv: string;
  title: string;
  video: string;
}

interface ParseResponse {
  success: boolean;
  count: number;
  videos: VideoInfo[];
  error?: string;
}

// 获取收藏夹视频列表的函数
async function getPlaylistBVIds(mediaId: string): Promise<string[]> {
  const bvids: string[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    try {
      const apiUrl = `https://api.bilibili.com/x/v3/fav/resource/list?media_id=${mediaId}&pn=${page}&ps=20`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': 'https://www.bilibili.com/'
        }
      });

      if (!response.ok) {
        throw new Error(`B站API请求失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.code !== 0) {
        throw new Error(`B站API返回错误: ${data.message}`);
      }

      const resources = data.data?.medias || [];
      
      if (resources.length === 0) {
        break;
      }

      for (const item of resources) {
        if (item.bvid) {
          bvids.push(item.bvid);
        }
      }

      console.log(`第${page}页获取完成，当前共获取${bvids.length}个视频`);

      hasMore = data.data?.has_more === 1;
      page++;
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`获取第${page}页时出错:`, error);
      break;
    }
  }

  return bvids;
}

// 解析单个视频信息的函数
async function parseVideoInfo(bv: string): Promise<VideoInfo | null> {
  try {
    const parseUrl = `https://api.yuafeng.cn/API/ly/bilibili_jx.php?url=https://www.bilibili.com/video/${bv}`;
    
    console.log(`正在解析视频: ${bv}`);
    
    const response = await fetch(parseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.bilibili.com/'
      }
    });

    if (!response.ok) {
      throw new Error(`解析接口请求失败: ${response.status}`);
    }

    const data = await response.json();
    
    // 根据解析接口的实际返回结构调整
    // 假设返回结构为 { title: "视频标题", video: "视频地址" }
    if (data.title && data.video) {
      return {
        bv,
        title: data.title,
        video: data.video
      };
    } else {
      console.warn(`视频 ${bv} 解析结果缺少必要字段:`, data);
      return null;
    }
    
  } catch (error) {
    console.error(`解析视频 ${bv} 时出错:`, error);
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ParseResponse>) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      count: 0, 
      videos: [], 
      error: 'Method not allowed' 
    });
  }

  try {
    const mediaId = '3399027968'; // 固定的收藏夹ID
    
    console.log('开始获取收藏夹视频列表...');
    
    // 1. 获取收藏夹中的所有BV号
    const bvids = await getPlaylistBVIds(mediaId);
    
    if (bvids.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        videos: []
      });
    }

    console.log(`共获取到 ${bvids.length} 个视频，开始解析...`);

    // 2. 并发解析所有视频信息（限制并发数避免被封）
    const videos: VideoInfo[] = [];
    const batchSize = 3; // 每次并发解析3个视频
    const delay = 1000; // 每次批次间隔1秒

    for (let i = 0; i < bvids.length; i += batchSize) {
      const batch = bvids.slice(i, i + batchSize);
      console.log(`解析批次 ${Math.floor(i / batchSize) + 1}:`, batch);
      
      const batchPromises = batch.map(bv => parseVideoInfo(bv));
      const batchResults = await Promise.all(batchPromises);
      
      // 过滤掉解析失败的结果
      const validResults = batchResults.filter((result): result is VideoInfo => result !== null);
      videos.push(...validResults);
      
      console.log(`批次 ${Math.floor(i / batchSize) + 1} 完成，有效结果: ${validResults.length}`);
      
      // 如果不是最后一批，等待一段时间
      if (i + batchSize < bvids.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    console.log(`解析完成，成功解析 ${videos.length} 个视频`);

    // 3. 返回处理后的数据
    res.status(200).json({
      success: true,
      count: videos.length,
      videos
    });

  } catch (error) {
    console.error('处理收藏夹时出错:', error);
    
    const errorMessage = error instanceof Error ? error.message : '发生了未知错误';
    
    res.status(500).json({ 
      success: false, 
      count: 0, 
      videos: [], 
      error: errorMessage 
    });
  }
}
