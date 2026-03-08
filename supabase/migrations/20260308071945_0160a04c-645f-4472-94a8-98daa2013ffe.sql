
CREATE TABLE public.email_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed boolean NOT NULL DEFAULT false
);

ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe" ON public.email_subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view subscribers" ON public.email_subscribers
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
