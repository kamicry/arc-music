//// pages/index.tsx
import React from 'react';
import MusicPlayer from '../components/MusicPlayer';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 to-blue-100">
      <MusicPlayer />
    </div>
  );
}
