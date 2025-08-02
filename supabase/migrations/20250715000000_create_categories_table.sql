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
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update categories (admin only in practice)
CREATE POLICY "Authenticated users can update categories" ON public.categories
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete categories (admin only in practice)
CREATE POLICY "Authenticated users can delete categories" ON public.categories
    FOR DELETE USING (auth.role() = 'authenticated');

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

-- Insert some default categories if they don't exist
INSERT INTO public.categories (name, description) VALUES
    ('AI Technology', 'Latest developments in artificial intelligence for dentistry'),
    ('Research', 'Scientific research and studies in dental technology'),
    ('Industry News', 'Breaking news and updates from the dental industry'),
    ('Tools & Software', 'Dental tools, software, and technology solutions')
ON CONFLICT (name) DO NOTHING;

-- Create a view for categories with article counts
CREATE OR REPLACE VIEW public.categories_with_article_counts AS
SELECT 
    c.id,
    c.name,
    c.description,
    c.image_url,
    c.created_at,
    c.updated_at,
    COUNT(a.id) as article_count
FROM public.categories c
LEFT JOIN public.articles a ON c.name = a.category
GROUP BY c.id, c.name, c.description, c.image_url, c.created_at, c.updated_at
ORDER BY c.name;

-- Grant access to the view
GRANT SELECT ON public.categories_with_article_counts TO anon, authenticated; 