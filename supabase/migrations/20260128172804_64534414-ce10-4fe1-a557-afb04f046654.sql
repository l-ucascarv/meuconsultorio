-- Add slug field to profiles for personalized URLs
ALTER TABLE public.profiles
ADD COLUMN slug TEXT UNIQUE;

-- Create index for fast slug lookups
CREATE INDEX idx_profiles_slug ON public.profiles(slug);

-- Create subscription_plans table for admin to manage plans
CREATE TABLE public.subscription_plans (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0,
    price_yearly DECIMAL(10, 2),
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    max_documents_per_month INTEGER,
    max_patients INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on subscription_plans
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read active plans
CREATE POLICY "Anyone can view active plans"
ON public.subscription_plans
FOR SELECT
USING (is_active = true);

-- Only admins can manage plans
CREATE POLICY "Admins can manage all plans"
ON public.subscription_plans
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Allow admins to view ALL profiles (for admin panel)
-- Note: This policy already exists, so we skip creating it

-- Create policy for admins to view all user_roles
CREATE POLICY "Admins can view all user_roles"
ON public.user_roles
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Create function to get user by slug (for login page)
CREATE OR REPLACE FUNCTION public.get_profile_by_slug(p_slug TEXT)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    email TEXT,
    name TEXT,
    slug TEXT,
    crp TEXT,
    specialty TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        id,
        user_id,
        email,
        name,
        slug,
        crp,
        specialty
    FROM public.profiles
    WHERE slug = p_slug
    LIMIT 1
$$;

-- Add trigger for updated_at on subscription_plans
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default plans
INSERT INTO public.subscription_plans (name, description, price_monthly, price_yearly, features, max_documents_per_month, max_patients)
VALUES 
    ('Gratuito', 'Plano básico para experimentar', 0, 0, '["5 documentos por mês", "10 pacientes", "Suporte por e-mail"]', 5, 10),
    ('Profissional', 'Para psicólogos em prática', 49.90, 479.00, '["Documentos ilimitados", "Pacientes ilimitados", "Suporte prioritário", "Histórico completo"]', NULL, NULL),
    ('Clínica', 'Para clínicas e consultórios', 149.90, 1439.00, '["Tudo do Profissional", "Múltiplos profissionais", "Relatórios avançados", "API de integração"]', NULL, NULL);