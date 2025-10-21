import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export type ServerTrack = {
  id: number;
  name: string;
  url: string;
};

const SUPPORTED_EXTENSIONS = new Set(['.mp3', '.m4a', '.flac', '.wav', '.ogg']);

export default function handler(req: NextApiRequest, res: NextApiResponse<ServerTrack[] | { error: string }>) {
  try {
    const baseDir = process.env.MUSIC_DIR
      ? path.resolve(process.env.MUSIC_DIR)
      : path.join(process.cwd(), 'public', 'music');

    if (!fs.existsSync(baseDir)) {
      // If the directory doesn't exist, return empty list
      return res.status(200).json([]);
    }

    const files = fs.readdirSync(baseDir, { withFileTypes: true });

    const tracks: ServerTrack[] = files
      .filter((entry) => entry.isFile() && SUPPORTED_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
      .map((entry, idx) => {
        const name = path.parse(entry.name).name;
        const urlPath = `/music/${encodeURIComponent(entry.name)}`;
        return {
          id: idx + 1,
          name,
          url: urlPath,
        };
      });

    res.status(200).json(tracks);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to scan music directory' });
  }
}
