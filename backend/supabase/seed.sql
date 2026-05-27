-- seed starter subreddits for the Sylvia polling worker
insert into public.subreddits_config (subreddit)
values
  ('Streetwear'),
  ('malefashionadvice'),
  ('femalefashionadvice'),
  ('sneakers'),
  ('rawdenim'),
  ('VintageFashion'),
  ('handbags'),
  ('outfits'),
  ('frugalmalefashion')
on conflict (subreddit) do nothing;
