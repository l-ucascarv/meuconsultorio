
-- Fix 1: Remove email from get_profile_by_slug to prevent email harvesting
DROP FUNCTION IF EXISTS public.get_profile_by_slug(text);

CREATE OR REPLACE FUNCTION public.get_profile_by_slug(p_slug text)
 RETURNS TABLE(id uuid, user_id uuid, name text, slug text, crp text, specialty text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT 
        id,
        user_id,
        name,
        slug,
        crp,
        specialty
    FROM public.profiles
    WHERE slug = p_slug
    LIMIT 1
$function$;
