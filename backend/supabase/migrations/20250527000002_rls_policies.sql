-- vendors
alter table public.vendors enable row level security;

create policy "public select vendors"
  on public.vendors for select
  using (true);

create policy "owners insert vendors"
  on public.vendors for insert
  with check (auth.uid() = user_id);

create policy "owners update own vendors"
  on public.vendors for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "admin manage vendor flags"
  on public.vendors for update
  using (auth.uid() in (select user_id from public.admin_users))
  with check (auth.uid() in (select user_id from public.admin_users));

-- posts
alter table public.posts enable row level security;

create policy "public select posts"
  on public.posts for select
  using (true);

-- reviews
alter table public.reviews enable row level security;

create policy "public select reviews"
  on public.reviews for select
  using (true);

create policy "authenticated insert reviews"
  on public.reviews for insert
  with check (auth.uid() = user_id);

create policy "owner update reviews"
  on public.reviews for update
  using (auth.uid() = user_id);

create policy "owner delete reviews"
  on public.reviews for delete
  using (auth.uid() = user_id);

-- votes
alter table public.votes enable row level security;

create policy "select own votes"
  on public.votes for select
  using (auth.uid() = user_id);

create policy "insert own votes"
  on public.votes for insert
  with check (auth.uid() = user_id);

create policy "update own votes"
  on public.votes for update
  using (auth.uid() = user_id);

create policy "delete own votes"
  on public.votes for delete
  using (auth.uid() = user_id);

-- subreddits_config: service role only (no policies = blocked for anon/authenticated)
alter table public.subreddits_config enable row level security;

-- admin_users: enable row level security and allow users to check if they are admin
alter table public.admin_users enable row level security;

create policy "users select own admin status"
  on public.admin_users for select
  using (auth.uid() = user_id);

