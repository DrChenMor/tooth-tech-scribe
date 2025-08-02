-- Fix storage policies to allow authenticated users to upload images
-- Drop existing upload policies and recreate them with proper authentication

DROP POLICY IF EXISTS "Public upload for article-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload for article-images" ON storage.objects;

-- Allow authenticated users to upload to article-images bucket
CREATE POLICY "Authenticated upload for article-images"
  ON storage.objects 
  FOR INSERT 
  TO authenticated
  WITH CHECK (bucket_id = 'article-images');

-- Also allow upsert operations (for replacing existing images)
DROP POLICY IF EXISTS "Authenticated upsert for article-images" ON storage.objects;
CREATE POLICY "Authenticated upsert for article-images"
  ON storage.objects 
  FOR UPDATE 
  TO authenticated
  USING (bucket_id = 'article-images')
  WITH CHECK (bucket_id = 'article-images');

-- Ensure authenticated users can still delete images they upload
DROP POLICY IF EXISTS "Authenticated delete for article-images" ON storage.objects;
CREATE POLICY "Authenticated delete for article-images"
  ON storage.objects 
  FOR DELETE 
  TO authenticated
  USING (bucket_id = 'article-images');