create extension if not exists pgcrypto with schema extensions;

-- vendors
create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  tracking_code text not null unique
    default 'TRK-' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 5)),
  display_name text,
  category text check (category in (
    'Footwear', 'Streetwear', 'Outerwear', 'Accessories', 'Denim',
    'Vintage', 'Sportswear', 'Formal', 'Bags', 'Headwear', 'Other'
  )),
  bio text,
  website text,
  telegram text,
  other_contacts jsonb,
  min_price numeric,
  max_price numeric,
  is_verified boolean default false,
  is_featured boolean default false,
  verified_at timestamptz,
  featured_at timestamptz,
  search_vector tsvector generated always as (
    to_tsvector('english',
      coalesce(display_name, '') || ' ' || coalesce(category, '') || ' ' || coalesce(bio, '')
    )
  ) stored,
  created_at timestamptz default now()
);

-- posts
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references public.vendors(id) on delete set null,
  reddit_post_id text not null unique,
  title text,
  subreddit text,
  author text,
  post_url text,
  body_snippet text,
  body_full text,
  images jsonb,
  thumbnail text,
  extracted_price text,
  reddit_score int,
  created_utc timestamptz,
  ingested_at timestamptz default now(),
  search_vector tsvector generated always as (
    to_tsvector('english',
      coalesce(title, '') || ' ' || coalesce(body_full, '')
    )
  ) stored
);

-- reviews
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating int check (rating between 1 and 5),
  body text,
  created_at timestamptz default now(),
  unique (vendor_id, user_id)
);

-- votes
create table public.votes (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  value int check (value in (-1, 1)),
  created_at timestamptz default now(),
  unique (vendor_id, user_id)
);

-- subreddits_config
create table public.subreddits_config (
  id uuid primary key default gen_random_uuid(),
  subreddit text not null unique,
  active boolean default true,
  added_at timestamptz default now()
);

-- admin_users
create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);
