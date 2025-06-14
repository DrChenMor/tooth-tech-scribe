
-- Create an enum type for article status
CREATE TYPE public.article_status AS ENUM ('draft', 'published', 'archived');

-- Add status and views columns to the articles table
ALTER TABLE public.articles
ADD COLUMN status public.article_status NOT NULL DEFAULT 'draft',
ADD COLUMN views integer NOT NULL DEFAULT 0;

-- Enable RLS for the articles table if not already enabled
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Policy for public read access to published articles
-- We will drop it if it exists and recreate it to make sure it's up to date.
DROP POLICY IF EXISTS "Allow public read access to published articles" ON public.articles;
CREATE POLICY "Allow public read access to published articles"
  ON public.articles FOR SELECT
  USING (status = 'published');

-- Policy for admin full access
DROP POLICY IF EXISTS "Allow admin full access" ON public.articles;
CREATE POLICY "Allow admin full access"
  ON public.articles FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
