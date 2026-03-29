'use client';

import { usePlayerStore } from '@/store/player-store';
import {
  Settings,
  Subtitles,
  Gauge,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  RotateCcw,
} from 'lucide-react';

interface SettingsPanelProps {
  subtitles: Array<{ lang: string; url: string }>;
  onSubtitleChange: (url: string | null) => void;
}

export function SettingsPanel({ subtitles, onSubtitleChange }: SettingsPanelProps) {
  const { settings, showSettings, toggleSettings, updateSettings } = usePlayerStore();

  if (!showSettings) return null;

  const playbackSpeeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  const fontSizes = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
  ];

  return (
    <div className="absolute top-12 right-4 z-50 w-72 bg-player-surface border border-player-border rounded-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-player-border">
        <h3 className="font-semibold flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Settings
        </h3>
        <button
          onClick={toggleSettings}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {/* Playback Speed */}
        <div className="p-4 border-b border-player-border">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Gauge className="w-3 h-3" />
            Playback Speed
          </label>
          <div className="flex flex-wrap gap-1.5">
            {playbackSpeeds.map((speed) => (
              <button
                key={speed}
                onClick={() => updateSettings({ playbackSpeed: speed })}
                className={`
                  px-2.5 py-1 rounded text-xs font-medium transition-all
                  ${settings.playbackSpeed === speed
                    ? 'bg-player-accent text-white'
                    : 'bg-player-bg hover:bg-player-border'
                  }
                `}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Subtitles */}
        {subtitles.length > 0 && (
          <div className="p-4 border-b border-player-border">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Subtitles className="w-3 h-3" />
              Subtitles
            </label>
            <div className="space-y-1.5">
              <button
                onClick={() => onSubtitleChange(null)}
                className={`
                  w-full px-3 py-2 rounded text-left text-sm transition-all
                  ${!settings.defaultSubtitleLang
                    ? 'bg-player-accent text-white'
                    : 'bg-player-bg hover:bg-player-border'
                  }
                `}
              >
                Off
              </button>
              {subtitles.map((sub, i) => (
                <button
                  key={i}
                  onClick={() => {
                    updateSettings({ defaultSubtitleLang: sub.lang });
                    onSubtitleChange(sub.url);
                  }}
                  className={`
                    w-full px-3 py-2 rounded text-left text-sm transition-all truncate
                    ${settings.defaultSubtitleLang === sub.lang
                      ? 'bg-player-accent text-white'
                      : 'bg-player-bg hover:bg-player-border'
                    }
                  `}
                >
                  {sub.lang}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Subtitle Style */}
        {subtitles.length > 0 && (
          <div className="p-4 border-b border-player-border">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              Subtitle Size
            </label>
            <div className="flex gap-1.5">
              {fontSizes.map((size) => (
                <button
                  key={size.value}
                  onClick={() => updateSettings({ subtitleFontSize: size.value as 'small' | 'medium' | 'large' })}
                  className={`
                    flex-1 px-3 py-1.5 rounded text-xs font-medium transition-all
                    ${settings.subtitleFontSize === size.value
                      ? 'bg-player-accent text-white'
                      : 'bg-player-bg hover:bg-player-border'
                    }
                  `}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Subtitle Background */}
        {subtitles.length > 0 && (
          <div className="p-4 border-b border-player-border">
            <button
              onClick={() => updateSettings({ subtitleBackground: !settings.subtitleBackground })}
              className="flex items-center justify-between w-full text-sm"
            >
              <span className="flex items-center gap-2">
                {settings.subtitleBackground ? (
                  <Eye className="w-4 h-4 text-player-accent" />
                ) : (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                )}
                Subtitle Background
              </span>
              <div
                className={`
                  w-10 h-5 rounded-full transition-all relative
                  ${settings.subtitleBackground ? 'bg-player-accent' : 'bg-gray-600'}
                `}
              >
                <div
                  className={`
                    absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all
                    ${settings.subtitleBackground ? 'left-5' : 'left-0.5'}
                  `}
                />
              </div>
            </button>
          </div>
        )}

        {/* Autoplay */}
        <div className="p-4 border-b border-player-border">
          <button
            onClick={() => updateSettings({ autoPlay: !settings.autoPlay })}
            className="flex items-center justify-between w-full text-sm"
          >
            <span>Auto Play</span>
            <div
              className={`
                w-10 h-5 rounded-full transition-all relative
                ${settings.autoPlay ? 'bg-player-accent' : 'bg-gray-600'}
              `}
            >
              <div
                className={`
                  absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all
                  ${settings.autoPlay ? 'left-5' : 'left-0.5'}
                `}
              />
            </div>
          </button>
        </div>

        {/* Reset Settings */}
        <div className="p-4">
          <button
            onClick={() => {
              updateSettings({
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
              });
            }}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
}
