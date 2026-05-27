-- Add missing columns to vendors
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS subcategory TEXT DEFAULT '';
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS star_rating NUMERIC(3,2) DEFAULT 0;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS vote_score INTEGER DEFAULT 0;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS rank_score NUMERIC(10,2) DEFAULT 0;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS latest_thumbnail TEXT DEFAULT '';

-- Add missing columns to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS permalink TEXT DEFAULT '';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS vendor_trk TEXT DEFAULT '';

-- Drop search_vector and recreate with proper columns
-- (update the generated column to include new field names if needed)
ALTER TABLE vendors DROP COLUMN IF EXISTS search_vector;
ALTER TABLE vendors ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(display_name, '') || ' ' || coalesce(category, '') || ' ' || coalesce(subcategory, ''))
) STORED;
