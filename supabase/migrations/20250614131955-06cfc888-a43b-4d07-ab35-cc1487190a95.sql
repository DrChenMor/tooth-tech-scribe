
-- 1. Create a table for public user profiles
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  updated_at timestamptz DEFAULT now()
);

-- Add comments for clarity
COMMENT ON TABLE public.profiles IS 'Stores public profile information for each user.';
COMMENT ON COLUMN public.profiles.id IS 'References the user''s ID from the auth.users table.';

-- Set up Row Level Security (RLS) for the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- This trigger automatically creates a profile for new users upon signup.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Create role management system
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
COMMENT ON TYPE public.app_role IS 'Defines the roles a user can have in the application.';

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
COMMENT ON TABLE public.user_roles IS 'Assigns roles to users.';

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- This function checks if the currently logged-in user is an admin.
-- It's a security definer, so it can bypass RLS rules to check the user_roles table.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- RLS policies for user_roles table
CREATE POLICY "Allow admins to view all user roles"
  ON public.user_roles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Allow individual user to view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Allow admins to manage all roles"
  ON public.user_roles FOR ALL
  USING (public.is_admin());
