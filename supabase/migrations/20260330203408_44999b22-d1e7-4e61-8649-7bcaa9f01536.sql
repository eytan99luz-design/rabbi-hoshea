
CREATE TABLE public.sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at timestamp with time zone NOT NULL DEFAULT now(),
  new_videos integer NOT NULL DEFAULT 0,
  total_processed integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'success',
  error_message text
);

ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sync logs are publicly readable" ON public.sync_logs FOR SELECT TO public USING (true);
CREATE POLICY "Service role can insert logs" ON public.sync_logs FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
