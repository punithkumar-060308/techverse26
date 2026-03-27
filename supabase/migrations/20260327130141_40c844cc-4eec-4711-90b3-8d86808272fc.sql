
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: authenticated users can read roles
CREATE POLICY "Authenticated users can read roles"
ON public.user_roles FOR SELECT TO authenticated
USING (true);

-- RLS: only admins can manage roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  tech TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('active', 'planning', 'completed')),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can view projects
CREATE POLICY "Authenticated users can view projects"
ON public.projects FOR SELECT TO authenticated
USING (true);

-- Authenticated users can create projects
CREATE POLICY "Authenticated users can create projects"
ON public.projects FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Creators can update their projects
CREATE POLICY "Creators can update their projects"
ON public.projects FOR UPDATE TO authenticated
USING (auth.uid() = created_by);

-- Only admins can delete projects
CREATE POLICY "Only admins can delete projects"
ON public.projects FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at on projects
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
