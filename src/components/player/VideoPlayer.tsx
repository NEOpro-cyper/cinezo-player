'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { MediaPlayer, MediaProvider } from '@vidstack/react';
import {
  defaultLayoutIcons,
  DefaultVideoLayout,
} from '@vidstack/react/player/layouts/default';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import { usePlayerStore, ServerResponse } from '@/store/player-store';

interface VideoPlayerProps {
  initialSource: ServerResponse | null;
  servers: string[];
  mediaId: string;
  mediaType: 'movie' | 'tv';
  season?: string;
  episode?: string;
  title?: string;
  poster?: string;
}

export function VideoPlayer({
  initialSource,
  servers,
  mediaId,
  mediaType,
  season,
  episode,
  title,
  poster,
}: VideoPlayerProps) {
  const playerRef = useRef<React.ElementRef<typeof MediaPlayer>>(null);
  
  // ✅ CRITICAL: Track timestamp for server switches
  const savedTimeRef = useRef<number>(0);
  const isServerSwitchRef = useRef<boolean>(false);
  const hasRestoredTimeRef = useRef<boolean>(false);

  const {
    currentSource,
    setCurrentSource,
    setCurrentServer,
    setServerStatus,
    markServerFailed,
    setLoading,
    setError,
    settings,
    setVolume,
    setMuted,
    addToHistory,
    updateHistoryProgress,
    getHistoryItem,
  } = usePlayerStore();

  // Initialize with initial source
  useEffect(() => {
    if (initialSource) {
      setCurrentSource(initialSource);
      setCurrentServer(initialSource.server);
    }
    setLoading(false);
  }, [initialSource, setCurrentSource, setCurrentServer, setLoading]);

  // ✅ Save current time BEFORE source changes
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const handleBeforeUnload = () => {
      savedTimeRef.current = player.currentTime ?? 0;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // ✅ Track time continuously for server switches
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current && !isServerSwitchRef.current) {
        savedTimeRef.current = playerRef.current.currentTime ?? 0;
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Save progress periodically
  useEffect(() => {
    const saveProgress = () => {
      const player = playerRef.current;
      if (!player || !currentSource) return;

      const currentTime = player.currentTime ?? 0;
      const duration = player.duration ?? 0;

      if (currentTime > 0 && duration > 0) {
        addToHistory({
          id: mediaId,
          type: mediaType,
          title,
          poster,
          currentTime,
          duration,
          server: currentSource.server,
          season: season ? parseInt(season) : undefined,
          episode: episode ? parseInt(episode) : undefined,
        });
      }
    };

    const interval = setInterval(saveProgress, 10000);
    return () => clearInterval(interval);
  }, [mediaId, mediaType, title, poster, currentSource, season, episode, addToHistory]);

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

  const switchServer = useCallback(async (serverName: string) => {
    // ✅ Save current time BEFORE switching
    if (playerRef.current) {
      savedTimeRef.current = playerRef.current.currentTime ?? 0;
      isServerSwitchRef.current = true;
    }

    setServerStatus(serverName, 'loading');
    setLoading(true, `Connecting to ${serverName}...`);

    const source = await fetchSource(serverName);

    if (source) {
      setCurrentSource(source);
      setCurrentServer(serverName);
      // Don't set loading false here - let canPlay do it
      return true;
    } else {
      markServerFailed(serverName);
      setLoading(false);
      isServerSwitchRef.current = false;
      return false;
    }
  }, [fetchSource, setCurrentSource, setCurrentServer, setServerStatus, markServerFailed, setLoading]);

  const handlePlayerError = useCallback(async () => {
    if (currentSource?.server) {
      markServerFailed(currentSource.server);
    }

    const remainingServers = servers.filter(s => {
      const { failedServers } = usePlayerStore.getState();
      return !failedServers.has(s);
    });

    if (remainingServers.length === 0) {
      setError('All servers failed. Please try again later.');
      return;
    }

    for (const server of remainingServers) {
      const success = await switchServer(server);
      if (success) return;
    }

    setError('All servers failed. Please try again later.');
  }, [servers, currentSource, switchServer, setError, markServerFailed]);

  // Stall detector
  useEffect(() => {
    const video = document.querySelector('video') as HTMLVideoElement | null;
    if (!video) return;

    let stallTimer: NodeJS.Timeout;
    let lastTime = 0;

    const onWaiting = () => {
      lastTime = video.currentTime;
      stallTimer = setTimeout(() => {
        if (video.currentTime === lastTime && !video.paused) {
          handlePlayerError();
        }
      }, 4000);
    };

    const onPlaying = () => clearTimeout(stallTimer);
    const onProgress = () => clearTimeout(stallTimer);
    const onError = () => handlePlayerError();

    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('progress', onProgress);
    video.addEventListener('error', onError);

    return () => {
      clearTimeout(stallTimer);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('progress', onProgress);
      video.removeEventListener('error', onError);
    };
  }, [currentSource, handlePlayerError]);

  const getSubtitles = useCallback(() => {
    if (!currentSource?.sources?.[0]?.subtitles) return [];
    return currentSource.sources[0].subtitles.map((sub, i) => ({
      src: sub.url,
      label: sub.lang,
      kind: 'subtitles',
      default: i === 0,
    }));
  }, [currentSource]);

  const handleTimeUpdate = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    const time = player.currentTime ?? 0;
    const duration = player.duration ?? 0;

    // Update history progress
    updateHistoryProgress(mediaId, time, duration);

    // Broadcast time to parent (for auto-next integration)
    window.parent.postMessage(JSON.stringify({
      event: 'time',
      time,
      duration,
    }), '*');
  }, [mediaId, updateHistoryProgress]);

  // ✅ CRITICAL FIX: Proper time restoration logic
  const handleCanPlay = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    // Priority 1: Restore from server switch (most important)
    if (isServerSwitchRef.current && savedTimeRef.current > 0) {
      console.log('🔄 Restoring time after server switch:', savedTimeRef.current);
      player.currentTime = savedTimeRef.current;
      isServerSwitchRef.current = false;
      hasRestoredTimeRef.current = true;
      setLoading(false);
      return;
    }

    // Priority 2: Restore from watch history (only on first load)
    if (!hasRestoredTimeRef.current) {
      const historyItem = getHistoryItem(mediaId);
      if (historyItem && historyItem.currentTime > 5) { // Skip if less than 5s
        console.log('📚 Restoring from watch history:', historyItem.currentTime);
        player.currentTime = historyItem.currentTime;
        hasRestoredTimeRef.current = true;
      }
    }

    setLoading(false);
  }, [mediaId, getHistoryItem, setLoading]);

  const handleEnded = useCallback(() => {
    // ✅ Broadcast complete to parent for auto-next
    window.parent.postMessage(JSON.stringify({
      event: 'complete',
    }), '*');

    // ✅ Auto-next episode if enabled and it's a TV show
    if (settings.autoSkip && mediaType === 'tv' && season && episode) {
      const nextEp = parseInt(episode) + 1;
      // You'll need to pass totalEpisodes as a prop or fetch it
      window.location.href = `/tv/${mediaId}/${season}/${nextEp}`;
    }
  }, [settings.autoSkip, mediaType, mediaId, season, episode]);

  // ✅ Expose switchServer to parent component via ref
  useEffect(() => {
    (window as any).__playerSwitchServer = switchServer;
    return () => {
      delete (window as any).__playerSwitchServer;
    };
  }, [switchServer]);

  if (!currentSource) {
    return (
      <div className="relative flex-1 flex items-center justify-center w-full h-full bg-black">
        {/* Poster background while finding server */}
        {poster && (
          <>
            <img
              src={poster}
              alt="poster"
              className="absolute inset-0 w-full h-full object-cover opacity-30 blur-md scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/80" />
          </>
        )}
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg font-medium mb-2">Finding a working server...</p>
          <p className="text-gray-400 text-sm">Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black">
      {/* ✅ Poster shown during ALL loading states */}
      {poster && (
        <div className={`absolute inset-0 transition-opacity duration-500 pointer-events-none ${
          isServerSwitchRef.current ? 'opacity-100' : 'opacity-0'
        }`}>
          <img
            src={poster}
            alt="poster"
            className="absolute inset-0 w-full h-full object-cover blur-md scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
              <p className="text-white text-sm">Switching server...</p>
            </div>
          </div>
        </div>
      )}

      <MediaPlayer
        ref={playerRef}
        src={{ src: currentSource.sources[0].url, type: 'application/x-mpegurl' }}
        aspectRatio="16/9"
        crossorigin
        autoplay={settings.autoPlay}
        volume={settings.volume}
        muted={settings.muted}
        playbackRate={settings.playbackSpeed}
        poster={poster}
        onVolumeChange={(detail) => {
          setVolume(detail.volume);
          setMuted(detail.muted);
        }}
        onError={handlePlayerError}
        onTimeUpdate={handleTimeUpdate}
        onCanPlay={handleCanPlay}
        onEnded={handleEnded}
        className="relative z-10 w-full h-full"
      >
        <MediaProvider>
          {getSubtitles().map((track, i) => (
            <track
              key={i}
              src={track.src}
              label={track.label}
              kind={track.kind as 'subtitles'}
              default={track.default}
            />
          ))}
        </MediaProvider>
        <DefaultVideoLayout icons={defaultLayoutIcons} />
      </MediaPlayer>
    </div>
  );
}
