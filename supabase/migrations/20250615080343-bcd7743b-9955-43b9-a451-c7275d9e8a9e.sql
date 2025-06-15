
-- Ensure the article-images bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-images', 'article-images', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public;

-- Update policies to ensure proper access
DROP POLICY IF EXISTS "Public read for article-images" ON storage.objects;
DROP POLICY IF EXISTS "Public upload for article-images" ON storage.objects;

-- Allow public read access to images
CREATE POLICY "Public read for article-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'article-images');

-- Allow authenticated and anonymous users to upload images
CREATE POLICY "Public upload for article-images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'article-images');

-- Allow users to delete images they uploaded
CREATE POLICY "Public delete for article-images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'article-images');
