import type { NextApiRequest, NextApiResponse } from 'next';
import { LOCAL_TRACKS } from '../../data/localTracks';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json(LOCAL_TRACKS);
}
