-- =============================================================================
-- StoryLog: APPLY ONLY Phase 2 community + work cover (idempotent)
-- Do NOT run phase1 foundation here — work_status / works tables already exist.
-- Paste into Supabase SQL Editor and Run once.
-- =============================================================================

-- ---------- Phase 2: community lounge ----------

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'community_post_category' and n.nspname = 'public'
  ) then
    create type public.community_post_category as enum (
      'question',
      'theory',
      'discussion',
      'character',
      'spoiler'
    );
  end if;
end $$;

create table if not exists public.community_spaces (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_key text not null unique,
  medium text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_posts (
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

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  spoiler_reveal_order integer not null default 0 check (spoiler_reveal_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_posts_space_created_idx
  on public.community_posts(space_id, created_at desc);
create index if not exists community_posts_space_spoiler_idx
  on public.community_posts(space_id, spoiler_reveal_order);
create index if not exists community_comments_post_created_idx
  on public.community_comments(post_id, created_at asc);

drop trigger if exists community_spaces_set_updated_at on public.community_spaces;
create trigger community_spaces_set_updated_at
  before update on public.community_spaces
  for each row execute function public.set_updated_at();

drop trigger if exists community_posts_set_updated_at on public.community_posts;
create trigger community_posts_set_updated_at
  before update on public.community_posts
  for each row execute function public.set_updated_at();

drop trigger if exists community_comments_set_updated_at on public.community_comments;
create trigger community_comments_set_updated_at
  before update on public.community_comments
  for each row execute function public.set_updated_at();

alter table public.community_spaces enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;

drop policy if exists "Authenticated users read community spaces" on public.community_spaces;
create policy "Authenticated users read community spaces"
  on public.community_spaces
  for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users create community spaces" on public.community_spaces;
create policy "Authenticated users create community spaces"
  on public.community_spaces
  for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated users read community posts" on public.community_posts;
create policy "Authenticated users read community posts"
  on public.community_posts
  for select
  to authenticated
  using (true);

drop policy if exists "Authors create community posts" on public.community_posts;
create policy "Authors create community posts"
  on public.community_posts
  for insert
  to authenticated
  with check (auth.uid() = author_id);

drop policy if exists "Authors update own community posts" on public.community_posts;
create policy "Authors update own community posts"
  on public.community_posts
  for update
  to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

drop policy if exists "Authors delete own community posts" on public.community_posts;
create policy "Authors delete own community posts"
  on public.community_posts
  for delete
  to authenticated
  using (auth.uid() = author_id);

drop policy if exists "Authenticated users read community comments" on public.community_comments;
create policy "Authenticated users read community comments"
  on public.community_comments
  for select
  to authenticated
  using (true);

drop policy if exists "Authors create community comments" on public.community_comments;
create policy "Authors create community comments"
  on public.community_comments
  for insert
  to authenticated
  with check (auth.uid() = author_id);

drop policy if exists "Authors update own community comments" on public.community_comments;
create policy "Authors update own community comments"
  on public.community_comments
  for update
  to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

drop policy if exists "Authors delete own community comments" on public.community_comments;
create policy "Authors delete own community comments"
  on public.community_comments
  for delete
  to authenticated
  using (auth.uid() = author_id);

-- ---------- Cover image column + storage ----------

alter table public.works
  add column if not exists cover_image_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'work-covers',
  'work-covers',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Work covers public read" on storage.objects;
create policy "Work covers public read"
  on storage.objects
  for select
  using (bucket_id = 'work-covers');

drop policy if exists "Users upload own work covers" on storage.objects;
create policy "Users upload own work covers"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'work-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users update own work covers" on storage.objects;
create policy "Users update own work covers"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'work-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'work-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users delete own work covers" on storage.objects;
create policy "Users delete own work covers"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'work-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
