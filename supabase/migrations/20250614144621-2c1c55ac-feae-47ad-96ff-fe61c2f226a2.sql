
-- Create a new bucket for article images
insert into storage.buckets
  (id, name, public)
values
  ('article-images', 'article-images', true);

-- Allow public read access to the bucket so anyone can see the images
create policy "Public read for article-images"
  on storage.objects for select
  using ( bucket_id = 'article-images' );

-- Allow anyone to upload images to the bucket, which is needed for our "demo mode"
create policy "Public upload for article-images"
  on storage.objects for insert
  with check ( bucket_id = 'article-images' );
