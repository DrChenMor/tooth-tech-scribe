
-- First, drop the overly permissive policy that allows anyone to delete images.
DROP POLICY IF EXISTS "Public delete for article-images" ON storage.objects;

-- Then, create a new, more secure policy that only allows users with the 'admin'
-- role to delete images from the 'article-images' bucket. This uses the
-- is_admin() helper function we have in the database.
CREATE POLICY "Admins can delete article images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'article-images' AND public.is_admin());
