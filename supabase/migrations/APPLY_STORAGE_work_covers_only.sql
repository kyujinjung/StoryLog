-- =============================================================================
-- StoryLog: create ONLY the work-covers storage bucket + policies
-- Run in Supabase SQL Editor if tables/columns already exist but bucket is missing.
-- =============================================================================

-- Some projects block insert into storage.buckets via SQL; if this fails,
-- create the bucket in Dashboard → Storage → New bucket (see docs/deploy.md).

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

-- Verify
select id, name, public, file_size_limit from storage.buckets where id = 'work-covers';
