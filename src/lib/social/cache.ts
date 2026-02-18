import type { SocialFeedResponse } from './types';

export interface SocialCacheEntry {
  payload: SocialFeedResponse;
  fetchedAtMs: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __MOTO_SOCIAL_CACHE__: SocialCacheEntry | undefined;
}

export const getSocialCache = (): SocialCacheEntry | undefined => globalThis.__MOTO_SOCIAL_CACHE__;

export const setSocialCache = (entry: SocialCacheEntry): void => {
  globalThis.__MOTO_SOCIAL_CACHE__ = entry;
};
