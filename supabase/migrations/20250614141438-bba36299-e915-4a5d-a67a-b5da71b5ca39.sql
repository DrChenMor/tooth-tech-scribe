
-- Temporarily allow all users to manage articles for demo purposes.
-- This is insecure and should be reverted before going to production.
DROP POLICY IF EXISTS "Allow admin full access" ON public.articles;
CREATE POLICY "Allow admin full access"
  ON public.articles FOR ALL
  USING (true)
  WITH CHECK (true);
