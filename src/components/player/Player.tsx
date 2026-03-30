'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { VideoPlayer } from './VideoPlayer';
import { ServerPanel } from './ServerPanel';
import { SettingsPanel } from './SettingsPanel';
import { LoadingOverlay } from './LoadingOverlay';
import { ToastContainer, ToastItem } from './Toast';
import { ShortcutHelp } from './ShortcutHelp';
import { WatchHistory } from './WatchHistory';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { usePlayerStore, ServerResponse, WatchHistoryItem } from '@/store/player-store';
import { Settings, Maximize, ChevronLeft, ChevronRight, Clock, Keyboard, Server } from 'lucide-react';

interface PlayerProps {
  initialSource: ServerResponse | null;
  servers: string[];
  mediaId: string;
  mediaType: 'movie' | 'tv';
  season?: string;
  episode?: string;
  title?: string;
  poster?: string;
  totalSeasons?: number;
  totalEpisodes?: number;
}

export function Player({
  initialSource,
  servers,
  mediaId,
  mediaType,
  season,
  episode,
  title,
  poster,
  totalSeasons,
  totalEpisodes,
}: PlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const {
    isLoading,
    loadingMessage,
    showSettings,
    toggleSettings,
    showServerPanel,
    toggleServerPanel,
    currentSource,
    setCurrentSource,
    setCurrentServer,
    setServerStatus,
    markServerFailed,
    setLoading,
    settings,
    updateSettings,
    addToHistory,
    getHistoryItem,
  } = usePlayerStore();

  // Read URL params and apply to settings on mount
  useEffect(() => {
    const autoPlay = searchParams.get('autoPlay');
    const autoSkip = searchParams.get('asi');

    const updates: Partial<typeof settings> = {};

    if (autoPlay === '1') updates.autoPlay = true;
    if (autoPlay === '0') updates.autoPlay = false;
    if (autoSkip === '1') updates.autoSkip = true;
    if (autoSkip === '0') updates.autoSkip = false;

    if (Object.keys(updates).length > 0) {
      updateSettings(updates);
    }
  }, [searchParams, updateSettings]);

  // Listen for postMessage from parent (auto-next control)
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data?.event === 'seek' && typeof data.time === 'number') {
          const video = containerRef.current?.querySelector('video');
          if (video) video.currentTime = data.time;
        }
        if (data?.event === 'pause') {
          const video = containerRef.current?.querySelector('video');
          if (video) video.pause();
        }
        if (data?.event === 'play') {
          const video = containerRef.current?.querySelector('video');
          if (video) video.play();
        }
      } catch {}
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const addToast = useCallback((message: string, type: ToastItem['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ✅ FIX: Call the VideoPlayer's switchServer function
  const handleServerSelect = useCallback(async (serverName: string): Promise<boolean> => {
    addToast(`Switching to ${serverName}...`, 'info');

    // Call the exposed switchServer function from VideoPlayer
    const switchFn = (window as any).__playerSwitchServer;
    if (switchFn) {
      const success = await switchFn(serverName);
      if (success) {
        addToast(`Connected to ${serverName}`, 'success');
        return true;
      } else {
        addToast(`${serverName} failed`, 'error');
        return false;
      }
    }

    return false;
  }, [addToast]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  }, []);

  const handleTogglePlayPause = useCallback(() => {
    const video = containerRef.current?.querySelector('video');
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
  }, []);

  const handleSeek = useCallback((seconds: number) => {
    const video = containerRef.current?.querySelector('video');
    if (!video) return;
    video.currentTime = Math.max(0, video.currentTime + seconds);
  }, []);

  const handleVolumeChange = useCallback((delta: number) => {
    const video = containerRef.current?.querySelector('video');
    if (!video) return;
    video.volume = Math.max(0, Math.min(1, video.volume + delta));
  }, []);

  const handleNextEpisode = useCallback(() => {
    if (!season || !episode) return;
    const nextEp = parseInt(episode) + 1;
    if (totalEpisodes && nextEp <= totalEpisodes) {
      window.location.href = `/tv/${mediaId}/${season}/${nextEp}`;
    }
  }, [season, episode, totalEpisodes, mediaId]);

  const handlePreviousEpisode = useCallback(() => {
    if (!season || !episode) return;
    const prevEp = parseInt(episode) - 1;
    if (prevEp >= 1) {
      window.location.href = `/tv/${mediaId}/${season}/${prevEp}`;
    }
  }, [season, episode, mediaId]);

  const handleHistorySelect = useCallback((item: WatchHistoryItem) => {
    setShowHistory(false);
    if (item.type === 'movie') {
      window.location.href = `/movie/${item.id}`;
    } else {
      window.location.href = `/tv/${item.id}/${item.season}/${item.episode}`;
    }
  }, []);

  useKeyboardShortcuts({
    onToggleFullscreen: toggleFullscreen,
    onTogglePlayPause: handleTogglePlayPause,
    onSeek: handleSeek,
    onVolumeChange: handleVolumeChange,
    onNextEpisode: mediaType === 'tv' ? handleNextEpisode : undefined,
    onPreviousEpisode: mediaType === 'tv' ? handlePreviousEpisode : undefined,
    onOpenSettings: toggleSettings,
    onOpenServerPanel: toggleServerPanel,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !showSettings) {
        setShowShortcuts(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSettings]);

  const subtitles = currentSource?.sources?.[0]?.subtitles || [];

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col w-full h-full bg-player-bg"
    >
      {/* Video Player */}
      <div ref={playerRef} className="relative flex-1 min-h-0">
        <VideoPlayer
          initialSource={initialSource}
          servers={servers}
          mediaId={mediaId}
          mediaType={mediaType}
          season={season}
          episode={episode}
          title={title}
          poster={poster}
        />

        {/* ✅ Loading Overlay with poster background */}
        <LoadingOverlay visible={isLoading} message={loadingMessage} poster={poster} />

        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 z-30 p-4 bg-gradient-to-b from-black/80 to-transparent opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {title && (
                <h1 className="text-lg font-semibold text-white">{title}</h1>
              )}
              {mediaType === 'tv' && season && episode && (
                <span className="text-sm text-gray-400">
                  S{season} E{episode}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistory(true)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Watch History"
              >
                <Clock className="w-5 h-5" />
              </button>

              <button
                onClick={() => setShowShortcuts(true)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Keyboard Shortcuts (?)"
              >
                <Keyboard className="w-5 h-5" />
              </button>

              <button
                onClick={toggleServerPanel}
                className={`p-2 rounded-lg transition-colors ${showServerPanel ? 'bg-player-accent text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                title="Servers"
              >
                <Server className="w-5 h-5" />
              </button>

              <button
                onClick={toggleSettings}
                className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-player-accent text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                title="Settings (S)"
              >
                <Settings className="w-5 h-5" />
              </button>

              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Fullscreen (F)"
              >
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Episode Navigation */}
        {mediaType === 'tv' && (
          <div className="absolute bottom-24 left-4 right-4 z-30 flex justify-between opacity-0 hover:opacity-100 transition-opacity duration-300">
            {parseInt(episode || '0') > 1 && (
              <button
                onClick={handlePreviousEpisode}
                className="flex items-center gap-2 px-4 py-2 bg-black/70 hover:bg-black/90 rounded-lg text-sm text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
            )}
            {totalEpisodes && parseInt(episode || '0') < totalEpisodes && (
              <button
                onClick={handleNextEpisode}
                className="flex items-center gap-2 px-4 py-2 bg-black/70 hover:bg-black/90 rounded-lg text-sm text-white transition-colors ml-auto"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <SettingsPanel
          subtitles={subtitles}
          onSubtitleChange={(url) => {}}
        />

        <ServerPanel servers={servers} onServerSelect={handleServerSelect} />
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <ShortcutHelp
        visible={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      <WatchHistory
        visible={showHistory}
        onClose={() => setShowHistory(false)}
        onSelect={handleHistorySelect}
      />
    </div>
  );
}
