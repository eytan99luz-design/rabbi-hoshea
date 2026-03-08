CREATE OR REPLACE FUNCTION public.get_masechet_counts()
RETURNS TABLE(masechet text, count bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = 'public'
AS $$
  SELECT masechet, count(*) as count
  FROM public.videos
  WHERE masechet IS NOT NULL
  GROUP BY masechet
  ORDER BY masechet
$$;