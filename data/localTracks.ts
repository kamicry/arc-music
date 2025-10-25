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

export const LOCAL_TRACKS: LocalTrack[] = [
    {
        "id": 1867150097,
        "name": "夏霞",
        "artist": "あたらよ",
        "album": "夏霞",
        "source": "netease",
        "url_id": 1867150097,
        "pic_id": "109951166253940594",
        "lyric_id": 1867150097,
        "pic": null,
        "url": null
    },
    {
        "id": 1835951859,
        "name": "Avid",
        "artist": "SawanoHiroyuki[nZk], 瑞葵(mizuki)",
        "album": "Avid / Hands Up to the Sky",
        "source": "netease",
        "url_id": 1835951859,
        "pic_id": "109951166004106688",
        "lyric_id": 1835951859,
        "pic": null,
        "url": null
    },
    {
        "id": 554245242,
        "name": "Cage",
        "artist": "Tielle, SawanoHiroyuki[nZk]",
        "album": "Binary Star/Cage",
        "source": "netease",
        "url_id": 554245242,
        "pic_id": "109951166200369055",
        "lyric_id": 554245242,
        "pic": null,
        "url": null
    },
    {
        "id": 2051328176,
        "name": "僕らはそれを愛と呼んだ",
        "artist": "あたらよ",
        "album": "僕らはそれを愛と呼んだ",
        "source": "netease",
        "url_id": 2051328176,
        "pic_id": "109951168645551891",
        "lyric_id": 2051328176,
        "pic": null,
        "url": null
    }
];
