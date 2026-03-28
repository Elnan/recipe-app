-- Storage bucket policy: allow public read, authenticated write
-- (Bucket itself is created via dashboard, this just sets RLS)
insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', true)
on conflict (id) do nothing;

create policy "Public read access"
  on storage.objects for select
  using (bucket_id = 'recipe-images');

create policy "Allow uploads"
  on storage.objects for insert
  with check (bucket_id = 'recipe-images');

create policy "Allow updates"
  on storage.objects for update
  using (bucket_id = 'recipe-images');

create policy "Allow deletes"
  on storage.objects for delete
  using (bucket_id = 'recipe-images');
