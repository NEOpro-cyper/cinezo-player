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
    const color = searchParams.get('color');

    const updates: Partial<typeof settings> = {};

    if (autoPlay === '1') updates.autoPlay = true;
    if (autoPlay === '0') updates.autoPlay = false;
    if (autoSkip === '1') updates.autoSkip = true;
    if (autoSkip === '0') updates.autoSkip = false;

    if (Object.keys(updates).length > 0) {
      updateSettings(updates);
    }

    // Apply custom accent color from URL param
    if (color) {
      const hex = color.startsWith('#') ? color : `#${color}`;
      document.documentElement.style.setProperty('--player-accent', hex);
      document.documentElement.style.setProperty('--media-brand', hex);
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

  useEffect(() => {
    (window as any).__playerToggleHistory = () => setShowHistory(prev => !prev);
    (window as any).__playerToggleShortcuts = () => setShowShortcuts(prev => !prev);
    (window as any).__playerToggleServers = () => toggleServerPanel();

    return () => {
      delete (window as any).__playerToggleHistory;
      delete (window as any).__playerToggleShortcuts;
      delete (window as any).__playerToggleServers;
    };
  }, []);

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

        {/* Loading Overlay with poster background */}
        <LoadingOverlay visible={isLoading} message={loadingMessage} poster={poster} />

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
