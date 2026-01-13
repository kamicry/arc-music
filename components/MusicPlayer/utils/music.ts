import { LyricLine } from '../types';

export function sanitizeUrl(url: string): string {
  return url.replace(/&amp;/g, '&');
}

export function normalizeText(value: string | undefined | null): string {
  if (!value) return '';
  return value
    .toLowerCase()
    .replace(/&amp;/g, '&')
    .replace(/[\s'"、，。！？!（）()【】\[\]《》“”‘’·._/\-]+/g, '');
}

export function collectArtistTokens(artist: string[] | string | undefined): string[] {
  if (!artist) return [];
  const raw = Array.isArray(artist) ? artist : [artist];
  return raw
    .flatMap((item) => item.split(/[,，/&、x×+·]|feat\.?|ft\.?|with|合作|合唱/gi))
    .map((token) => normalizeText(token))
    .filter(Boolean);
}

export function parseLyricLines(lyric: string | null | undefined): LyricLine[] {
  if (!lyric) return [];
  const result: LyricLine[] = [];
  const lines = lyric.split(/\r?\n/);
  const timeTagRegex = /\[(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?]/g;

  for (const line of lines) {
    const text = line.replace(timeTagRegex, '').trim();
    const matches = [...line.matchAll(timeTagRegex)];

    if (matches.length === 0) {
      if (text.length > 0) {
        result.push({ time: Infinity, text });
      }
      continue;
    }

    for (const match of matches) {
      const minutes = Number.parseInt((match[1] !== undefined) ? match[1] : '0', 10);
      const seconds = Number.parseInt((match[2] !== undefined) ? match[2] : '0', 10);
      const millisRaw = (match[3] !== undefined) ? match[3] : '0';
      const millis = Number.parseInt((millisRaw + '000').slice(0, 3), 10);
      const totalSeconds = minutes * 60 + seconds + millis / 1000;
      if (text.length > 0) {
        result.push({ time: totalSeconds, text });
      }
    }
  }

  return result
    .sort((a, b) => a.time - b.time)
    .reduce<LyricLine[]>((acc, current) => {
      if (acc.length === 0) {
        acc.push(current);
        return acc;
      }
      const prev = acc[acc.length - 1];
      if (prev.time === current.time && prev.text === current.text) {
        return acc;
      }
      acc.push(current);
      return acc;
    }, []);
}

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '00:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function createShareUrl(track: any, bitrate: number, source: string): string {
  const params = new URLSearchParams({
    trackId: track.trackId || '',
    name: track.name || '',
    artist: track.artist || '',
    album: track.album || '',
    bitrate: bitrate.toString(),
    source: source,
    id: track.id || ''
  });
  
  return `${typeof window !== 'undefined' ? window.location.origin : ''}/share?${params.toString()}`;
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'absolute';
    textArea.style.left = '-999999px';
    document.body.prepend(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    } finally {
      textArea.remove();
    }
  }
}