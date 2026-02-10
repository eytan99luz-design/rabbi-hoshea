
-- Create table for storing video lessons
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  youtube_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  masechet TEXT,
  daf INTEGER,
  thumbnail_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Public read access (educational content)
CREATE POLICY "Videos are publicly readable"
  ON public.videos
  FOR SELECT
  USING (true);

-- Create indexes for search/filter
CREATE INDEX idx_videos_masechet ON public.videos (masechet);
CREATE INDEX idx_videos_daf ON public.videos (masechet, daf);
CREATE INDEX idx_videos_published_at ON public.videos (published_at DESC);
CREATE INDEX idx_videos_youtube_id ON public.videos (youtube_id);
