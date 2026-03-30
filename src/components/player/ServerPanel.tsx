'use client';
import { usePlayerStore } from '@/store/player-store';
import { Loader2, CheckCircle, XCircle, Radio, X } from 'lucide-react';

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
    showServerPanel,
    toggleServerPanel,
    setCurrentServer,
    setServerStatus,
  } = usePlayerStore();

  if (!showServerPanel) return null;

  const getStatusIcon = (server: string) => {
    const status = serverStatuses[server];
    if (status === 'loading') return <Loader2 className="w-3 h-3 animate-spin text-player-accent" />;
    if (status === 'active' || server === currentServer) return <CheckCircle className="w-3 h-3 text-green-500" />;
    if (failedServers.has(server)) return <XCircle className="w-3 h-3 text-red-500" />;
    return <Radio className="w-3 h-3 text-gray-500" />;
  };

  const getStatusClass = (server: string) => {
    if (server === currentServer) return 'bg-player-accent border-player-accent text-white';
    if (failedServers.has(server)) return 'border-red-500/30 text-red-500/60 cursor-not-allowed';
    return 'border-player-border hover:border-player-accent hover:text-white text-gray-400';
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
    <div className="absolute top-16 right-4 z-50 w-72 bg-player-surface border border-player-border rounded-xl shadow-2xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-white">Select Server</span>
        <button
          onClick={toggleServerPanel}
          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Server Grid */}
      <div className="grid grid-cols-2 gap-2">
        {servers.map((server) => (
          <button
            key={server}
            onClick={() => handleClick(server)}
            disabled={server === currentServer || failedServers.has(server) || isLoading}
            className={`
              flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium
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
