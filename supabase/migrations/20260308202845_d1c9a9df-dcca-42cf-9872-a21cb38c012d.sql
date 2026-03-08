
-- Masechet follows table
CREATE TABLE public.masechet_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  masechet text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, masechet)
);

ALTER TABLE public.masechet_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own follows" ON public.masechet_follows FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can add follows" ON public.masechet_follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove follows" ON public.masechet_follows FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Lesson notes table
CREATE TABLE public.lesson_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, video_id)
);

ALTER TABLE public.lesson_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes" ON public.lesson_notes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can add notes" ON public.lesson_notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON public.lesson_notes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON public.lesson_notes FOR DELETE TO authenticated USING (auth.uid() = user_id);
