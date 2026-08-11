create extension if not exists pgcrypto;

create type work_status as enum ('watching', 'paused', 'completed', 'planned');
create type foreshadow_status as enum ('open', 'resolved', 'dismissed');
create type note_type as enum ('fact', 'theory', 'question', 'todo');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.works (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  medium text,
  genre text,
  description text,
  status work_status not null default 'watching',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.episodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  work_id uuid not null references public.works(id) on delete cascade,
  season_label text,
  episode_label text not null,
  episode_number numeric,
  reveal_order integer not null check (reveal_order >= 0),
  title text,
  summary text,
  released_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (work_id, reveal_order)
);

create table public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  work_id uuid not null references public.works(id) on delete cascade,
  episode_id uuid references public.episodes(id) on delete set null,
  reveal_order integer not null default 0 check (reveal_order >= 0),
  updated_at timestamptz not null default now(),
  unique (user_id, work_id)
);

create table public.factions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  work_id uuid not null references public.works(id) on delete cascade,
  reveal_episode_id uuid references public.episodes(id) on delete set null,
  reveal_order integer not null default 0 check (reveal_order >= 0),
  name text not null,
  kind text,
  goals text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  work_id uuid not null references public.works(id) on delete cascade,
  reveal_episode_id uuid references public.episodes(id) on delete set null,
  reveal_order integer not null default 0 check (reveal_order >= 0),
  faction_id uuid references public.factions(id) on delete set null,
  name text not null,
  aliases text[] not null default '{}',
  role text,
  description text,
  first_appearance_episode_id uuid references public.episodes(id) on delete set null,
  image_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.character_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  work_id uuid not null references public.works(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  reveal_episode_id uuid references public.episodes(id) on delete set null,
  reveal_order integer not null default 0 check (reveal_order >= 0),
  status text,
  affiliation text,
  location text,
  summary text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.relationships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  work_id uuid not null references public.works(id) on delete cascade,
  source_character_id uuid not null references public.characters(id) on delete cascade,
  target_character_id uuid not null references public.characters(id) on delete cascade,
  reveal_episode_id uuid references public.episodes(id) on delete set null,
  reveal_order integer not null default 0 check (reveal_order >= 0),
  relationship_type text not null,
  label text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (source_character_id <> target_character_id)
);

create table public.relationship_changes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  work_id uuid not null references public.works(id) on delete cascade,
  relationship_id uuid not null references public.relationships(id) on delete cascade,
  reveal_episode_id uuid references public.episodes(id) on delete set null,
  reveal_order integer not null default 0 check (reveal_order >= 0),
  change_type text not null,
  summary text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  work_id uuid not null references public.works(id) on delete cascade,
  reveal_episode_id uuid references public.episodes(id) on delete set null,
  reveal_order integer not null default 0 check (reveal_order >= 0),
  title text not null,
  event_type text,
  summary text not null,
  importance integer not null default 3 check (importance between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.terms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  work_id uuid not null references public.works(id) on delete cascade,
  reveal_episode_id uuid references public.episodes(id) on delete set null,
  reveal_order integer not null default 0 check (reveal_order >= 0),
  term text not null,
  category text,
  definition text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.foreshadows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  work_id uuid not null references public.works(id) on delete cascade,
  reveal_episode_id uuid references public.episodes(id) on delete set null,
  reveal_order integer not null default 0 check (reveal_order >= 0),
  title text not null,
  clue text not null,
  theory text,
  resolved_episode_id uuid references public.episodes(id) on delete set null,
  resolved_summary text,
  status foreshadow_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  work_id uuid not null references public.works(id) on delete cascade,
  reveal_episode_id uuid references public.episodes(id) on delete set null,
  reveal_order integer not null default 0 check (reveal_order >= 0),
  title text,
  body text not null,
  note_type note_type not null default 'fact',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index works_user_id_idx on public.works(user_id);
create index episodes_work_reveal_order_idx on public.episodes(work_id, reveal_order);
create index user_progress_user_work_idx on public.user_progress(user_id, work_id);
create index factions_work_reveal_order_idx on public.factions(work_id, reveal_order);
create index characters_work_reveal_order_idx on public.characters(work_id, reveal_order);
create index character_states_character_reveal_order_idx on public.character_states(character_id, reveal_order);
create index relationships_work_reveal_order_idx on public.relationships(work_id, reveal_order);
create index relationship_changes_relationship_reveal_order_idx on public.relationship_changes(relationship_id, reveal_order);
create index events_work_reveal_order_idx on public.events(work_id, reveal_order);
create index terms_work_reveal_order_idx on public.terms(work_id, reveal_order);
create index foreshadows_work_reveal_order_idx on public.foreshadows(work_id, reveal_order);
create index notes_work_reveal_order_idx on public.notes(work_id, reveal_order);

create trigger works_set_updated_at before update on public.works
for each row execute function public.set_updated_at();
create trigger episodes_set_updated_at before update on public.episodes
for each row execute function public.set_updated_at();
create trigger factions_set_updated_at before update on public.factions
for each row execute function public.set_updated_at();
create trigger characters_set_updated_at before update on public.characters
for each row execute function public.set_updated_at();
create trigger character_states_set_updated_at before update on public.character_states
for each row execute function public.set_updated_at();
create trigger relationships_set_updated_at before update on public.relationships
for each row execute function public.set_updated_at();
create trigger relationship_changes_set_updated_at before update on public.relationship_changes
for each row execute function public.set_updated_at();
create trigger events_set_updated_at before update on public.events
for each row execute function public.set_updated_at();
create trigger terms_set_updated_at before update on public.terms
for each row execute function public.set_updated_at();
create trigger foreshadows_set_updated_at before update on public.foreshadows
for each row execute function public.set_updated_at();
create trigger notes_set_updated_at before update on public.notes
for each row execute function public.set_updated_at();
create trigger user_progress_set_updated_at before update on public.user_progress
for each row execute function public.set_updated_at();

alter table public.works enable row level security;
alter table public.episodes enable row level security;
alter table public.user_progress enable row level security;
alter table public.factions enable row level security;
alter table public.characters enable row level security;
alter table public.character_states enable row level security;
alter table public.relationships enable row level security;
alter table public.relationship_changes enable row level security;
alter table public.events enable row level security;
alter table public.terms enable row level security;
alter table public.foreshadows enable row level security;
alter table public.notes enable row level security;

create policy "Users manage their works" on public.works
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their episodes" on public.episodes
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their progress" on public.user_progress
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their factions" on public.factions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their characters" on public.characters
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their character states" on public.character_states
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their relationships" on public.relationships
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their relationship changes" on public.relationship_changes
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their events" on public.events
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their terms" on public.terms
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their foreshadows" on public.foreshadows
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their notes" on public.notes
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
