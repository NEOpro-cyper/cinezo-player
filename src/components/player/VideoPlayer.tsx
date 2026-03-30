'use client';

import { useEffect, useRef, useCallback } from 'react';
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
  // Track current time so we can restore it when switching servers
  const currentTimeRef = useRef<number>(0);

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
    setServerStatus(serverName, 'loading');
    setLoading(true, `Connecting to ${serverName}...`);

    const source = await fetchSource(serverName);

    if (source) {
      setCurrentSource(source);
      setCurrentServer(serverName);
      setLoading(false);
      return true;
    } else {
      markServerFailed(serverName);
      setLoading(false);
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

    // Track current time for server switch restore
    currentTimeRef.current = time;

    // Update history progress
    updateHistoryProgress(mediaId, time, duration);

    // Broadcast time to parent (for auto-next integration)
    window.parent.postMessage(JSON.stringify({
      event: 'time',
      time,
      duration,
    }), '*');
  }, [mediaId, updateHistoryProgress]);

  const handleCanPlay = useCallback(() => {
    setLoading(false);

    if (!playerRef.current) return;

    // Restore time from server switch first (takes priority)
    if (currentTimeRef.current > 0) {
      playerRef.current.currentTime = currentTimeRef.current;
      return;
    }

    // Otherwise restore from watch history
    const historyItem = getHistoryItem(mediaId);
    if (historyItem && historyItem.currentTime > 0) {
      playerRef.current.currentTime = historyItem.currentTime;
    }
  }, [mediaId, getHistoryItem, setLoading]);

  const handleEnded = useCallback(() => {
    // Broadcast complete to parent (for auto-next integration)
    window.parent.postMessage(JSON.stringify({
      event: 'complete',
    }), '*');
  }, []);

  if (!currentSource) {
    return (
      <div className="relative flex-1 flex items-center justify-center w-full h-full bg-black">
        {/* Poster background while finding server */}
        {poster && (
          <>
            <img
              src={poster}
              alt="poster"
              className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm scale-105"
            />
            <div className="absolute inset-0 bg-black/60" />
          </>
        )}
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300 text-sm">Finding a working server...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Poster shown behind player during buffering/loading */}
      {poster && (
        <>
          <img
            src={poster}
            alt="poster"
            className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm scale-105 pointer-events-none"
          />
          <div className="absolute inset-0 bg-black/50 pointer-events-none" />
        </>
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
        className="relative z-10 w-full h-full bg-transparent"
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
