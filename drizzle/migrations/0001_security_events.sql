CREATE TABLE public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  event_type text NOT NULL,
  details jsonb,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX security_events_user_type_time ON public.security_events (user_id, event_type, created_at DESC);
CREATE INDEX security_events_email_time ON public.security_events (email, event_type, created_at DESC);
GRANT SELECT, INSERT ON public.security_events TO authenticated;
GRANT ALL ON public.security_events TO service_role;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own events" ON public.security_events FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()) AND event_type IN ('login','logout','password_changed','mfa_enabled','mfa_disabled','account_deleted'));
CREATE POLICY "Users view own events" ON public.security_events FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));
CREATE POLICY "Admins view all events" ON public.security_events FOR SELECT TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'));

-- Failed login logging + brute-force check (callable before sign-in)
CREATE OR REPLACE FUNCTION public.register_failed_login(p_email text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _cnt int;
BEGIN
  IF p_email IS NULL OR length(p_email) > 255 OR p_email !~ '^[^@\s]+@[^@\s]+$' THEN RETURN 0; END IF;
  INSERT INTO public.security_events (email, event_type) VALUES (lower(p_email), 'login_failed');
  SELECT count(*) INTO _cnt FROM public.security_events
   WHERE email = lower(p_email) AND event_type = 'login_failed' AND created_at > now() - interval '15 minutes';
  RETURN _cnt;
END; $$;

CREATE OR REPLACE FUNCTION public.login_is_locked(p_email text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT count(*) >= 5 FROM public.security_events
   WHERE email = lower(p_email) AND event_type = 'login_failed' AND created_at > now() - interval '15 minutes';
$$;
REVOKE EXECUTE ON FUNCTION public.register_failed_login(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.login_is_locked(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_failed_login(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.login_is_locked(text) TO anon, authenticated;

-- Server-side limits on financial values
ALTER TABLE public.financial_transactions ADD CONSTRAINT financial_amount_range CHECK (amount >= 0 AND amount <= 10000000) NOT VALID;
ALTER TABLE public.service_types ADD CONSTRAINT service_price_range CHECK (price >= 0 AND price <= 1000000) NOT VALID;