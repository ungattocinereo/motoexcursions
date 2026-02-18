import type { FeedItem } from '../types';

const FACEBOOK_BASE = 'https://graph.facebook.com/v22.0';

const trimText = (value: string | undefined, max = 220): string | null => {
  if (!value) return null;
  return value.length <= max ? value : `${value.slice(0, max - 1).trim()}…`;
};

const extractAttachmentImage = (item: {
  full_picture?: string;
  attachments?: {
    data?: Array<{
      media?: { image?: { src?: string } };
      media_type?: string;
    }>;
  };
}): { image: string | null; mediaType: 'image' | 'video' | 'link' } => {
  if (item.full_picture) {
    return { image: item.full_picture, mediaType: 'image' };
  }

  const first = item.attachments?.data?.[0];
  const image = first?.media?.image?.src ?? null;
  const mediaType = first?.media_type === 'video' ? 'video' : first?.media_type === 'photo' ? 'image' : 'link';

  return { image, mediaType };
};

export const fetchFacebookFeed = async (limit: number): Promise<FeedItem[]> => {
  const accessToken = import.meta.env.META_ACCESS_TOKEN;
  const pageId = import.meta.env.META_FB_PAGE_ID;

  if (!accessToken || !pageId) {
    return [];
  }

  const fields = ['id', 'message', 'created_time', 'full_picture', 'permalink_url', 'attachments{media_type,media}'].join(',');

  const params = new URLSearchParams({
    fields,
    limit: String(limit),
    access_token: accessToken,
  });

  const response = await fetch(`${FACEBOOK_BASE}/${pageId}/posts?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Facebook API failed (${response.status})`);
  }

  const payload = (await response.json()) as {
    data?: Array<{
      id?: string;
      message?: string;
      created_time?: string;
      full_picture?: string;
      permalink_url?: string;
      attachments?: {
        data?: Array<{
          media?: { image?: { src?: string } };
          media_type?: string;
        }>;
      };
    }>;
  };

  return (payload.data ?? [])
    .filter((item) => item.id && item.created_time && item.permalink_url)
    .map((item) => {
      const attachment = extractAttachmentImage(item);

      return {
        id: item.id as string,
        source: 'facebook',
        date: new Date(item.created_time as string).toISOString(),
        title: null,
        text: trimText(item.message, 220),
        url: item.permalink_url as string,
        image: attachment.image,
        thumbnail: attachment.image,
        mediaType: attachment.mediaType,
      } satisfies FeedItem;
    });
};
