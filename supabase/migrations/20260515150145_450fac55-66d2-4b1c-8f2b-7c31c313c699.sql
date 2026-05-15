DROP TABLE IF EXISTS public.payment_logs CASCADE;
DROP TABLE IF EXISTS public.webhook_logs CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TYPE IF EXISTS public.subscription_state CASCADE;
DROP FUNCTION IF EXISTS public.sync_profile_from_subscription() CASCADE;

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  stripe_subscription_id text NOT NULL UNIQUE,
  stripe_customer_id text NOT NULL,
  product_id text,
  price_id text,
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscription"
  ON public.subscriptions FOR SELECT
  TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins manage all subscriptions"
  ON public.subscriptions FOR ALL
  TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = _user_id
      AND (
        (s.status IN ('active','trialing','past_due')
          AND (s.current_period_end IS NULL OR s.current_period_end > now()))
        OR (s.status = 'canceled'
          AND s.current_period_end IS NOT NULL
          AND s.current_period_end > now())
      )
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = _user_id
      AND p.subscription_status IN ('active','trial')
  );
$$;

CREATE OR REPLACE FUNCTION public.sync_profile_from_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _mapped subscription_status;
  _is_active boolean;
BEGIN
  _is_active := NEW.status IN ('active','trialing','past_due')
    AND (NEW.current_period_end IS NULL OR NEW.current_period_end > now());

  _mapped := CASE
    WHEN NEW.status = 'trialing' THEN 'trial'::subscription_status
    WHEN _is_active THEN 'active'::subscription_status
    WHEN NEW.status = 'canceled' AND NEW.current_period_end IS NOT NULL AND NEW.current_period_end > now() THEN 'active'::subscription_status
    WHEN NEW.status IN ('canceled','unpaid') THEN 'cancelled'::subscription_status
    WHEN NEW.status IN ('incomplete','incomplete_expired') THEN 'pending'::subscription_status
    ELSE 'inactive'::subscription_status
  END;

  UPDATE public.profiles
  SET subscription_status = _mapped,
      subscription_plan = COALESCE(NEW.price_id, subscription_plan),
      updated_at = now()
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_profile_from_subscription
AFTER INSERT OR UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_from_subscription();

ALTER TABLE public.subscription_plans DROP COLUMN IF EXISTS mercadopago_plan_id;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS stripe_price_id_monthly text;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS stripe_price_id_yearly text;