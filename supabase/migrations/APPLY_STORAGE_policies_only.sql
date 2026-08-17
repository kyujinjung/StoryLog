-- =============================================================================
-- Run AFTER the bucket "work-covers" exists in Dashboard → Storage.
-- This only creates RLS policies on storage.objects (does not create the bucket).
-- =============================================================================

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
