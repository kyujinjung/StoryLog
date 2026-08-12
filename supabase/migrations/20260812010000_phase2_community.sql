-- Phase 2: spoiler-safe community lounge shared by work title.

create type public.community_post_category as enum (
  'question',
  'theory',
  'discussion',
  'character',
  'spoiler'
);

create table public.community_spaces (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_key text not null unique,
  medium text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.community_spaces(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  category public.community_post_category not null default 'question',
  title text not null,
  body text not null,
  spoiler_reveal_order integer not null default 0 check (spoiler_reveal_order >= 0),
  spoiler_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  spoiler_reveal_order integer not null default 0 check (spoiler_reveal_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index community_posts_space_created_idx
  on public.community_posts(space_id, created_at desc);
create index community_posts_space_spoiler_idx
  on public.community_posts(space_id, spoiler_reveal_order);
create index community_comments_post_created_idx
  on public.community_comments(post_id, created_at asc);

create trigger community_spaces_set_updated_at
  before update on public.community_spaces
  for each row execute function public.set_updated_at();
create trigger community_posts_set_updated_at
  before update on public.community_posts
  for each row execute function public.set_updated_at();
create trigger community_comments_set_updated_at
  before update on public.community_comments
  for each row execute function public.set_updated_at();

alter table public.community_spaces enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;

-- Authenticated users can read shared lounges; anyone signed in can open a space.
create policy "Authenticated users read community spaces"
  on public.community_spaces
  for select
  to authenticated
  using (true);

create policy "Authenticated users create community spaces"
  on public.community_spaces
  for insert
  to authenticated
  with check (true);

create policy "Authenticated users read community posts"
  on public.community_posts
  for select
  to authenticated
  using (true);

create policy "Authors create community posts"
  on public.community_posts
  for insert
  to authenticated
  with check (auth.uid() = author_id);

create policy "Authors update own community posts"
  on public.community_posts
  for update
  to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "Authors delete own community posts"
  on public.community_posts
  for delete
  to authenticated
  using (auth.uid() = author_id);

create policy "Authenticated users read community comments"
  on public.community_comments
  for select
  to authenticated
  using (true);

create policy "Authors create community comments"
  on public.community_comments
  for insert
  to authenticated
  with check (auth.uid() = author_id);

create policy "Authors update own community comments"
  on public.community_comments
  for update
  to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "Authors delete own community comments"
  on public.community_comments
  for delete
  to authenticated
  using (auth.uid() = author_id);
