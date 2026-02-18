import type { APIRoute } from 'astro';
import { getSocialFeed } from '../../lib/social';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const limitFromQuery = Number(url.searchParams.get('limit') ?? '8');
  const limit = Number.isFinite(limitFromQuery) ? limitFromQuery : 8;

  try {
    const payload = await getSocialFeed(limit);

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Could not fetch social feed',
      }),
      {
        status: 500,
        headers: {
          'content-type': 'application/json; charset=utf-8',
        },
      },
    );
  }
};
