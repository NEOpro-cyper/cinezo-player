'use client';

import { useEffect, useCallback } from 'react';
import { usePlayerStore } from '@/store/player-store';

interface UseKeyboardShortcutsProps {
  onToggleFullscreen: () => void;
  onTogglePlayPause: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (delta: number) => void;
  onNextEpisode?: () => void;
  onPreviousEpisode?: () => void;
  onOpenSettings: () => void;
  onOpenServerPanel: () => void;
}

export function useKeyboardShortcuts({
  onToggleFullscreen,
  onTogglePlayPause,
  onSeek,
  onVolumeChange,
  onNextEpisode,
  onPreviousEpisode,
  onOpenSettings,
  onOpenServerPanel,
}: UseKeyboardShortcutsProps) {
  const { settings, setMuted, setPlaybackSpeed } = usePlayerStore();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    // Prevent default for our shortcuts
    const preventKeys = ['f', ' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'm', 'n', 'p', 's', 'S'];
    if (preventKeys.includes(e.key)) {
      e.preventDefault();
    }

    switch (e.key.toLowerCase()) {
      // Fullscreen
      case 'f':
        onToggleFullscreen();
        break;

      // Play/Pause
      case ' ':
      case 'k':
        onTogglePlayPause();
        break;

      // Seek backward
      case 'arrowleft':
      case 'j':
        onSeek(e.shiftKey ? -30 : -10);
        break;

      // Seek forward
      case 'arrowright':
      case 'l':
        onSeek(e.shiftKey ? 30 : 10);
        break;

      // Volume up
      case 'arrowup':
        onVolumeChange(0.1);
        break;

      // Volume down
      case 'arrowdown':
        onVolumeChange(-0.1);
        break;

      // Mute/Unmute
      case 'm':
        setMuted(!settings.muted);
        break;

      // Next episode
      case 'n':
        onNextEpisode?.();
        break;

      // Previous episode
      case 'p':
        onPreviousEpisode?.();
        break;

      // Settings
      case 's':
        onOpenSettings();
        break;

      // Server panel
      case 'shift':
        if (e.key === 'S') {
          onOpenServerPanel();
        }
        break;

      // Playback speed
      case '<':
      case ',':
        if (settings.playbackSpeed > 0.25) {
          setPlaybackSpeed(Math.max(0.25, settings.playbackSpeed - 0.25));
        }
        break;

      case '>':
      case '.':
        if (settings.playbackSpeed < 2) {
          setPlaybackSpeed(Math.min(2, settings.playbackSpeed + 0.25));
        }
        break;

      // Number keys for seeking to percentage
      case '0':
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        // Seek to percentage of video (0-90%)
        // This would need access to video duration
        break;

      // Escape - exit fullscreen or close panels
      case 'escape':
        // Handled by player internally
        break;
    }
  }, [settings.muted, settings.playbackSpeed, setMuted, setPlaybackSpeed, onToggleFullscreen, onTogglePlayPause, onSeek, onVolumeChange, onNextEpisode, onPreviousEpisode, onOpenSettings, onOpenServerPanel]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    shortcuts: [
      { key: 'Space / K', action: 'Play/Pause' },
      { key: 'F', action: 'Fullscreen' },
      { key: 'M', action: 'Mute/Unmute' },
      { key: '← / J', action: 'Seek -10s' },
      { key: '→ / L', action: 'Seek +10s' },
      { key: 'Shift + ←', action: 'Seek -30s' },
      { key: 'Shift + →', action: 'Seek +30s' },
      { key: '↑ / ↓', action: 'Volume' },
      { key: '< / >', action: 'Speed -/+ 0.25x' },
      { key: 'N', action: 'Next Episode' },
      { key: 'P', action: 'Previous Episode' },
      { key: 'S', action: 'Settings' },
      { key: 'Shift + S', action: 'Server Panel' },
      { key: '0-9', action: 'Seek to 0%-90%' },
    ],
  };
}
