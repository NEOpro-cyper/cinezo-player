'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
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
    setPlaybackSpeed,
    addToHistory,
    updateHistoryProgress,
    getHistoryItem,
  } = usePlayerStore();

  const [currentSubtitle, setCurrentSubtitle] = useState<string | null>(null);
  const [errorRetryCount, setErrorRetryCount] = useState(0);
  const saveProgressRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize with initial source
  useEffect(() => {
    if (initialSource) {
      setCurrentSource(initialSource);
      setCurrentServer(initialSource.server);
    }
    setLoading(false);
  }, [initialSource, setCurrentSource, setCurrentServer, setLoading]);

  // Restore from watch history
  useEffect(() => {
    const historyItem = getHistoryItem(mediaId);
    if (historyItem && playerRef.current) {
      // Will seek after loaded
    }
  }, [mediaId, getHistoryItem]);

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

    saveProgressRef.current = setInterval(saveProgress, 10000);

    return () => {
      if (saveProgressRef.current) {
        clearInterval(saveProgressRef.current);
      }
    };
  }, [mediaId, mediaType, title, poster, currentSource, season, episode, addToHistory]);

  // Fetch source with m3u8 URL validation
  const fetchSource = useCallback(async (serverName: string): Promise<ServerResponse | null> => {
    const path = mediaType === 'movie'
      ? `/api/movie/${mediaId}/${encodeURIComponent(serverName)}`
      : `/api/tv/${mediaId}/${season}/${episode}/${encodeURIComponent(serverName)}`;

    try {
      const res = await fetch(path);
      if (!res.ok) return null;
      const data = await res.json();
      if (!data?.sources?.[0]?.url) return null;

      // Validate m3u8 URL is actually reachable
      const m3u8Url = data.sources[0].url;
      try {
        const check = await fetch(m3u8Url, { method: 'HEAD' });
        if (!check.ok) return null;
      } catch {
        return null; // URL unreachable, skip this server
      }

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
      setErrorRetryCount(0);
      return true;
    } else {
      markServerFailed(serverName);
      setLoading(false);
      return false;
    }
  }, [fetchSource, setCurrentSource, setCurrentServer, setServerStatus, markServerFailed, setLoading]);

  // Auto-fallback on error
  const handlePlayerError = useCallback(async () => {
    if (errorRetryCount >= 1) {
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
    } else {
      setErrorRetryCount(prev => prev + 1);
    }
  }, [errorRetryCount, servers, currentSource, switchServer, setError, markServerFailed]);

  // Stall detector - only switch if truly stuck (no progress for 10s)
  useEffect(() => {
    const video = document.querySelector('video') as HTMLVideoElement | null;
    if (!video) return;

    let stallTimer: NodeJS.Timeout;
    let lastTime = 0;

    const onWaiting = () => {
      lastTime = video.currentTime;
      stallTimer = setTimeout(() => {
        // If time hasn't moved and video isn't paused, it's truly stuck
        if (video.currentTime === lastTime && !video.paused) {
          handlePlayerError();
        }
      }, 10000);
    };

    const onPlaying = () => clearTimeout(stallTimer);
    const onProgress = () => clearTimeout(stallTimer); // data arriving, not stuck
    const onError = () => handlePlayerError(); // hard error, switch immediately

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

  // Get subtitles for current source
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
    updateHistoryProgress(mediaId, player.currentTime ?? 0, player.duration ?? 0);
  }, [mediaId, updateHistoryProgress]);

  const handleCanPlay = useCallback(() => {
    setLoading(false);
    const historyItem = getHistoryItem(mediaId);
    if (historyItem && playerRef.current) {
      playerRef.current.currentTime = historyItem.currentTime;
    }
  }, [mediaId, getHistoryItem, setLoading]);

  if (!currentSource) {
    return (
      <div className="flex-1 flex items-center justify-center bg-player-bg">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-player-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Finding a working server...</p>
        </div>
      </div>
    );
  }

  return (
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
      className="w-full h-full bg-black"
    >
      <MediaProvider>
        {getSubtitles().map((track, i) => (
          <track
            key={i}
            src={track.src}
            label={track.label}
            kind={track.kind}
            default={track.default}
          />
        ))}
      </MediaProvider>
      <DefaultVideoLayout icons={defaultLayoutIcons} />
    </MediaPlayer>
  );
}
