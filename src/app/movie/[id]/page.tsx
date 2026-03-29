import { Metadata } from 'next';
import { fetchServers, fetchMovieSource } from '@/lib/api';
import { Player } from '@/components/player';

interface MoviePageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: MoviePageProps): Promise<Metadata> {
  return {
    title: `Movie Player - ${params.id}`,
  };
}

export default async function MoviePage({ params }: MoviePageProps) {
  const { id } = params;

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
    const source = await fetchMovieSource(id, server.name);
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
        mediaType="movie"
      />
    </main>
  );
}
