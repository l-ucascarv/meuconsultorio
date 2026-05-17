-- Trigger-only functions: revoke EXECUTE from everyone (triggers run as table owner)
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_profile_from_subscription() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Helper functions used in RLS: revoke from PUBLIC/anon, keep authenticated
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.has_active_subscription(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid) TO authenticated;

-- Public lookup function: explicitly grant to anon + authenticated (used by public booking page)
REVOKE ALL ON FUNCTION public.get_profile_by_slug(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_profile_by_slug(text) TO anon, authenticated;