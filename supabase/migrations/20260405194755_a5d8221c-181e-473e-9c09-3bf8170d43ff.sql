
CREATE TABLE public.article_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  page_number integer NOT NULL,
  label text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, article_id, page_number)
);

ALTER TABLE public.article_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks" ON public.article_bookmarks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can add bookmarks" ON public.article_bookmarks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete bookmarks" ON public.article_bookmarks FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.article_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text,
  answered_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.article_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can ask article questions" ON public.article_questions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own article questions" ON public.article_questions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all article questions" ON public.article_questions FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can answer article questions" ON public.article_questions FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete article questions" ON public.article_questions FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
