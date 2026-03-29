const API_BASE = 'https://api.cinezo.net';

export interface Server {
  name: string;
  movieApiUrl: string;
  tvApiUrl: string;
}

export interface Subtitle {
  lang: string;
  url: string;
}

export interface Source {
  url: string;
  dub?: string;
  lang?: string;
  subtitles?: Subtitle[];
}

export interface ServerResponse {
  sources: Source[];
  server: string;
}

// Cache for servers list
let serversCache: Server[] | null = null;
let serversCacheTime = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

export async function fetchServers(): Promise<Server[]> {
  const now = Date.now();
  
  if (serversCache && (now - serversCacheTime) < CACHE_TTL) {
    return serversCache;
  }

  const res = await fetch(`${API_BASE}/api/servers`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch servers: ${res.status}`);
  }

  serversCache = await res.json();
  serversCacheTime = now;
  
  return serversCache!;
}

export async function fetchMovieSource(id: string, serverName: string): Promise<ServerResponse | null> {
  try {
    const res = await fetch(
      `${API_BASE}/api/movie/${id}/${encodeURIComponent(serverName)}`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) return null;

    const data = await res.json();
    
    if (!data?.sources?.[0]?.url) return null;
    
    return {
      sources: data.sources,
      server: serverName,
    };
  } catch {
    return null;
  }
}

export async function fetchTVSource(
  id: string,
  season: string,
  episode: string,
  serverName: string
): Promise<ServerResponse | null> {
  try {
    const res = await fetch(
      `${API_BASE}/api/tv/${id}/${season}/${episode}/${encodeURIComponent(serverName)}`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) return null;

    const data = await res.json();
    
    if (!data?.sources?.[0]?.url) return null;
    
    return {
      sources: data.sources,
      server: serverName,
    };
  } catch {
    return null;
  }
}

export async function getInitialSource(
  servers: Server[],
  type: 'movie' | 'tv',
  params: { id: string; season?: string; episode?: string }
): Promise<{ source: ServerResponse | null; serverName: string } | null> {
  for (const server of servers) {
    const source = type === 'movie'
      ? await fetchMovieSource(params.id, server.name)
      : await fetchTVSource(params.id, params.season!, params.episode!, server.name);

    if (source) {
      return { source, serverName: server.name };
    }
  }
  return null;
}
