import type { FeedItem } from '../types';

const INSTAGRAM_BASE = 'https://graph.facebook.com/v22.0';

const trimText = (value: string | undefined, max = 220): string | null => {
  if (!value) return null;
  return value.length <= max ? value : `${value.slice(0, max - 1).trim()}…`;
};

export const fetchInstagramFeed = async (limit: number): Promise<FeedItem[]> => {
  const accessToken = import.meta.env.META_ACCESS_TOKEN;
  const igUserId = import.meta.env.META_IG_USER_ID;

  if (!accessToken || !igUserId) {
    return [];
  }

  const fields = [
    'id',
    'caption',
    'media_type',
    'media_url',
    'thumbnail_url',
    'permalink',
    'timestamp',
  ].join(',');

  const params = new URLSearchParams({
    fields,
    limit: String(limit),
    access_token: accessToken,
  });

  const response = await fetch(`${INSTAGRAM_BASE}/${igUserId}/media?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Instagram API failed (${response.status})`);
  }

  const payload = (await response.json()) as {
    data?: Array<{
      id?: string;
      caption?: string;
      media_type?: string;
      media_url?: string;
      thumbnail_url?: string;
      permalink?: string;
      timestamp?: string;
    }>;
  };

  return (payload.data ?? [])
    .filter((item) => item.id && item.timestamp && item.permalink)
    .map((item) => {
      const mediaType = item.media_type === 'VIDEO' ? 'video' : item.media_type === 'CAROUSEL_ALBUM' ? 'link' : 'image';
      const media = item.media_url ?? null;
      const thumbnail = item.thumbnail_url ?? media;

      return {
        id: item.id as string,
        source: 'instagram',
        date: new Date(item.timestamp as string).toISOString(),
        title: null,
        text: trimText(item.caption, 220),
        url: item.permalink as string,
        image: media,
        thumbnail,
        mediaType,
      } satisfies FeedItem;
    });
};
