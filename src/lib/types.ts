export interface Vendor {
  id: string;
  user_id: string | null;
  tracking_code: string;
  display_name: string;
  category: string;
  subcategory: string;
  bio: string;
  website: string;
  telegram: string;
  other_contacts: Record<string, string> | null;
  min_price: number;
  max_price: number;
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
  vendor_id: string | null;
  reddit_post_id: string;
  title: string;
  subreddit: string;
  author: string;
  post_url: string;
  body_snippet: string;
  body_full: string;
  images: string[] | null;
  thumbnail: string;
  extracted_price: string;
  reddit_score: number;
  created_utc: string;
  ingested_at: string;
  permalink: string;
  vendor_trk: string;
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
