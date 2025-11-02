// pages/api/bilibili-list.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  // 设置CORS头，允许跨域请求
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { mediaId } = req.query;

  if (!mediaId) {
    return res.status(400).json({ 
      error: 'Missing mediaId parameter',
      usage: 'GET /api/bilibili-list?mediaId=YOUR_MEDIA_ID'
    });
  }

  try {
    const bvids = await getPlaylistBVIds(mediaId);
    
    res.status(200).json({
      success: true,
      mediaId,
      count: bvids.length,
      bvids: bvids
    });
  } catch (error) {
    console.error('Error fetching B站 playlist:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}

async function getPlaylistBVIds(mediaId) {
  const bvids = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    try {
      // B站收藏夹API [citation:6]
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

      // 提取BV号
      for (const item of resources) {
        if (item.bvid) {
          bvids.push(item.bvid);
        }
      }

      console.log(`第${page}页获取完成，当前共获取${bvids.length}个视频`);

      // 检查是否还有下一页 [citation:6]
      hasMore = data.data?.has_more === 1;
      page++;
      
      // 添加延迟避免请求过快
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`获取第${page}页时出错:`, error);
      break;
    }
  }

  return bvids;
}
