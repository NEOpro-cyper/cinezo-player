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
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center transition-opacity duration-300 overflow-hidden backdrop-blur-sm">
      {/* Poster background with enhanced blur */}
      {poster && (
        <>
          <img
            src={poster}
            alt="poster"
            className="absolute inset-0 w-full h-full object-cover opacity-30 blur-xl scale-110 animate-pulse"
            style={{ animationDuration: '3s' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/80" />
        </>
      )}
      
      {/* Fallback solid bg if no poster */}
      {!poster && <div className="absolute inset-0 bg-black/95" />}
      
      {/* Spinner with glow effect */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="relative">
          {/* Outer glow ring */}
          <div className="absolute inset-0 w-20 h-20 -m-2 rounded-full bg-white/5 blur-md" />
          
          {/* Base ring */}
          <div className="w-16 h-16 border-4 border-white/20 rounded-full" />
          
          {/* Spinning loader */}
          <Loader2 className="absolute inset-0 w-16 h-16 text-white animate-spin" />
        </div>
        
        {/* Message with fade-in animation */}
        <div className="text-center space-y-1 animate-fade-in">
          <p className="text-base font-medium text-white">{message}</p>
          <p className="text-xs text-gray-400">Please wait...</p>
        </div>
      </div>

      {/* Animated dots indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
