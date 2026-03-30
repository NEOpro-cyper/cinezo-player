'use client';

import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  poster?: string;
}

export function LoadingOverlay({ visible, message = 'Loading...', poster }: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center transition-opacity duration-300 overflow-hidden">
      {/* Poster background */}
      {poster && (
        <>
          <img
            src={poster}
            alt="poster"
            className="absolute inset-0 w-full h-full object-cover opacity-25 blur-md scale-110"
          />
          <div className="absolute inset-0 bg-black/70" />
        </>
      )}

      {/* Fallback solid bg if no poster */}
      {!poster && <div className="absolute inset-0 bg-black/90" />}

      {/* Spinner */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-white/20 rounded-full" />
          <Loader2 className="absolute inset-0 w-16 h-16 text-white animate-spin" />
        </div>
        <p className="mt-4 text-sm text-gray-300">{message}</p>
      </div>
    </div>
  );
}
