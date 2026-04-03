'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Film, Tv, Play, Github, Clock, ChevronRight } from 'lucide-react';
import { usePlayerStore, WatchHistoryItem } from '@/store/player-store';

export default function HomePage() {
  const router = useRouter();
  const { watchHistory } = usePlayerStore();
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('tv');
  const [id, setId] = useState('1396');
  const [season, setSeason] = useState('1');
  const [episode, setEpisode] = useState('1');

  const handlePlay = () => {
    if (!id.trim()) return;

    if (mediaType === 'movie') {
      router.push(`/movie/${id}`);
    } else {
      router.push(`/tv/${id}/${season}/${episode}`);
    }
  };

  const handleHistorySelect = (item: WatchHistoryItem) => {
    if (item.type === 'movie') {
      router.push(`/movie/${item.id}`);
    } else {
      router.push(`/tv/${item.id}/${item.season}/${item.episode}`);
    }
  };

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getProgress = (item: WatchHistoryItem): number => {
    if (!item.duration) return 0;
    return (item.currentTime / item.duration) * 100;
  };

  return (
    <main className="min-h-screen film-strip-bg flex flex-col relative">
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 via-transparent to-transparent pointer-events-none"></div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b-2 border-zinc-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {/* FMovies4U Logo */}
              <svg width="140" height="40" viewBox="0 0 180 50" xmlns="http://www.w3.org/2000/svg" className="w-36 h-10">
                <rect x="0" y="0" width="180" height="50" fill="#000000" rx="6"></rect>
                <rect x="2" y="2" width="176" height="46" fill="#0A0A0A" rx="5"></rect>
                <rect x="5" y="8" width="3" height="3" fill="#1a1a1a"></rect>
                <rect x="5" y="15" width="3" height="3" fill="#1a1a1a"></rect>
                <rect x="5" y="22" width="3" height="3" fill="#1a1a1a"></rect>
                <rect x="5" y="29" width="3" height="3" fill="#1a1a1a"></rect>
                <rect x="5" y="36" width="3" height="3" fill="#1a1a1a"></rect>
                <rect x="172" y="8" width="3" height="3" fill="#1a1a1a"></rect>
                <rect x="172" y="15" width="3" height="3" fill="#1a1a1a"></rect>
                <rect x="172" y="22" width="3" height="3" fill="#1a1a1a"></rect>
                <rect x="172" y="29" width="3" height="3" fill="#1a1a1a"></rect>
                <rect x="172" y="36" width="3" height="3" fill="#1a1a1a"></rect>
                <text x="20" y="32" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="bold" fill="#ffffff">
                  FMovies<tspan fill="#e11d48">4U</tspan>
                </text>
                <circle cx="150" cy="25" r="10" fill="#1a1a1a" stroke="#333" strokeWidth="1.5"></circle>
                <path d="M148 21 L148 29 L155 25 Z" fill="#e11d48"></path>
              </svg>
            </div>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <Github className="w-6 h-6" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 pt-20 pb-6 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Premium Badge */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black border border-zinc-800 text-zinc-400 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-400"></span>
              </span>
              Premium Embedding Solution
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Play Form */}
            <div className="lg:col-span-2">
              <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Start Watching</h2>

                {/* Media Type Tabs */}
                <div className="flex justify-center mb-6">
                  <div className="inline-flex h-11 items-center justify-center rounded-lg bg-black p-1 border border-zinc-900 gap-1">
                    <button
                      onClick={() => setMediaType('movie')}
                      className={`
                        inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all w-32
                        ${mediaType === 'movie'
                          ? 'bg-black text-white'
                          : 'text-zinc-500 hover:text-white hover:bg-zinc-950'
                        }
                      `}
                    >
                      Movie
                    </button>
                    <div className="h-8 w-px bg-gradient-to-b from-transparent via-zinc-700 to-transparent"></div>
                    <button
                      onClick={() => setMediaType('tv')}
                      className={`
                        inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all w-32
                        ${mediaType === 'tv'
                          ? 'bg-black text-white'
                          : 'text-zinc-500 hover:text-white hover:bg-zinc-950'
                        }
                      `}
                    >
                      Series
                    </button>
                  </div>
                </div>

                {/* Form Inputs */}
                <div className="space-y-4">
                  {/* ID Input */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                      TMDb {mediaType === 'movie' ? 'Movie' : 'TV'} ID
                    </label>
                    <input
                      type="text"
                      value={id}
                      onChange={(e) => setId(e.target.value)}
                      placeholder={mediaType === 'movie' ? 'e.g. 533535' : 'e.g. 1396'}
                      onKeyDown={(e) => e.key === 'Enter' && handlePlay()}
                      className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-lg text-white text-center placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-all"
                    />
                    <p className="mt-1 text-xs text-zinc-500 text-center">
                      Example: {mediaType === 'movie' ? '533535 (Deadpool & Wolverine)' : '1396 (Breaking Bad)'}
                    </p>
                  </div>

                  {/* Season & Episode (TV Only) */}
                  {mediaType === 'tv' && (
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                          Season
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={season}
                          onChange={(e) => setSeason(e.target.value)}
                          className="w-full px-3 py-3 bg-black border border-zinc-800 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-all"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                          Episode
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={episode}
                          onChange={(e) => setEpisode(e.target.value)}
                          className="w-full px-3 py-3 bg-black border border-zinc-800 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-all"
                        />
                      </div>
                    </div>
                  )}

                  {/* Play Button */}
                  <button
                    onClick={handlePlay}
                    disabled={!id.trim()}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-player-accent hover:bg-player-accent-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-semibold transition-all shadow-lg shadow-player-accent/20 hover:shadow-player-accent/30"
                  >
                    <Play className="w-5 h-5" fill="white" />
                    Play Now
                  </button>
                </div>
              </div>

              {/* Features Grid */}
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: '🎬', title: 'Multi-Server', desc: 'Auto fallback' },
                  { icon: '⌨️', title: 'Shortcuts', desc: 'Full control' },
                  { icon: '💾', title: 'History', desc: 'Resume watch' },
                  { icon: '📱', title: 'Mobile', desc: 'Responsive' },
                ].map((feature, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center text-center p-4 bg-zinc-950 border border-zinc-900 rounded-lg"
                  >
                    <span className="text-2xl mb-1">{feature.icon}</span>
                    <h3 className="font-medium text-white text-sm">{feature.title}</h3>
                    <p className="text-xs text-zinc-500">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Watch History Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-zinc-900">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-player-accent" />
                    <h2 className="font-semibold text-white text-sm">Continue Watching</h2>
                  </div>
                  {watchHistory.length > 0 && (
                    <span className="text-xs text-zinc-500 bg-black px-2 py-0.5 rounded-full">
                      {watchHistory.length}
                    </span>
                  )}
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {watchHistory.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500">
                      <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No watch history yet</p>
                      <p className="text-xs mt-1 text-zinc-600">Start watching to see history</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-900">
                      {watchHistory.slice(0, 10).map((item) => (
                        <button
                          key={`${item.id}-${item.timestamp}`}
                          onClick={() => handleHistorySelect(item)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-zinc-900/50 transition-colors text-left group"
                        >
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-black flex items-center justify-center border border-zinc-900">
                            {item.type === 'movie' ? (
                              <Film className="w-5 h-5 text-player-accent" />
                            ) : (
                              <Tv className="w-5 h-5 text-player-accent" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-medium text-white truncate">
                                {item.title || `ID: ${item.id}`}
                              </h3>
                              {item.type === 'tv' && item.season && item.episode && (
                                <span className="text-xs text-zinc-500 flex-shrink-0">
                                  S{item.season}E{item.episode}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-zinc-500 block mt-0.5">
                              {formatTime(item.currentTime)} / {formatTime(item.duration)}
                            </span>
                            {/* Progress Bar */}
                            <div className="mt-1.5 h-1 bg-black rounded-full overflow-hidden">
                              <div
                                className="h-full bg-player-accent rounded-full transition-all"
                                style={{ width: `${getProgress(item)}%` }}
                              />
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Tips */}
              <div className="mt-4 p-4 bg-zinc-950 border border-zinc-900 rounded-xl">
                <h3 className="text-sm font-medium text-white mb-3">Keyboard Shortcuts</h3>
                <div className="space-y-2 text-xs text-zinc-400">
                  <div className="flex items-center justify-between">
                    <span>Play/Pause</span>
                    <kbd className="px-2 py-0.5 bg-black border border-zinc-800 rounded text-zinc-300">Space</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Fullscreen</span>
                    <kbd className="px-2 py-0.5 bg-black border border-zinc-800 rounded text-zinc-300">F</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Seek ±10s</span>
                    <kbd className="px-2 py-0.5 bg-black border border-zinc-800 rounded text-zinc-300">← →</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>All shortcuts</span>
                    <kbd className="px-2 py-0.5 bg-black border border-zinc-800 rounded text-zinc-300">?</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-6 bg-zinc-950 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs text-zinc-500">© 2025 FMovies4U. All rights reserved.</p>
            <p className="text-xs text-zinc-600 mt-2">Built with Next.js & Vidstack</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
