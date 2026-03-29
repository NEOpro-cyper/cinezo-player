'use client';

import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message = 'Loading...' }: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/90 transition-opacity duration-300">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-player-accent/30 rounded-full" />
        <Loader2 className="absolute inset-0 w-16 h-16 text-player-accent animate-spin" />
      </div>
      <p className="mt-4 text-sm text-gray-400">{message}</p>
    </div>
  );
}
