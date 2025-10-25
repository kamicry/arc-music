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
    id: 'netease-26060065',
    name: 'Counting Stars',
    artist: 'OneRepublic',
    album: 'Native (Deluxe Version)',
    duration: '4:17',
    source: 'netease',
    keyword: 'Counting Stars OneRepublic',
    trackId: '26060065',
    picId: '109951170517214706',
    lyricId: '26060065',
    bitrate: 320,
  },
  {
    id: 'netease-455311479',
    name: 'Believer',
    artist: 'Imagine Dragons',
    album: 'Evolve',
    duration: '3:24',
    source: 'netease',
    keyword: 'Believer Imagine Dragons',
    trackId: '455311479',
    picId: '18990764835137467',
    lyricId: '455311479',
    bitrate: 320,
  },
  {
    id: 'netease-36990266',
    name: 'Faded',
    artist: 'Alan Walker',
    album: 'Faded',
    duration: '3:32',
    source: 'netease',
    keyword: 'Faded Alan Walker',
    trackId: '36990266',
    picId: '109951165976856263',
    lyricId: '36990266',
    bitrate: 320,
  },
  {
    id: 'netease-1406633327',
    name: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'Blinding Lights',
    duration: '3:20',
    source: 'netease',
    keyword: 'Blinding Lights The Weeknd',
    trackId: '1406633327',
    picId: '109951165370121751',
    lyricId: '1406633327',
    bitrate: 320,
  },
  {
    id: 'netease-32507038',
    name: '演员',
    artist: '薛之谦',
    album: '绅士',
    duration: '4:25',
    source: 'netease',
    keyword: '演员 薛之谦',
    trackId: '32507038',
    picId: '109951168707343730',
    lyricId: '32507038',
    bitrate: 320,
  },
  {
    id: 'netease-483671599',
    name: '追光者',
    artist: '岑宁儿',
    album: '夏至未至 影视原声带',
    duration: '4:08',
    source: 'netease',
    keyword: '追光者 岑宁儿',
    trackId: '483671599',
    picId: '19149094509535913',
    lyricId: '483671599',
    bitrate: 320,
  },
  {
    id: 'kuwo-440613',
    name: '稻香',
    artist: '周杰伦',
    album: '魔杰座',
    duration: '4:44',
    source: 'kuwo',
    keyword: '稻香 周杰伦',
    trackId: '440613',
    picId: '120/s4s0/93/1794217775.jpg',
    lyricId: '440613',
    bitrate: 320,
  },
  {
    id: 'joox-Frg3HWBwnkFfslSYGv9NGA',
    name: 'Shape of You',
    artist: 'Ed Sheeran',
    album: 'Shape of You',
    duration: '3:53',
    source: 'joox',
    keyword: 'Shape of You Ed Sheeran',
    trackId: 'Frg3HWBwnkFfslSYGv9NGA==',
    picId: 'Frg3HWBwnkFfslSYGv9NGA==',
    lyricId: 'Frg3HWBwnkFfslSYGv9NGA==',
    bitrate: 320,
  },
];
