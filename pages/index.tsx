//// pages/index.tsx
import React from 'react';
import MusicPlayer from '../components/MusicPlayer';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900">
      <MusicPlayer />
    </div>
  );
}
