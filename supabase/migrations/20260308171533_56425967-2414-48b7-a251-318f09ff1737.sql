
-- Site settings table for admin-configurable content
CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Settings are publicly readable" ON public.site_settings
  FOR SELECT USING (true);

-- Only admins can modify
CREATE POLICY "Admins can insert settings" ON public.site_settings
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update settings" ON public.site_settings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete settings" ON public.site_settings
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to manage videos (insert/update/delete)
CREATE POLICY "Admins can update videos" ON public.videos
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete videos" ON public.videos
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert videos" ON public.videos
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default settings
INSERT INTO public.site_settings (key, value) VALUES
  ('hero_title', 'בית המדרש הדיגיטלי'),
  ('hero_subtitle', 'שיעורי תורה מפי הרב הושע רבינוביץ׳ — לימוד גמרא מסודר לפי מסכת ודף'),
  ('hero_badge', 'שיעורי גמרא יומיים'),
  ('footer_text', 'שיעורי הרב הושע רבינוביץ׳');
