export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { fetchServers, fetchMovieSource } from '@/lib/api';
import { Player } from '@/components/player';

interface MoviePageProps {
  params: { id: string };
  searchParams: { autoPlay?: string; asi?: string };
}

const TMDB_API_KEY = process.env.TMDB_API_KEY || '';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w780';

async function fetchMovieMeta(id: string) {
  if (!TMDB_API_KEY) return null;
  
  try {
    const res = await fetch(`${TMDB_BASE}/movie/${id}?api_key=${TMDB_API_KEY}`, {
      next: { revalidate: 86400 },
    });
    
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: MoviePageProps): Promise<Metadata> {
  const meta = await fetchMovieMeta(params.id);
  
  return {
    title: meta?.title ? `${meta.title} - Cinetaro Player` : `Movie Player - ${params.id}`,
    description: meta?.overview || 'Watch movies online',
    openGraph: {
      title: meta?.title || 'Movie Player',
      description: meta?.overview || 'Watch movies online',
      images: meta?.poster_path ? [`${TMDB_IMAGE}${meta.poster_path}`] : [],
    },
  };
}

export default async function MoviePage({ params, searchParams }: MoviePageProps) {
  const { id } = params;

  // Fetch TMDB metadata for poster + title
  const meta = await fetchMovieMeta(id);
  const title = meta?.title ?? `Movie ${id}`;
  const poster = meta?.poster_path ? `${TMDB_IMAGE}${meta.poster_path}` : undefined;

  // Fetch servers
  let servers;
  try {
    servers = await fetchServers();
 } catch (error) {
    console.error('Failed to fetch servers:', error);
    return (
      <div className="flex items-center justify-center min-h-screen bg-player-bg">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-500">Error</h1>
          <p className="text-gray-400">Failed to load servers. Please try again later.</p>
          
            href="."
            className="inline-block px-6 py-2 bg-player-accent text-white rounded-lg hover:bg-player-accent/80 transition-colors"
          >
            Retry
          </a>
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
    <main className="flex flex-col h-screen w-full bg-player-bg overflow-hidden">
      <Player
        initialSource={initialSource}
        servers={serverNames}
        mediaId={id}
        mediaType="movie"
        title={title}
        poster={poster}
      />
    </main>
  );
}
