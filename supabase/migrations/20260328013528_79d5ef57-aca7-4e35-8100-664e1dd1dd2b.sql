
-- Read receipts table
CREATE TABLE public.message_read_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  user_id uuid NOT NULL,
  read_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id)
);

ALTER TABLE public.message_read_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read receipts"
  ON public.message_read_receipts FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Users can insert own read receipts"
  ON public.message_read_receipts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Enable realtime for read receipts
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_read_receipts;
