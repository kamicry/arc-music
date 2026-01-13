import { 
  SearchApiItem, 
  UrlApiResponse, 
  PicApiResponse, 
  LyricApiResponse, 
  Track,
  LocalTrack,
  BitrateOption
} from '../types';
import { sanitizeUrl, normalizeText, collectArtistTokens } from './music';

const MUSIC_API_BASE = 'https://music-api.gdstudio.xyz/api.php';
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 60;
const DEFAULT_SEARCH_COUNT = 8;
const DEFAULT_COVER_SIZE = '300';

class ApiClient {
  private requestTimestamps: number[] = [];

  private registerRequest(): void {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW_MS;
    this.requestTimestamps = this.requestTimestamps.filter((timestamp) => timestamp >= windowStart);
    
    if (this.requestTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
      throw new Error('请求过于频繁，请稍后再试');
    }
    
    this.requestTimestamps.push(now);
  }

  private async callApi<T>(params: Record<string, string>): Promise<T> {
    this.registerRequest();
    const url = `${MUSIC_API_BASE}?${createSearchParams(params)}`;
    const response = await fetch(url, { cache: 'no-store' });
    
    if (!response.ok) {
      throw new Error('音乐服务暂时不可用');
    }
    
    return response.json() as Promise<T>;
  }

  async searchSongs(params: {
    source: string;
    name: string;
    count?: number;
    pages?: number;
  }): Promise<SearchApiItem[]> {
    const searchParams = {
      types: 'search',
      source: params.source,
      name: params.name,
      count: String(params.count || DEFAULT_SEARCH_COUNT),
      pages: String(params.pages || 1),
    };
    
    const result = await this.callApi<SearchApiItem[]>(searchParams);
    return Array.isArray(result) ? result : [];
  }

  async getSongUrl(params: {
    source: string;
    id: string;
    bitrate: BitrateOption;
  }): Promise<UrlApiResponse> {
    const urlParams = {
      types: 'url',
      source: params.source,
      id: params.id,
      br: String(params.bitrate),
    };
    
    return this.callApi<UrlApiResponse>(urlParams);
  }

  async getSongPic(params: {
    source: string;
    id: string;
    size?: string;
  }): Promise<PicApiResponse> {
    const picParams = {
      types: 'pic',
      source: params.source,
      id: params.id,
      size: params.size || DEFAULT_COVER_SIZE,
    };
    
    return this.callApi<PicApiResponse>(picParams);
  }

  async getSongLyric(params: {
    source: string;
    id: string;
  }): Promise<LyricApiResponse> {
    const lyricParams = {
      types: 'lyric',
      source: params.source,
      id: params.id,
    };
    
    return this.callApi<LyricApiResponse>(lyricParams);
  }
}

export const apiClient = new ApiClient();

export function selectBestSearchResult(results: SearchApiItem[], target: Track | LocalTrack): SearchApiItem | null {
  if (!results || results.length === 0) return null;

  const targetName = normalizeText(target.name);
  const targetArtists = collectArtistTokens(target.artist);

  let best = results[0];
  let bestScore = -Infinity;
  let bestIndex = 0;

  results.forEach((item, index) => {
    let score = 0;
    const itemName = normalizeText(item.name);
    const itemArtists = collectArtistTokens(item.artist);

    if (targetName && itemName === targetName) {
      score += 4;
    } else if (targetName && itemName.includes(targetName)) {
      score += 2;
    }

    if (targetArtists.length > 0 && itemArtists.length > 0) {
      const hit = itemArtists.some((token) => targetArtists.includes(token));
      if (hit) {
        score += 4;
      }
    }

    if (item.source && item.source === target.source) {
      score += 1;
    }

    if (score > bestScore || (score === bestScore && index < bestIndex)) {
      bestScore = score;
      best = item;
      bestIndex = index;
    }
  });

  return best ?? null;
}

// Helper function for URL search params
function createSearchParams(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

export async function resolveTrack(
  track: LocalTrack | Track, 
  desiredBitrate: BitrateOption,
  apiClient: ApiClient
): Promise<Track> {
  // If it's already a resolved track with the right bitrate, return it
  if ('url' in track && track.url && 'bitrate' in track && track.bitrate === desiredBitrate) {
    return track as Track;
  }

  const keyword = (track.keyword ?? `${track.name} ${track.artist ?? ''}`).trim();
  let trackId = track.trackId;
  let picId = track.picId;
  let lyricId = track.lyricId;
  let resolvedName = track.name;
  let resolvedAlbum = track.album;
  let resolvedArtist = track.artist;
  let lyricText = 'lyric' in track ? track.lyric ?? null : null;
  let translationText = 'tLyric' in track ? track.tLyric ?? null : null;

  if (!trackId) {
    if (!keyword) {
      throw new Error('未配置歌曲关键词');
    }
    
    const searchResults = await apiClient.searchSongs({
      source: track.source,
      name: keyword,
      count: DEFAULT_SEARCH_COUNT,
      pages: 1,
    });
    
    const list = Array.isArray(searchResults) ? searchResults : [];
    const best = selectBestSearchResult(list, track);
    
    if (!best) {
      throw new Error('未找到对应歌曲');
    }
    
    trackId = String(best.id);
    if (best.pic_id) {
      picId = String(best.pic_id);
    }
    if (best.lyric_id) {
      lyricId = String(best.lyric_id);
    }
    if (best.name) {
      resolvedName = best.name;
    }
    if (best.album) {
      resolvedAlbum = best.album;
    }
    const artistValue = best.artist;
    const artistText = Array.isArray(artistValue) ? artistValue.join(', ') : artistValue;
    if (artistText) {
      resolvedArtist = artistText;
    }
  }

  const urlData = await apiClient.getSongUrl({
    source: track.source,
    id: trackId,
    bitrate: desiredBitrate,
  });

  if (!urlData || !urlData.url) {
    throw new Error('未获取到播放链接');
  }

  const resolvedUrl = sanitizeUrl(urlData.url);
  let cover = 'cover' in track ? track.cover ?? null : null;

  // Get cover if picId is available
  if (picId) {
    try {
      const picData = await apiClient.getSongPic({
        source: track.source,
        id: picId,
        size: DEFAULT_COVER_SIZE,
      });
      
      if (picData && typeof picData.url === 'string' && picData.url.trim()) {
        cover = picData.url;
      }
    } catch {
      // ignore cover fetch failure
    }
  }

  // Get lyrics if not already available
  if (!lyricText && lyricId) {
    try {
      const lyricData = await apiClient.getSongLyric({
        source: track.source,
        id: lyricId,
      });
      
      if (lyricData) {
        if (typeof lyricData.lyric === 'string' && lyricData.lyric.trim()) {
          lyricText = lyricData.lyric;
        }
        if (typeof lyricData.tlyric === 'string' && lyricData.tlyric.trim()) {
          translationText = lyricData.tlyric;
        }
      }
    } catch {
      // ignore lyric fetch failure
    }
  }

  const fileSizeKb = typeof urlData.size === 'number' ? urlData.size : ('fileSizeKb' in track ? track.fileSizeKb ?? null : null);

  const resolvedTrack: Track = {
    ...track,
    url: resolvedUrl,
    trackId,
    picId,
    lyricId,
    cover,
    name: resolvedName,
    album: resolvedAlbum,
    artist: resolvedArtist,
    bitrate: desiredBitrate,
    lyric: lyricText,
    tLyric: translationText,
    fileSizeKb,
  };

  return resolvedTrack;
}