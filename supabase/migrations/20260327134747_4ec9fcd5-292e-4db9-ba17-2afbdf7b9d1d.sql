
-- Chat messages table with thread/reply support
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  channel text NOT NULL DEFAULT 'general',
  content text NOT NULL,
  reply_to uuid REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  thread_id uuid REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  mentions text[] NOT NULL DEFAULT '{}',
  is_code boolean NOT NULL DEFAULT false,
  code_language text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can read messages"
  ON public.chat_messages FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert messages"
  ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages"
  ON public.chat_messages FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
