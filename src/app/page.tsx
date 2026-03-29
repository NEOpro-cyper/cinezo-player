'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Film, Tv, Play, Github, Clock, ChevronRight, X } from 'lucide-react';
import { usePlayerStore, WatchHistoryItem } from '@/store/player-store';

export default function HomePage() {
  const router = useRouter();
  const { watchHistory } = usePlayerStore();
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');
  const [id, setId] = useState('533535');
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
    <main className="min-h-screen bg-player-bg flex flex-col">
      {/* Header */}
      <header className="p-6 border-b border-player-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-player-accent to-purple-600 flex items-center justify-center shadow-lg shadow-player-accent/20">
              <Play className="w-5 h-5 text-white" fill="white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">CineZo Player</h1>
              <p className="text-xs text-gray-500">Elegant streaming experience</p>
            </div>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Github className="w-6 h-6" />
          </a>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
          {/* Play Form */}
          <div className="lg:col-span-2">
            <div className="bg-player-surface border border-player-border rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Start Watching</h2>

              {/* Media Type Selector */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setMediaType('movie')}
                  className={`
                    flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all
                    ${mediaType === 'movie'
                      ? 'bg-player-accent border-player-accent text-white'
                      : 'border-player-border text-gray-400 hover:border-player-accent hover:text-white'
                    }
                  `}
                >
                  <Film className="w-5 h-5" />
                  Movie
                </button>
                <button
                  onClick={() => setMediaType('tv')}
                  className={`
                    flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all
                    ${mediaType === 'tv'
                      ? 'bg-player-accent border-player-accent text-white'
                      : 'border-player-border text-gray-400 hover:border-player-accent hover:text-white'
                    }
                  `}
                >
                  <Tv className="w-5 h-5" />
                  TV Show
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* ID Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    {mediaType === 'movie' ? 'Movie ID' : 'TV Show ID'}
                  </label>
                  <input
                    type="text"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    placeholder="Enter TMDB ID"
                    onKeyDown={(e) => e.key === 'Enter' && handlePlay()}
                    className="w-full px-4 py-3 bg-player-bg border border-player-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-player-accent focus:ring-1 focus:ring-player-accent transition-all"
                  />
                  <p className="mt-1 text-xs text-gray-500">Example: 533535 (Deadpool & Wolverine)</p>
                </div>

                {/* Season & Episode (TV Only) */}
                {mediaType === 'tv' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Season
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={season}
                        onChange={(e) => setSeason(e.target.value)}
                        className="w-full px-4 py-3 bg-player-bg border border-player-border rounded-xl text-white focus:outline-none focus:border-player-accent focus:ring-1 focus:ring-player-accent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Episode
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={episode}
                        onChange={(e) => setEpisode(e.target.value)}
                        className="w-full px-4 py-3 bg-player-bg border border-player-border rounded-xl text-white focus:outline-none focus:border-player-accent focus:ring-1 focus:ring-player-accent transition-all"
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

            {/* Features */}
            <div className="mt-6 grid sm:grid-cols-2 gap-4">
              {[
                { icon: '🎬', title: 'Multi-Server', desc: 'Auto fallback support' },
                { icon: '⌨️', title: 'Keyboard Shortcuts', desc: 'Full control via keyboard' },
                { icon: '💾', title: 'Watch History', desc: 'Resume where you left' },
                { icon: '📱', title: 'Mobile Ready', desc: 'Responsive design' },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-4 bg-player-surface border border-player-border rounded-xl"
                >
                  <span className="text-2xl">{feature.icon}</span>
                  <div>
                    <h3 className="font-medium text-white">{feature.title}</h3>
                    <p className="text-xs text-gray-500">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Watch History Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-player-surface border border-player-border rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-player-border">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-player-accent" />
                  <h2 className="font-semibold text-white">Continue Watching</h2>
                </div>
                {watchHistory.length > 0 && (
                  <span className="text-xs text-gray-500 bg-player-bg px-2 py-0.5 rounded-full">
                    {watchHistory.length}
                  </span>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {watchHistory.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No watch history yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-player-border">
                    {watchHistory.slice(0, 10).map((item) => (
                      <button
                        key={`${item.id}-${item.timestamp}`}
                        onClick={() => handleHistorySelect(item)}
                        className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left group"
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-player-bg flex items-center justify-center">
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
                              <span className="text-xs text-gray-500">
                                S{item.season}E{item.episode}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">
                              {formatTime(item.currentTime)} / {formatTime(item.duration)}
                            </span>
                          </div>
                          {/* Progress Bar */}
                          <div className="mt-1.5 h-1 bg-player-bg rounded-full overflow-hidden">
                            <div
                              className="h-full bg-player-accent rounded-full"
                              style={{ width: `${getProgress(item)}%` }}
                            />
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Keyboard Shortcuts Hint */}
            <div className="mt-4 p-4 bg-player-surface border border-player-border rounded-xl">
              <h3 className="text-sm font-medium text-white mb-2">Quick Tips</h3>
              <div className="space-y-2 text-xs text-gray-400">
                <p><kbd className="px-1.5 py-0.5 bg-player-bg rounded text-gray-300">Space</kbd> Play/Pause</p>
                <p><kbd className="px-1.5 py-0.5 bg-player-bg rounded text-gray-300">F</kbd> Fullscreen</p>
                <p><kbd className="px-1.5 py-0.5 bg-player-bg rounded text-gray-300">← →</kbd> Seek</p>
                <p><kbd className="px-1.5 py-0.5 bg-player-bg rounded text-gray-300">?</kbd> All shortcuts</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="p-6 border-t border-player-border text-center text-gray-500 text-sm">
        <p>CineZo Player • Built with Next.js & Vidstack</p>
      </footer>
    </main>
  );
}
