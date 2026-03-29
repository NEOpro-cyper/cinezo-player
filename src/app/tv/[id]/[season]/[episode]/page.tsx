import { Metadata } from 'next';
import { fetchServers, fetchTVSource } from '@/lib/api';
import { Player } from '@/components/player';

interface TVPageProps {
  params: { id: string; season: string; episode: string };
}

export async function generateMetadata({ params }: TVPageProps): Promise<Metadata> {
  return {
    title: `TV Show S${params.season}E${params.episode} - ${params.id}`,
  };
}

export default async function TVPage({ params }: TVPageProps) {
  const { id, season, episode } = params;

  // Fetch servers
  let servers;
  try {
    servers = await fetchServers();
  } catch (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-player-bg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Error</h1>
          <p className="text-gray-400">Failed to load servers. Please try again later.</p>
        </div>
      </div>
    );
  }

  // Try to get initial source from first working server
  let initialSource = null;
  for (const server of servers) {
    const source = await fetchTVSource(id, season, episode, server.name);
    if (source) {
      initialSource = source;
      break;
    }
  }

  const serverNames = servers.map(s => s.name);

  return (
    <main className="flex flex-col h-screen w-full bg-player-bg">
      <Player
        initialSource={initialSource}
        servers={serverNames}
        mediaId={id}
        mediaType="tv"
        season={season}
        episode={episode}
      />
    </main>
  );
}
