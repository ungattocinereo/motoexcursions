export type FeedSource = 'instagram' | 'facebook' | 'youtube';

export interface FeedItem {
  id: string;
  source: FeedSource;
  date: string;
  title: string | null;
  text: string | null;
  url: string;
  image: string | null;
  thumbnail: string | null;
  mediaType: 'image' | 'video' | 'link';
  metrics?: {
    likes: number;
    comments: number;
  };
}

export interface SocialFeedResponse {
  instagram: FeedItem[];
  facebook: FeedItem[];
  youtube: FeedItem[];
  fetchedAt: string;
}
