-- Create enum for transaction types
CREATE TYPE public.transaction_type AS ENUM ('income', 'expense');

-- Create financial categories table
CREATE TABLE public.financial_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    type transaction_type NOT NULL,
    color TEXT DEFAULT '#6366f1',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create financial transactions table
CREATE TABLE public.financial_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    category_id UUID REFERENCES public.financial_categories(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    type transaction_type NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for financial_categories
CREATE POLICY "Users can view own categories" 
ON public.financial_categories 
FOR SELECT 
USING ((user_id = auth.uid()) AND has_active_subscription(auth.uid()));

CREATE POLICY "Users can insert own categories" 
ON public.financial_categories 
FOR INSERT 
WITH CHECK ((user_id = auth.uid()) AND has_active_subscription(auth.uid()));

CREATE POLICY "Users can update own categories" 
ON public.financial_categories 
FOR UPDATE 
USING ((user_id = auth.uid()) AND has_active_subscription(auth.uid()));

CREATE POLICY "Users can delete own categories" 
ON public.financial_categories 
FOR DELETE 
USING ((user_id = auth.uid()) AND has_active_subscription(auth.uid()));

-- RLS Policies for financial_transactions
CREATE POLICY "Users can view own transactions" 
ON public.financial_transactions 
FOR SELECT 
USING ((user_id = auth.uid()) AND has_active_subscription(auth.uid()));

CREATE POLICY "Users can insert own transactions" 
ON public.financial_transactions 
FOR INSERT 
WITH CHECK ((user_id = auth.uid()) AND has_active_subscription(auth.uid()));

CREATE POLICY "Users can update own transactions" 
ON public.financial_transactions 
FOR UPDATE 
USING ((user_id = auth.uid()) AND has_active_subscription(auth.uid()));

CREATE POLICY "Users can delete own transactions" 
ON public.financial_transactions 
FOR DELETE 
USING ((user_id = auth.uid()) AND has_active_subscription(auth.uid()));

-- Create triggers for updated_at
CREATE TRIGGER update_financial_categories_updated_at
BEFORE UPDATE ON public.financial_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financial_transactions_updated_at
BEFORE UPDATE ON public.financial_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();