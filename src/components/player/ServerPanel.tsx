'use client';

import { usePlayerStore, ServerStatus } from '@/store/player-store';
import { Loader2, CheckCircle, XCircle, Radio } from 'lucide-react';

interface ServerPanelProps {
  servers: string[];
  onServerSelect: (server: string) => Promise<boolean>;
}

export function ServerPanel({ servers, onServerSelect }: ServerPanelProps) {
  const {
    currentServer,
    failedServers,
    serverStatuses,
    isLoading,
    setCurrentServer,
    setServerStatus,
  } = usePlayerStore();

  const getStatusIcon = (server: string) => {
    const status = serverStatuses[server];
    
    if (status === 'loading') {
      return <Loader2 className="w-3 h-3 animate-spin text-player-accent" />;
    }
    if (status === 'active' || server === currentServer) {
      return <CheckCircle className="w-3 h-3 text-green-500" />;
    }
    if (failedServers.has(server)) {
      return <XCircle className="w-3 h-3 text-red-500" />;
    }
    return <Radio className="w-3 h-3 text-gray-500" />;
  };

  const getStatusClass = (server: string) => {
    if (server === currentServer) return 'bg-player-accent border-player-accent text-white';
    if (failedServers.has(server)) return 'border-red-500/30 text-red-500/60 cursor-not-allowed';
    return 'border-player-border hover:border-player-accent hover:text-white';
  };

  const handleClick = async (server: string) => {
    if (server === currentServer || failedServers.has(server) || isLoading) return;

    setServerStatus(server, 'loading');
    const success = await onServerSelect(server);
    
    if (success) {
      setCurrentServer(server);
      setServerStatus(server, 'active');
    }
  };

  return (
    <div className="bg-player-surface border-t border-player-border p-3">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap mr-1">
          Server
        </span>
        
        {servers.map((server) => (
          <button
            key={server}
            onClick={() => handleClick(server)}
            disabled={server === currentServer || failedServers.has(server) || isLoading}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium
              transition-all duration-200 whitespace-nowrap
              ${getStatusClass(server)}
              ${isLoading && serverStatuses[server] === 'loading' ? 'opacity-50 cursor-wait' : ''}
            `}
          >
            {getStatusIcon(server)}
            <span>{server}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
