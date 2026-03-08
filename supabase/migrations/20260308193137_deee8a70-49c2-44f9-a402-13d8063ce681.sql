-- Playlists table
CREATE TABLE public.playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own playlists" ON public.playlists
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create playlists" ON public.playlists
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own playlists" ON public.playlists
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own playlists" ON public.playlists
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Playlist items table
CREATE TABLE public.playlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(playlist_id, video_id)
);

ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own playlist items" ON public.playlist_items
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.playlists WHERE id = playlist_id AND user_id = auth.uid()));
CREATE POLICY "Users can add playlist items" ON public.playlist_items
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.playlists WHERE id = playlist_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete playlist items" ON public.playlist_items
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.playlists WHERE id = playlist_id AND user_id = auth.uid()));

-- Video tags table
CREATE TABLE public.video_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  tag text NOT NULL,
  UNIQUE(video_id, tag)
);

ALTER TABLE public.video_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tags are publicly readable" ON public.video_tags
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage tags" ON public.video_tags
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete tags" ON public.video_tags
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));