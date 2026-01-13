export type MusicSource = 'netease' | 'kuwo' | 'joox';

export type LocalTrack = {
  id: string;
  name: string;
  artist?: string;
  album?: string;
  duration?: string;
  source: MusicSource;
  keyword?: string;
  trackId?: string;
  picId?: string;
  lyricId?: string;
  bitrate?: 128 | 192 | 320 | 740 | 999;
};

export type Track = LocalTrack & {
  url?: string;
  cover?: string | null;
  lyric?: string | null;
  tLyric?: string | null;
  fileSizeKb?: number | null;
};

export type BitrateOption = 128 | 192 | 320 | 740 | 999;

export const BITRATE_OPTIONS = [128, 192, 320, 740, 999] as const;

export const AVAILABLE_SOURCES: { value: MusicSource; label: string }[] = [
  { value: 'netease', label: '网易云' },
  { value: 'kuwo', label: '酷我' },
  { value: 'joox', label: 'JOOX' },
];

export type PlaybackMode = 'order' | 'single' | 'shuffle';

export type LyricLine = {
  time: number;
  text: string;
};

export type SearchApiItem = {
  id: number | string;
  name?: string;
  artist?: string[] | string;
  album?: string;
  pic_id?: string;
  lyric_id?: string;
  source?: string;
};

export type UrlApiResponse = {
  url?: string;
  br?: number;
  size?: number;
};

export type PicApiResponse = {
  url?: string;
};

export type LyricApiResponse = {
  lyric?: string | null;
  tlyric?: string | null;
};