import { getSocialCache, setSocialCache } from './cache';
import { fetchFacebookFeed } from './fetchers/facebook';
import { fetchInstagramFeed } from './fetchers/instagram';
import { fetchYouTubeFeed } from './fetchers/youtube';
import type { FeedItem, SocialFeedResponse } from './types';

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 20;
const DEFAULT_TTL_SECONDS = 1800;

const limitToRange = (value: number): number => Math.min(MAX_LIMIT, Math.max(1, value));

const sortByDateDesc = (items: FeedItem[]): FeedItem[] =>
  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

const withLimit = (items: FeedItem[], limit: number): FeedItem[] => sortByDateDesc(items).slice(0, limit);

export const getSocialFeed = async (requestedLimit = DEFAULT_LIMIT): Promise<SocialFeedResponse> => {
  const limit = limitToRange(requestedLimit || DEFAULT_LIMIT);
  const ttlSeconds = Number(import.meta.env.SOCIAL_FEED_TTL_SECONDS ?? DEFAULT_TTL_SECONDS);
  const ttlMs = (Number.isFinite(ttlSeconds) ? ttlSeconds : DEFAULT_TTL_SECONDS) * 1000;

  const cached = getSocialCache();
  const now = Date.now();

  if (cached && now - cached.fetchedAtMs <= ttlMs) {
    return {
      ...cached.payload,
      instagram: withLimit([...cached.payload.instagram], limit),
      facebook: withLimit([...cached.payload.facebook], limit),
      youtube: withLimit([...cached.payload.youtube], limit),
    };
  }

  const [instagramResult, facebookResult, youtubeResult] = await Promise.allSettled([
    fetchInstagramFeed(limit),
    fetchFacebookFeed(limit),
    fetchYouTubeFeed(limit),
  ]);

  const instagram = instagramResult.status === 'fulfilled' ? withLimit(instagramResult.value, limit) : [];
  const facebook = facebookResult.status === 'fulfilled' ? withLimit(facebookResult.value, limit) : [];
  const youtube = youtubeResult.status === 'fulfilled' ? withLimit(youtubeResult.value, limit) : [];

  const failedCount = [instagramResult, facebookResult, youtubeResult].filter((entry) => entry.status === 'rejected').length;
  const hasAnyFeed = instagram.length > 0 || facebook.length > 0 || youtube.length > 0;

  if (!hasAnyFeed && cached) {
    return {
      ...cached.payload,
      instagram: withLimit([...cached.payload.instagram], limit),
      facebook: withLimit([...cached.payload.facebook], limit),
      youtube: withLimit([...cached.payload.youtube], limit),
    };
  }

  const payload: SocialFeedResponse = {
    instagram,
    facebook,
    youtube,
    fetchedAt: new Date().toISOString(),
  };

  if (hasAnyFeed || failedCount < 3 || !cached) {
    setSocialCache({
      payload,
      fetchedAtMs: now,
    });
  }

  return payload;
};
