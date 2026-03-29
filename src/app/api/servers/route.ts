import { NextResponse } from 'next/server';

const API_BASE = 'https://api.cinezo.net';

export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/api/servers`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch servers' },
        { status: res.status }
      );
    }

    const data = await res.json();
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
