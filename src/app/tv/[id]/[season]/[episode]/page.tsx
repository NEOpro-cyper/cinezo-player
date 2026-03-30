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
      fetch(`${TMDB_BASE}/tv/${id}?api_key=${TMDB_API_KEY}`, { next: { revalidate: 86400 } }),
      fetch(`${TMDB_BASE}/tv/${id}/season/${season}?api_key=${TMDB_API_KEY}`, { next: { revalidate: 86400 } }),
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
  return {
    title: `${showName} S${params.season}E${params.episode} - Player`,
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
    : undefined;

  const poster = show?.poster_path
    ? `${TMDB_IMAGE}${show.poster_path}`
    : undefined;

  const totalEpisodes = seasonData?.episodes?.length ?? undefined;

  // Fetch servers
  let servers;
  try {
    servers = await fetchServers();
  } catch {
    return (
      <div className="flex items-center justify-center min-h-screen bg-player-bg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Error</h1>
          <p className="text-gray-400">Failed to load servers. Please try again later.</p>
        </div>
      </div>
    );
  }

  // Try to get initial source
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
        title={title}
        poster={poster}
        totalEpisodes={totalEpisodes}
      />
    </main>
  );
}
