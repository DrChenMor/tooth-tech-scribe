-- Fix RLS policies for categories table
DROP POLICY IF EXISTS "Authenticated users can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can update categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can delete categories" ON public.categories;

-- Create more permissive policies for authenticated users
CREATE POLICY "Authenticated users can insert categories" ON public.categories
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update categories" ON public.categories
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete categories" ON public.categories
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Populate categories table with existing data from articles if empty
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
        WHEN category = 'AI Generated' THEN 'AI-generated content and insights'
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