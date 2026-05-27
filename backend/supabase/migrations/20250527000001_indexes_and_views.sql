-- full-text search indexes
create index posts_search_idx on public.posts using gin (search_vector);
create index vendors_search_idx on public.vendors using gin (search_vector);

-- lookup indexes
create index posts_vendor_id_idx on public.posts (vendor_id);
create index posts_created_utc_idx on public.posts (created_utc desc);
create index vendors_featured_idx on public.vendors (is_featured desc, is_verified desc);

-- vendor rankings view
create or replace view public.vendor_rankings as
select
  v.id,
  v.tracking_code,
  v.display_name,
  v.category,
  v.bio,
  v.website,
  v.telegram,
  v.other_contacts,
  v.min_price,
  v.max_price,
  v.is_verified,
  v.is_featured,
  v.created_at,
  coalesce(avg(r.rating), 0) as avg_rating,
  count(distinct r.id) as review_count,
  count(distinct p.id) as post_count,
  coalesce(sum(vt.value), 0) as vote_score,
  max(p.ingested_at) as latest_post_at,
  (
    coalesce(avg(r.rating), 0) * 0.7
    + ln(1 + count(distinct p.id) + count(distinct r.id)) * 0.3
  ) as rank_score,
  (
    select thumbnail
    from public.posts
    where vendor_id = v.id and thumbnail is not null
    order by created_utc desc
    limit 1
  ) as latest_thumbnail
from public.vendors v
left join public.reviews r on r.vendor_id = v.id
left join public.posts p on p.vendor_id = v.id
left join public.votes vt on vt.vendor_id = v.id
group by v.id;
