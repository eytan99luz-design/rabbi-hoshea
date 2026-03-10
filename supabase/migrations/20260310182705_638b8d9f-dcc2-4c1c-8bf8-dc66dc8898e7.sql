
CREATE TABLE public.lesson_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text,
  answered_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.lesson_questions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own questions
CREATE POLICY "Users can ask questions"
ON public.lesson_questions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own questions (to see answers)
CREATE POLICY "Users can view own questions"
ON public.lesson_questions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all questions
CREATE POLICY "Admins can view all questions"
ON public.lesson_questions FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update questions (to add answers)
CREATE POLICY "Admins can answer questions"
ON public.lesson_questions FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete questions
CREATE POLICY "Admins can delete questions"
ON public.lesson_questions FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
