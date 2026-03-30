'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { VideoPlayer } from './VideoPlayer';
import { ServerPanel } from './ServerPanel';
import { SettingsPanel } from './SettingsPanel';
import { LoadingOverlay } from './LoadingOverlay';
import { ToastContainer, ToastItem } from './Toast';
import { ShortcutHelp } from './ShortcutHelp';
import { WatchHistory } from './WatchHistory';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { usePlayerStore, ServerResponse, WatchHistoryItem } from '@/store/player-store';
import { Settings, Info, Maximize, ChevronLeft, ChevronRight, Clock, Keyboard, Server } from 'lucide-react';

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
    addToHistory,
    getHistoryItem,
  } = usePlayerStore();

  const addToast = useCallback((message: string, type: ToastItem['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const fetchSource = useCallback(async (serverName: string): Promise<ServerResponse | null> => {
    const path = mediaType === 'movie'
      ? `/api/movie/${mediaId}/${encodeURIComponent(serverName)}`
      : `/api/tv/${mediaId}/${season}/${episode}/${encodeURIComponent(serverName)}`;

    try {
      const res = await fetch(path);
      if (!res.ok) return null;
      const data = await res.json();
      if (!data?.sources?.[0]?.url) return null;
      return data;
    } catch {
      return null;
    }
  }, [mediaId, mediaType, season, episode]);

  const handleServerSelect = useCallback(async (serverName: string): Promise<boolean> => {
    setServerStatus(serverName, 'loading');
    setLoading(true, `Connecting to ${serverName}...`);
    addToast(`Switching to ${serverName}...`, 'info');

    const source = await fetchSource(serverName);

    if (source) {
      setCurrentSource(source);
      setCurrentServer(serverName);
      setLoading(false);
      addToast(`Connected to ${serverName}`, 'success');
      return true;
    } else {
      markServerFailed(serverName);
      setLoading(false);
      addToast(`${serverName} failed`, 'error');
      return false;
    }
  }, [fetchSource, setCurrentSource, setCurrentServer, setServerStatus, markServerFailed, setLoading, addToast]);

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

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
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

  // Keyboard shortcuts
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

  // Global keyboard listener for help
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

        {/* Loading Overlay */}
        <LoadingOverlay visible={isLoading} message={loadingMessage} />

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
              {/* History Button */}
              <button
                onClick={() => setShowHistory(true)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Watch History"
              >
                <Clock className="w-5 h-5" />
              </button>

              {/* Keyboard Shortcuts */}
              <button
                onClick={() => setShowShortcuts(true)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Keyboard Shortcuts (?)"
              >
                <Keyboard className="w-5 h-5" />
              </button>

             {/* Server Panel */}
              <button
                onClick={toggleServerPanel}
                className={`
                  p-2 rounded-lg transition-colors
                  ${showServerPanel ? 'bg-player-accent text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}
                  `}
                    title="Servers"
                      >
                  <Server className="w-5 h-5" />
                      </button>


            
            
              
              {/* Settings */}
              <button
                onClick={toggleSettings}
                className={`
                  p-2 rounded-lg transition-colors
                  ${showSettings ? 'bg-player-accent text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}
                `}
                title="Settings (S)"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* Fullscreen */}
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

        {/* Episode Navigation (TV Shows) */}
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

        {/* Settings Panel */}
        <SettingsPanel
          subtitles={subtitles}
          onSubtitleChange={(url) => {
            // Handle subtitle change
          }}
        />
      </div>

      {/* Server Panel */}
      <ServerPanel servers={servers} onServerSelect={handleServerSelect} />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Keyboard Shortcuts Modal */}
      <ShortcutHelp
        visible={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Watch History Modal */}
      <WatchHistory
        visible={showHistory}
        onClose={() => setShowHistory(false)}
        onSelect={handleHistorySelect}
      />
    </div>
  );
}
