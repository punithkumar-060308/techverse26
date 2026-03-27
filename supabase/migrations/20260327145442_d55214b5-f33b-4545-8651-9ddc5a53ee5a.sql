
-- Add max_members column to projects
ALTER TABLE public.projects ADD COLUMN max_members integer NOT NULL DEFAULT 5;

-- Create project_members join table
CREATE TABLE public.project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Enable RLS
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- Policies for project_members
CREATE POLICY "Authenticated users can view project members"
  ON public.project_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can join projects"
  ON public.project_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave projects"
  ON public.project_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Update projects RLS: allow members to update projects
DROP POLICY "Creators can update their projects" ON public.projects;
CREATE POLICY "Members and creators can update their projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = projects.id
      AND project_members.user_id = auth.uid()
    )
  );

-- Auto-add creator as member via trigger
CREATE OR REPLACE FUNCTION public.auto_add_creator_as_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.project_members (project_id, user_id)
  VALUES (NEW.id, NEW.created_by)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_project_created_add_member
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_add_creator_as_member();
