-- Create categories table for better category management
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies for categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Allow public read access to categories
CREATE POLICY "Public read access for categories" ON public.categories
    FOR SELECT USING (true);

-- Allow authenticated users to insert categories (admin only in practice)
CREATE POLICY "Authenticated users can insert categories" ON public.categories
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update categories (admin only in practice)
CREATE POLICY "Authenticated users can update categories" ON public.categories
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete categories (admin only in practice)
CREATE POLICY "Authenticated users can delete categories" ON public.categories
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON public.categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- First, let's check if we need to add an icon column
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS icon TEXT;

-- Insert existing categories from articles table first
INSERT INTO public.categories (name, description, icon)
SELECT DISTINCT
    category as name,
    CASE 
        WHEN category = 'AI Technology' THEN 'Latest developments in artificial intelligence for dentistry'
        WHEN category = 'Research' THEN 'Scientific research and studies in dental technology'
        WHEN category = 'Industry' THEN 'Breaking news and updates from the dental industry'
        WHEN category = 'Industry News' THEN 'Breaking news and updates from the dental industry'
        WHEN category = 'Tools' THEN 'Dental tools, software, and technology solutions'
        WHEN category = 'Tools & Software' THEN 'Dental tools, software, and technology solutions'
        WHEN category = 'News' THEN 'Latest news in dental technology'
        WHEN category = 'Tech' THEN 'Technology advancements in dentistry'
        WHEN category = 'General' THEN 'General dental topics and information'
        ELSE CONCAT('Articles about ', category)
    END as description,
    CASE 
        WHEN category ILIKE '%AI%' OR category ILIKE '%technology%' THEN 'brain'
        WHEN category ILIKE '%research%' THEN 'microscope'
        WHEN category ILIKE '%industry%' OR category ILIKE '%news%' THEN 'newspaper'
        WHEN category ILIKE '%tool%' OR category ILIKE '%software%' THEN 'wrench'
        WHEN category ILIKE '%general%' THEN 'stethoscope'
        ELSE 'tag'
    END as icon
FROM public.articles 
WHERE category IS NOT NULL AND category != ''
ON CONFLICT (name) DO NOTHING;

-- Insert some default categories if they don't exist (fallback)
INSERT INTO public.categories (name, description, icon) VALUES
    ('AI Technology', 'Latest developments in artificial intelligence for dentistry', 'brain'),
    ('Research', 'Scientific research and studies in dental technology', 'microscope'),
    ('Industry News', 'Breaking news and updates from the dental industry', 'newspaper'),
    ('Tools & Software', 'Dental tools, software, and technology solutions', 'wrench')
ON CONFLICT (name) DO NOTHING;

-- Create a view for categories with article counts
DROP VIEW IF EXISTS public.categories_with_article_counts;
CREATE OR REPLACE VIEW public.categories_with_article_counts AS
SELECT 
    c.id,
    c.name,
    c.description,
    c.image_url,
    c.icon,
    c.created_at,
    c.updated_at,
    COALESCE(article_counts.count, 0) as article_count
FROM public.categories c
LEFT JOIN (
    SELECT category, COUNT(*) as count
    FROM public.articles
    WHERE category IS NOT NULL
    GROUP BY category
) article_counts ON c.name = article_counts.category
ORDER BY c.name;

-- Grant access to the view
GRANT SELECT ON public.categories_with_article_counts TO anon, authenticated; 