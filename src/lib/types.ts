export interface Vendor {
  id: string;
  display_name: string;
  trk_code: string;
  category: string;
  subcategory: string;
  description: string;
  website: string;
  telegram: string;
  contacts: string;
  star_rating: number;
  review_count: number;
  vote_score: number;
  is_verified: boolean;
  verified_at: string | null;
  is_featured: boolean;
  featured_at: string | null;
  rank_score: number;
  latest_thumbnail: string;
  created_at: string;
}

export interface Post {
  id: string;
  reddit_id: string;
  title: string;
  body: string;
  subreddit: string;
  thumbnail: string;
  url: string;
  permalink: string;
  author: string;
  image_urls: string[];
  price: string;
  vendor_trk: string;
  created_at: string;
  ingested_at: string;
}

export interface Subreddit {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  vendor_trk: string;
  user_id: string;
  email: string;
  rating: number;
  text: string;
  created_at: string;
}

export interface Vote {
  id: string;
  entity_type: 'vendor' | 'post';
  entity_id: string;
  user_id: string;
  direction: 'up' | 'down';
  created_at: string;
}
