-- Add RLS policies for global theme tables

-- Enable RLS on global_theme_settings
ALTER TABLE public.global_theme_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active themes
CREATE POLICY "Anyone can read active global themes" 
ON public.global_theme_settings 
FOR SELECT 
USING (is_active = true);

-- Allow admins to manage all themes
CREATE POLICY "Admins can manage global themes" 
ON public.global_theme_settings 
FOR ALL 
USING (is_admin());

-- Enable RLS on site_settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to site settings
CREATE POLICY "Anyone can read site settings" 
ON public.site_settings 
FOR SELECT 
USING (true);

-- Allow admins to manage site settings
CREATE POLICY "Admins can manage site settings" 
ON public.site_settings 
FOR ALL 
USING (is_admin()); 