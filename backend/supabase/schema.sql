-- RepDIR Database Schema
-- Run this in Supabase SQL Editor or via supabase migration

-- Enable pg_trgm for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  trk_code TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  subcategory TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  website TEXT DEFAULT '',
  telegram TEXT DEFAULT '',
  contacts TEXT DEFAULT '',
  star_rating NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  vote_score INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  is_featured BOOLEAN DEFAULT false,
  featured_at TIMESTAMPTZ,
  rank_score NUMERIC(10,2) DEFAULT 0,
  latest_thumbnail TEXT DEFAULT '',
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(display_name, '') || ' ' || coalesce(category, '') || ' ' || coalesce(subcategory, ''))
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Posts table (ingested Reddit posts)
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reddit_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  subreddit TEXT NOT NULL,
  thumbnail TEXT DEFAULT '',
  url TEXT DEFAULT '',
  permalink TEXT DEFAULT '',
  author TEXT DEFAULT '',
  image_urls TEXT[] DEFAULT '{}',
  price TEXT DEFAULT '',
  vendor_trk TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  ingested_at TIMESTAMPTZ DEFAULT now(),
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, ''))
  ) STORED
);

-- Subreddits to monitor
CREATE TABLE IF NOT EXISTS subreddits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_trk TEXT NOT NULL REFERENCES vendors(trk_code) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT DEFAULT '',
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (vendor_trk, user_id)
);

-- Votes (up/down for vendors and posts)
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('vendor', 'post')),
  entity_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (entity_type, entity_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_posts_vendor_trk ON posts(vendor_trk);
CREATE INDEX IF NOT EXISTS idx_posts_subreddit ON posts(subreddit);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_search ON posts USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_vendors_search ON vendors USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_vendors_trk ON vendors(trk_code);
CREATE INDEX IF NOT EXISTS idx_vendors_featured ON vendors(is_featured DESC, is_verified DESC, rank_score DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_vendor ON reviews(vendor_trk);
CREATE INDEX IF NOT EXISTS idx_votes_entity ON votes(entity_type, entity_id);

-- RLS: Enable Row Level Security
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subreddits ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- RLS: Public read access for all tables
CREATE POLICY "Public read vendors" ON vendors FOR SELECT USING (true);
CREATE POLICY "Public read posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Public read subreddits" ON subreddits FOR SELECT USING (true);
CREATE POLICY "Public read reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Public read votes" ON votes FOR SELECT USING (true);

-- RLS: Authenticated users can insert/update their own data
CREATE POLICY "Users insert reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users insert votes" ON votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update votes" ON votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete votes" ON votes FOR DELETE USING (auth.uid() = user_id);

-- RLS: Vendor owners can update their own vendor profile
CREATE POLICY "Vendor update own" ON vendors FOR UPDATE USING (auth.uid() = user_id);

-- RLS: Admin access (using service_role, bypasses RLS)
CREATE POLICY "Admin all vendors" ON vendors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin all subreddits" ON subreddits FOR ALL USING (true) WITH CHECK (true);
