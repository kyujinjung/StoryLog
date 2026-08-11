# StoryLog

StoryLog is a spoiler-safe story memory app for long narratives. Phase 1 focuses on works, episodes, user progress, lore notes, character state, relationship changes, and reveal-order based visibility.

## Run locally

```bash
npm i
npm run dev
```

Open `http://localhost:3000`.

## Environment

Copy the template and fill in your Supabase project values:

```bash
cp .env.local.example .env.local
```

Required:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Optional server-only value for future admin/server jobs:

```bash
SUPABASE_SERVICE_ROLE_KEY=
```

Never expose the service role key with `NEXT_PUBLIC_` and never commit real secrets.

## Supabase migrations

Install and link the Supabase CLI, then apply migrations:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

For a local Supabase stack:

```bash
supabase start
supabase migration up
```

The initial migration lives in `supabase/migrations/20260812000000_phase1_foundation.sql`.

## Development auth path

The works flow uses real Supabase Auth sessions and RLS. Configure the env vars, run the migration, start the app, then use `/login` to request an email magic link; the callback route exchanges the code and redirects to `/works`.

Without Supabase env vars or an active session, `/works` and `/works/new` show explicit setup/login states instead of using mock data.

## Quick review flow

After creating a work and episodes, add plot notes in each episode's `줄거리 메모` field, set your current progress, and open `/works/<work-id>/review`. The review page shows only records with `reveal_order` at or before your saved progress, including recent episode notes, introduced characters, visible events, terms, and personal notes, with a simple safe-set search via `?q=`.

## Relationship graph flow

Add at least two characters on `/works/<work-id>`, set the work progress to an episode where both are revealed, then add an `인물 관계` record with a start/public episode. Open `/works/<work-id>/graph` to see the React Flow relationship graph; nodes and edges are filtered to the saved progress, and edges are dropped unless both endpoint characters are visible.

## Schema notes

All personal Phase 1 tables carry `user_id` and use RLS policies keyed to `auth.uid()`. Lore entities carry `work_id` plus `reveal_episode_id` and `reveal_order` so the app can filter records against `user_progress.reveal_order` before rendering spoilers.
