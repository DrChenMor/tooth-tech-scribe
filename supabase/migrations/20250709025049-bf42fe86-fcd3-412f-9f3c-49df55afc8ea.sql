-- Update content_queue RLS policy to allow public read access for testing
DROP POLICY IF EXISTS "Admins can manage content queue" ON public.content_queue;

-- Create new policies that allow broader access for debugging
CREATE POLICY "Anyone can read content queue" 
ON public.content_queue 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage content queue" 
ON public.content_queue 
FOR ALL 
USING (is_admin());