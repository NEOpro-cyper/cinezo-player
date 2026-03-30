export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { fetchServers, fetchTVSource } from '@/lib/api';
import { Player } from '@/components/player';

interface TVPageProps {
  params: { id: string; season: string; episode: string };
  searchParams: { autoPlay?: string; asi?: string };
}

const TMDB_API_KEY = process.env.TMDB_API_KEY || '';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w780';

async function fetchTVMeta(id: string, season: string) {
  if (!TMDB_API_KEY) return null;
  
  try {
    const [showRes, seasonRes] = await Promise.all([
      fetch(`${TMDB_BASE}/tv/${id}?api_key=${TMDB_API_KEY}`, { 
        next: { revalidate: 86400 } 
      }),
      fetch(`${TMDB_BASE}/tv/${id}/season/${season}?api_key=${TMDB_API_KEY}`, { 
        next: { revalidate: 86400 } 
      }),
    ]);

    const show = showRes.ok ? await showRes.json() : null;
    const seasonData = seasonRes.ok ? await seasonRes.json() : null;

    return { show, seasonData };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: TVPageProps): Promise<Metadata> {
  const meta = await fetchTVMeta(params.id, params.season);
  const showName = meta?.show?.name ?? params.id;
  const seasonNum = params.season.padStart(2, '0');
  const episodeNum = params.episode.padStart(2, '0');

  return {
    title: `${showName} S${seasonNum}E${episodeNum} - Cinezo Player`,
    description: meta?.show?.overview || 'Watch TV shows online',
    openGraph: {
      title: `${showName} S${seasonNum}E${episodeNum}`,
      description: meta?.show?.overview || 'Watch TV shows online',
      images: meta?.show?.poster_path ? [`${TMDB_IMAGE}${meta.show.poster_path}`] : [],
    },
  };
}

export default async function TVPage({ params, searchParams }: TVPageProps) {
  const { id, season, episode } = params;

  // Fetch TMDB metadata
  const meta = await fetchTVMeta(id, season);
  const show = meta?.show;
  const seasonData = meta?.seasonData;

  const title = show?.name
    ? `${show.name} - S${season.padStart(2, '0')}E${episode.padStart(2, '0')}`
    : `TV Show ${id} - S${season}E${episode}`;

  const poster = show?.poster_path
    ? `${TMDB_IMAGE}${show.poster_path}`
    : undefined;

  const totalSeasons = show?.number_of_seasons ?? undefined;
  const totalEpisodes = seasonData?.episodes?.length ?? undefined;

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
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-player-accent text-white rounded-lg hover:bg-player-accent/80 transition-colors"
          >
            Retry
          </button>
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
    <main className="flex flex-col h-screen w-full bg-player-bg overflow-hidden">
      <Player
        initialSource={initialSource}
        servers={serverNames}
        mediaId={id}
        mediaType="tv"
        season={season}
        episode={episode}
        title={title}
        poster={poster}
        totalSeasons={totalSeasons}
        totalEpisodes={totalEpisodes}
      />
    </main>
  );
}
