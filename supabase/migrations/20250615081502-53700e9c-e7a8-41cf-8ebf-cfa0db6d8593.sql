
-- This policy allows users with the 'admin' role to delete articles.
-- It leverages the existing is_admin() function to check for the user's role.
CREATE POLICY "Admins can delete articles"
ON public.articles
FOR DELETE
TO authenticated
USING (public.is_admin());
