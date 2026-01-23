-- Enum para roles de usuário
CREATE TYPE public.app_role AS ENUM ('admin', 'subscriber');

-- Enum para status de assinatura
CREATE TYPE public.subscription_status AS ENUM ('active', 'inactive', 'pending', 'cancelled', 'trial');

-- Tabela de roles (separada por segurança)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'subscriber',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Tabela de perfis dos psicólogos
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT NOT NULL,
    name TEXT,
    crp TEXT,
    specialty TEXT,
    theme TEXT DEFAULT 'light',
    primary_color TEXT DEFAULT 'indigo',
    subscription_status subscription_status DEFAULT 'pending',
    subscription_plan TEXT,
    must_change_password BOOLEAN DEFAULT true,
    temp_password_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de pacientes
CREATE TABLE public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    responsible_name TEXT,
    birth_date DATE,
    responsible_phone TEXT,
    notes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de arquivos externos dos pacientes
CREATE TABLE public.patient_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    file_type TEXT,
    file_size TEXT,
    content TEXT,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de relatórios/documentos
CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    solicitor TEXT,
    purpose TEXT,
    demand_description TEXT,
    procedures TEXT,
    analysis TEXT,
    conclusion TEXT,
    city TEXT,
    specific_question TEXT,
    period_start DATE,
    period_end DATE,
    generated_content JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de agendamentos
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    patient_name TEXT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Função para verificar role (SECURITY DEFINER para evitar recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Função para verificar se usuário tem assinatura ativa
CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE user_id = _user_id
          AND subscription_status IN ('active', 'trial')
    )
$$;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON public.patients
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON public.reports
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Políticas para user_roles (apenas admins podem gerenciar)
CREATE POLICY "Users can view own roles"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
    ON public.user_roles FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para profiles
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all profiles"
    ON public.profiles FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para patients (isolamento por usuário + assinatura ativa)
CREATE POLICY "Users can view own patients"
    ON public.patients FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() AND public.has_active_subscription(auth.uid()));

CREATE POLICY "Users can insert own patients"
    ON public.patients FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid() AND public.has_active_subscription(auth.uid()));

CREATE POLICY "Users can update own patients"
    ON public.patients FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid() AND public.has_active_subscription(auth.uid()));

CREATE POLICY "Users can delete own patients"
    ON public.patients FOR DELETE
    TO authenticated
    USING (user_id = auth.uid() AND public.has_active_subscription(auth.uid()));

-- Políticas para patient_files
CREATE POLICY "Users can view own patient files"
    ON public.patient_files FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() AND public.has_active_subscription(auth.uid()));

CREATE POLICY "Users can insert own patient files"
    ON public.patient_files FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid() AND public.has_active_subscription(auth.uid()));

CREATE POLICY "Users can delete own patient files"
    ON public.patient_files FOR DELETE
    TO authenticated
    USING (user_id = auth.uid() AND public.has_active_subscription(auth.uid()));

-- Políticas para reports
CREATE POLICY "Users can view own reports"
    ON public.reports FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() AND public.has_active_subscription(auth.uid()));

CREATE POLICY "Users can insert own reports"
    ON public.reports FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid() AND public.has_active_subscription(auth.uid()));

CREATE POLICY "Users can update own reports"
    ON public.reports FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid() AND public.has_active_subscription(auth.uid()));

CREATE POLICY "Users can delete own reports"
    ON public.reports FOR DELETE
    TO authenticated
    USING (user_id = auth.uid() AND public.has_active_subscription(auth.uid()));

-- Políticas para appointments
CREATE POLICY "Users can view own appointments"
    ON public.appointments FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() AND public.has_active_subscription(auth.uid()));

CREATE POLICY "Users can insert own appointments"
    ON public.appointments FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid() AND public.has_active_subscription(auth.uid()));

CREATE POLICY "Users can update own appointments"
    ON public.appointments FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid() AND public.has_active_subscription(auth.uid()));

CREATE POLICY "Users can delete own appointments"
    ON public.appointments FOR DELETE
    TO authenticated
    USING (user_id = auth.uid() AND public.has_active_subscription(auth.uid()));