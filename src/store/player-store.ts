import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ServerStatus = 'idle' | 'loading' | 'active' | 'failed';

export interface Subtitle {
  lang: string;
  url: string;
}

export interface Source {
  url: string;
  dub?: string;
  lang?: string;
  subtitles?: Subtitle[];
}

export interface ServerResponse {
  sources: Source[];
  server: string;
}

export interface WatchHistoryItem {
  id: string;
  type: 'movie' | 'tv';
  title?: string;
  poster?: string;
  currentTime: number;
  duration: number;
  server: string;
  season?: number;
  episode?: number;
  timestamp: number;
}

export interface PlayerSettings {
  volume: number;
  muted: boolean;
  playbackSpeed: number;
  autoPlay: boolean;
  autoSkip: boolean;
  defaultSubtitleLang: string | null;
  subtitleFontSize: 'small' | 'medium' | 'large';
  subtitleBackground: boolean;
  quality: 'auto' | '1080p' | '720p' | '480p';
  showSeekBarPreview: boolean;
}

interface PlayerState {
  // Server state
  servers: string[];
  currentServer: string | null;
  lastGoodServer: string | null;
  failedServers: Set<string>;
  serverStatuses: Record<string, ServerStatus>;

  // Source state
  currentSource: ServerResponse | null;

  // UI state
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
  showSettings: boolean;
  showServerPanel: boolean;
  showInfo: boolean;

  // Settings
  settings: PlayerSettings;

  // Watch history
  watchHistory: WatchHistoryItem[];

  // Actions
  setServers: (servers: string[]) => void;
  setCurrentServer: (server: string) => void;
  setServerStatus: (server: string, status: ServerStatus) => void;
  markServerFailed: (server: string) => void;
  resetFailedServers: () => void;

  setCurrentSource: (source: ServerResponse | null) => void;

  setLoading: (loading: boolean, message?: string) => void;
  setError: (error: string | null) => void;
  toggleSettings: () => void;
  toggleServerPanel: () => void;
  toggleInfo: () => void;

  updateSettings: (settings: Partial<PlayerSettings>) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;

  addToHistory: (item: Omit<WatchHistoryItem, 'timestamp'>) => void;
  updateHistoryProgress: (id: string, currentTime: number, duration: number) => void;
  getHistoryItem: (id: string) => WatchHistoryItem | undefined;
  clearHistory: () => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      // Initial state
      servers: [],
      currentServer: null,
      lastGoodServer: null,
      failedServers: new Set(),
      serverStatuses: {},

      currentSource: null,

      isLoading: true,
      loadingMessage: 'Loading...',
      error: null,
      showSettings: false,
      showServerPanel: false,
      showInfo: false,

      settings: {
        volume: 0.8,
        muted: false,
        playbackSpeed: 1,
        autoPlay: true,
        autoSkip: true,
        defaultSubtitleLang: null,
        subtitleFontSize: 'medium',
        subtitleBackground: true,
        quality: 'auto',
        showSeekBarPreview: true,
      },

      watchHistory: [],

      // Actions
      setServers: (servers) => set({ servers }),

      setCurrentServer: (server) => set({
        currentServer: server,
        serverStatuses: { ...get().serverStatuses, [server]: 'active' }
      }),

      setServerStatus: (server, status) => set({
        serverStatuses: { ...get().serverStatuses, [server]: status }
      }),

      markServerFailed: (server) => {
        const failed = new Set(get().failedServers);
        failed.add(server);
        set({
          failedServers: failed,
          serverStatuses: { ...get().serverStatuses, [server]: 'failed' }
        });
      },

      resetFailedServers: () => set({
        failedServers: new Set(),
        serverStatuses: {}
      }),

      setCurrentSource: (source) => set({
        currentSource: source,
        currentServer: source?.server ?? null,
        lastGoodServer: source?.server ?? get().lastGoodServer
      }),

      setLoading: (loading, message = 'Loading...') => set({
        isLoading: loading,
        loadingMessage: message,
        error: null
      }),

      setError: (error) => set({
        error,
        isLoading: false
      }),

      toggleSettings: () => set((s) => ({ showSettings: !s.showSettings })),
      toggleServerPanel: () => set((s) => ({ showServerPanel: !s.showServerPanel })),
      toggleInfo: () => set((s) => ({ showInfo: !s.showInfo })),

      updateSettings: (newSettings) => set((s) => ({
        settings: { ...s.settings, ...newSettings }
      })),

      setVolume: (volume) => set((s) => ({
        settings: { ...s.settings, volume }
      })),

      setMuted: (muted) => set((s) => ({
        settings: { ...s.settings, muted }
      })),

      setPlaybackSpeed: (speed) => set((s) => ({
        settings: { ...s.settings, playbackSpeed: speed }
      })),

      addToHistory: (item) => {
        const history = get().watchHistory.filter(h => h.id !== item.id);
        set({
          watchHistory: [
            { ...item, timestamp: Date.now() },
            ...history
          ].slice(0, 100)
        });
      },

      updateHistoryProgress: (id, currentTime, duration) => {
        set({
          watchHistory: get().watchHistory.map(h =>
            h.id === id ? { ...h, currentTime, duration } : h
          )
        });
      },

      getHistoryItem: (id) => get().watchHistory.find(h => h.id === id),

      clearHistory: () => set({ watchHistory: [] }),
    }),
    {
      name: 'cinezo-player-storage',
      partialize: (state) => ({
        settings: state.settings,
        watchHistory: state.watchHistory,
        lastGoodServer: state.lastGoodServer,
      }),
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          return str ? JSON.parse(str, (key, value) => {
            if (key === 'failedServers' && Array.isArray(value)) {
              return new Set(value);
            }
            return value;
          }) : null;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value, (key, value) => {
            if (key === 'failedServers' && value instanceof Set) {
              return Array.from(value);
            }
            return value;
          }));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
