import { NextResponse } from 'next/server';

const API_BASE = 'https://api.cinezo.net';

export async function GET(
  request: Request,
  { params }: { params: { id: string; season: string; episode: string; server: string } }
) {
  const { id, season, episode, server } = params;

  try {
    const res = await fetch(
      `${API_BASE}/api/tv/${id}/${season}/${episode}/${encodeURIComponent(server)}`,
      {
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch source', sources: [] },
        { status: res.status }
      );
    }

    const data = await res.json();

    if (!data?.sources?.[0]?.url) {
      return NextResponse.json(
        { error: 'No valid source found', sources: [] },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        sources: data.sources,
        server: server,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', sources: [] },
      { status: 500 }
    );
  }
}
