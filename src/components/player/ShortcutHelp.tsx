'use client';

import { X, Keyboard } from 'lucide-react';

interface ShortcutHelpProps {
  visible: boolean;
  onClose: () => void;
}

const shortcuts = [
  { category: 'Playback', items: [
    { key: 'Space / K', action: 'Play/Pause' },
    { key: 'F', action: 'Toggle Fullscreen' },
    { key: 'M', action: 'Mute/Unmute' },
  ]},
  { category: 'Seeking', items: [
    { key: '← / J', action: 'Seek back 10s' },
    { key: '→ / L', action: 'Seek forward 10s' },
    { key: 'Shift + ←', action: 'Seek back 30s' },
    { key: 'Shift + →', action: 'Seek forward 30s' },
    { key: '0-9', action: 'Seek to 0%-90%' },
  ]},
  { category: 'Volume', items: [
    { key: '↑', action: 'Increase volume' },
    { key: '↓', action: 'Decrease volume' },
  ]},
  { category: 'Speed', items: [
    { key: '< / ,', action: 'Decrease speed 0.25x' },
    { key: '> / .', action: 'Increase speed 0.25x' },
  ]},
  { category: 'Navigation', items: [
    { key: 'N', action: 'Next episode' },
    { key: 'P', action: 'Previous episode' },
  ]},
  { category: 'Panels', items: [
    { key: 'S', action: 'Settings panel' },
    { key: '?', action: 'Show shortcuts' },
  ]},
];

export function ShortcutHelp({ visible, onClose }: ShortcutHelpProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-player-surface border border-player-border rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-player-border bg-player-bg">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-player-accent" />
            <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shortcuts.map((section) => (
              <div key={section.category}>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  {section.category}
                </h3>
                <div className="space-y-2">
                  {section.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-300">{item.action}</span>
                      <kbd className="px-2 py-1 bg-player-bg border border-player-border rounded text-xs font-mono text-gray-400">
                        {item.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-player-border bg-player-bg">
          <p className="text-xs text-gray-500 text-center">
            Press <kbd className="px-1.5 py-0.5 bg-player-surface border border-player-border rounded text-gray-400">?</kbd> to toggle this help
          </p>
        </div>
      </div>
    </div>
  );
}
