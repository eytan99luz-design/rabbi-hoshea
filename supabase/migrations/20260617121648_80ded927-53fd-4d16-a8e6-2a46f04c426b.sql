ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS transcript TEXT,
  ADD COLUMN IF NOT EXISTS transcript_fetched_at TIMESTAMPTZ;