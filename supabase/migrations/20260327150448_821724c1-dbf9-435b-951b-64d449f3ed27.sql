
-- Create project_tasks table
CREATE TABLE public.project_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'todo',
  priority text NOT NULL DEFAULT 'medium',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view tasks
CREATE POLICY "Authenticated users can view tasks"
  ON public.project_tasks FOR SELECT
  TO authenticated
  USING (true);

-- Only project creator can insert tasks
CREATE POLICY "Project creator can add tasks"
  ON public.project_tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.projects WHERE id = project_id AND created_by = auth.uid()
    )
  );

-- Project members can update tasks (change status/progress)
CREATE POLICY "Project members can update tasks"
  ON public.project_tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = project_tasks.project_id
      AND project_members.user_id = auth.uid()
    )
  );

-- Project creator can delete tasks
CREATE POLICY "Project creator can delete tasks"
  ON public.project_tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects WHERE id = project_id AND created_by = auth.uid()
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_project_tasks_updated_at
  BEFORE UPDATE ON public.project_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for project tasks
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_tasks;
