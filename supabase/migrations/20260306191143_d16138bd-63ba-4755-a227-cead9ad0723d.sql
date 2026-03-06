
-- Service types table for professionals
CREATE TABLE public.service_types (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own service types" ON public.service_types FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own service types" ON public.service_types FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own service types" ON public.service_types FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own service types" ON public.service_types FOR DELETE USING (user_id = auth.uid());

-- Updated at trigger
CREATE TRIGGER update_service_types_updated_at
    BEFORE UPDATE ON public.service_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
