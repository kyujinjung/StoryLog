-- Work cover/poster image for list and detail UI.

alter table public.works
  add column if not exists cover_image_url text;

-- Public bucket for cover posters (path: {user_id}/{work_id}-{timestamp}.ext)
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

-- Storage policies: authenticated users manage objects under their user folder.
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
