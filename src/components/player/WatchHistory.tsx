'use client';

import { usePlayerStore, WatchHistoryItem } from '@/store/player-store';
import { Clock, Trash2, Play, Film, Tv } from 'lucide-react';

interface WatchHistoryProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (item: WatchHistoryItem) => void;
}

export function WatchHistory({ visible, onClose, onSelect }: WatchHistoryProps) {
  const { watchHistory, clearHistory } = usePlayerStore();

  if (!visible) return null;

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getProgress = (item: WatchHistoryItem): number => {
    if (!item.duration) return 0;
    return (item.currentTime / item.duration) * 100;
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-player-surface border border-player-border rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-player-border bg-player-bg">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-player-accent" />
            <h2 className="text-lg font-semibold text-white">Watch History</h2>
            <span className="text-xs text-gray-500 bg-player-surface px-2 py-0.5 rounded-full">
              {watchHistory.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {watchHistory.length > 0 && (
              <button
                onClick={clearHistory}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh]">
          {watchHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Clock className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-lg font-medium">No watch history</p>
              <p className="text-sm text-gray-500 mt-1">Your recently watched content will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-player-border">
              {watchHistory.map((item) => (
                <button
                  key={`${item.id}-${item.timestamp}`}
                  onClick={() => onSelect(item)}
                  className="w-full flex items-start gap-4 p-4 hover:bg-white/5 transition-colors text-left"
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-player-bg flex items-center justify-center">
                    {item.type === 'movie' ? (
                      <Film className="w-6 h-6 text-player-accent" />
                    ) : (
                      <Tv className="w-6 h-6 text-player-accent" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white truncate">
                        {item.title || `ID: ${item.id}`}
                      </h3>
                      {item.type === 'tv' && item.season && item.episode && (
                        <span className="text-xs text-gray-500">
                          S{item.season}E{item.episode}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Play className="w-3 h-3" />
                        {formatTime(item.currentTime)} / {formatTime(item.duration)}
                      </span>
                      <span>{formatDate(item.timestamp)}</span>
                      <span className="text-player-accent">{item.server}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-2 h-1 bg-player-bg rounded-full overflow-hidden">
                      <div
                        className="h-full bg-player-accent rounded-full transition-all"
                        style={{ width: `${getProgress(item)}%` }}
                      />
                    </div>
                  </div>

                  {/* Progress Percentage */}
                  <div className="flex-shrink-0 text-xs text-gray-500">
                    {Math.round(getProgress(item))}%
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
