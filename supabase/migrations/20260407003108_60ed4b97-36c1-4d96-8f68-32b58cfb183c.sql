
-- FIX 1: Prevent privilege escalation - restrict self-role insertion to 'subscriber' only
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
CREATE POLICY "Users can insert own subscriber role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND role = 'subscriber');

-- FIX 2: Add input validation to get_profile_by_slug
CREATE OR REPLACE FUNCTION public.get_profile_by_slug(p_slug text)
RETURNS TABLE(id uuid, user_id uuid, name text, slug text, crp text, specialty text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Validate slug input
  IF p_slug IS NULL OR length(p_slug) > 100 OR p_slug !~ '^[a-z0-9-]+$' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.name,
    p.slug,
    p.crp,
    p.specialty
  FROM public.profiles p
  WHERE p.slug = p_slug
  LIMIT 1;
END;
$$;

-- FIX 3: Add missing UPDATE policy on patient_files
CREATE POLICY "Users can update own patient files"
ON public.patient_files
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND public.has_active_subscription(auth.uid()));
