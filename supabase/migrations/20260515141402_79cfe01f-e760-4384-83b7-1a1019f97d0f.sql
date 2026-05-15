
-- 1) Add MP plan id to existing plans
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS mercadopago_plan_id text;

-- 2) Subscriptions table
CREATE TYPE public.subscription_state AS ENUM ('pending','trial','active','past_due','cancelled','expired');

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid REFERENCES public.subscription_plans(id),
  status public.subscription_state NOT NULL DEFAULT 'pending',
  mp_preapproval_id text UNIQUE,
  mp_payer_id text,
  mp_payer_email text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  cancel_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscription"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins manage all subscriptions"
  ON public.subscriptions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Payment logs
CREATE TABLE public.payment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  user_id uuid,
  mp_payment_id text UNIQUE NOT NULL,
  status text NOT NULL,
  amount numeric,
  currency text DEFAULT 'BRL',
  paid_at timestamptz,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_payment_logs_user ON public.payment_logs(user_id);

ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own payments"
  ON public.payment_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins view all payments"
  ON public.payment_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4) Webhook logs
CREATE TABLE public.webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'mercadopago',
  event_type text,
  mp_resource_id text,
  signature_valid boolean DEFAULT false,
  processed boolean DEFAULT false,
  error text,
  payload jsonb,
  received_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, event_type, mp_resource_id)
);

ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view webhook logs"
  ON public.webhook_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 5) Update has_active_subscription to consider subscriptions table
CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = _user_id
      AND s.status IN ('active','trial')
      AND (s.current_period_end IS NULL OR s.current_period_end > now())
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = _user_id
      AND p.subscription_status IN ('active','trial')
  );
$$;

-- 6) Trigger to keep profile in sync
CREATE OR REPLACE FUNCTION public.sync_profile_from_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _plan_name text;
  _mapped_status text;
BEGIN
  SELECT name INTO _plan_name FROM public.subscription_plans WHERE id = NEW.plan_id;

  _mapped_status := CASE NEW.status
    WHEN 'active' THEN 'active'
    WHEN 'trial' THEN 'trial'
    WHEN 'past_due' THEN 'pending'
    WHEN 'cancelled' THEN 'cancelled'
    WHEN 'expired' THEN 'inactive'
    ELSE 'pending'
  END;

  UPDATE public.profiles
  SET subscription_status = _mapped_status::subscription_status,
      subscription_plan = COALESCE(_plan_name, subscription_plan),
      updated_at = now()
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_profile_from_subscription
  AFTER INSERT OR UPDATE OF status, plan_id ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_from_subscription();
