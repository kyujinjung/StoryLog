# StoryLog

StoryLog is a spoiler-safe story memory app for long narratives. Phase 1 focuses on works, episodes, user progress, lore notes, character state, relationship changes, and reveal-order based visibility.

**작업 진행사항:** [`docs/progress.md`](./docs/progress.md)  
**기획 원본:** [`docs/app_idea.md`](./docs/app_idea.md)

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

Optional server-only values:

```bash
SUPABASE_SERVICE_ROLE_KEY=
XAI_API_KEY=
# XAI_MODEL=grok-4.5
```

- `XAI_API_KEY` powers **AI 초안 정리** (SpaceXAI / xAI OpenAI-compatible API at `https://api.x.ai/v1`).
- Never expose service role or `XAI_API_KEY` with `NEXT_PUBLIC_` and never commit real secrets.

## AI draft flow

On `/works/<work-id>`:

1. Pick the episode that should be the **reveal point** for extracted lore.
2. Paste episode notes (optionally include the saved episode summary).
3. Click **AI 초안 만들기** — the model returns candidates for characters, events, terms, notes, and relationships.
4. Uncheck anything wrong, then **선택한 초안 저장**.

AI never auto-saves; approval is required. Without `XAI_API_KEY`, the panel explains how to configure the key.

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

## Work cover images

Apply `supabase/migrations/20260812020000_work_cover_image.sql` to add `works.cover_image_url` and the public `work-covers` storage bucket.

- Create work: optional file upload or image URL
- Work detail: update/remove poster under **대표 이미지**
- Works list: CGV-style poster grid using the cover

## Community lounge (Phase 2)

Apply the Phase 2 migration (`supabase/migrations/20260812010000_phase2_community.sql`) in the Supabase SQL editor.

Then open `/works/<work-id>/lounge`:

1. Posts are shared by **normalized work title** (same title → same lounge).
2. Every post/comment has a **spoiler range** (episode reveal order).
3. Only posts with `spoiler_reveal_order <= your progress` are shown.
4. Use **내 메모로** to copy a visible post into personal notes.

Without the migration, creating a post will show a clear error asking you to run Phase 2 SQL.

## Schema notes

All personal Phase 1 tables carry `user_id` and use RLS policies keyed to `auth.uid()`. Lore entities carry `work_id` plus `reveal_episode_id` and `reveal_order` so the app can filter records against `user_progress.reveal_order` before rendering spoilers.
