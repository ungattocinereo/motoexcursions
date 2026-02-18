import type { FeedItem } from '../types';

const YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

const trimText = (value: string | undefined, max = 220): string | null => {
  if (!value) return null;
  return value.length <= max ? value : `${value.slice(0, max - 1).trim()}…`;
};

export const fetchYouTubeFeed = async (limit: number): Promise<FeedItem[]> => {
  const apiKey = import.meta.env.YOUTUBE_API_KEY;
  const channelId = import.meta.env.YOUTUBE_CHANNEL_ID;

  if (!apiKey || !channelId) {
    return [];
  }

  const params = new URLSearchParams({
    key: apiKey,
    channelId,
    part: 'snippet',
    order: 'date',
    maxResults: String(limit),
    type: 'video',
  });

  const response = await fetch(`${YOUTUBE_SEARCH_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`YouTube API failed (${response.status})`);
  }

  const payload = (await response.json()) as {
    items?: Array<{
      id?: { videoId?: string };
      snippet?: {
        publishedAt?: string;
        title?: string;
        description?: string;
        thumbnails?: {
          high?: { url?: string };
          medium?: { url?: string };
          default?: { url?: string };
        };
      };
    }>;
  };

  return (payload.items ?? [])
    .filter((item) => item.id?.videoId && item.snippet?.publishedAt)
    .map((item) => {
      const videoId = item.id?.videoId as string;
      const snippet = item.snippet ?? {};
      const thumbnail =
        snippet.thumbnails?.high?.url ?? snippet.thumbnails?.medium?.url ?? snippet.thumbnails?.default?.url ?? null;

      return {
        id: videoId,
        source: 'youtube',
        date: new Date(snippet.publishedAt as string).toISOString(),
        title: trimText(snippet.title, 120),
        text: trimText(snippet.description, 220),
        url: `https://www.youtube.com/watch?v=${videoId}`,
        image: thumbnail,
        thumbnail,
        mediaType: 'video',
      } satisfies FeedItem;
    });
};
