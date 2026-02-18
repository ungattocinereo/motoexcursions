/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly TELEGRAM_BOT_TOKEN?: string;
  readonly TELEGRAM_CHAT_ID?: string;
  readonly TELEGRAM_MESSAGE_THREAD_ID?: string;
  readonly YOUTUBE_API_KEY?: string;
  readonly YOUTUBE_CHANNEL_ID?: string;
  readonly META_ACCESS_TOKEN?: string;
  readonly META_IG_USER_ID?: string;
  readonly META_FB_PAGE_ID?: string;
  readonly SOCIAL_FEED_TTL_SECONDS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
