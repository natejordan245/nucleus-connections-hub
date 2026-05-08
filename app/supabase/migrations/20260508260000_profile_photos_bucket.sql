-- ─────────────────────────────────────────────────────────────────────────────
-- Public storage bucket for profile / company logo photos.
-- Read = open (public bucket). Write = the auth user can only upload under
-- a path prefix matching their own uid: `{auth.uid()}/...`.
-- ─────────────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

-- Public read.
drop policy if exists "profile_photos_public_read" on storage.objects;
create policy "profile_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'profile-photos');

-- Insert: only into your own folder.
drop policy if exists "profile_photos_insert_own" on storage.objects;
create policy "profile_photos_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Update: only your own files.
drop policy if exists "profile_photos_update_own" on storage.objects;
create policy "profile_photos_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Delete: only your own files.
drop policy if exists "profile_photos_delete_own" on storage.objects;
create policy "profile_photos_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
