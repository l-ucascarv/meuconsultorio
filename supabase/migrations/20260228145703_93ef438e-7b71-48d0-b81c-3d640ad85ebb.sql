
-- Availability settings per day of week
CREATE TABLE public.availability_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL DEFAULT '08:00',
  end_time TIME NOT NULL DEFAULT '18:00',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, day_of_week)
);

-- Global booking config per user
CREATE TABLE public.booking_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  session_duration_minutes INTEGER NOT NULL DEFAULT 50,
  break_between_minutes INTEGER NOT NULL DEFAULT 10,
  min_advance_hours INTEGER NOT NULL DEFAULT 2,
  max_advance_days INTEGER NOT NULL DEFAULT 60,
  booking_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Manual blocks (specific dates/times)
CREATE TABLE public.availability_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  blocked_date DATE NOT NULL,
  blocked_start_time TIME,
  blocked_end_time TIME,
  block_full_day BOOLEAN NOT NULL DEFAULT true,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, blocked_date, blocked_start_time)
);

-- RLS for availability_settings
ALTER TABLE public.availability_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own availability" ON public.availability_settings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own availability" ON public.availability_settings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own availability" ON public.availability_settings
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own availability" ON public.availability_settings
  FOR DELETE USING (user_id = auth.uid());

-- RLS for booking_config
ALTER TABLE public.booking_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own booking config" ON public.booking_config
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own booking config" ON public.booking_config
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own booking config" ON public.booking_config
  FOR UPDATE USING (user_id = auth.uid());

-- RLS for availability_blocks
ALTER TABLE public.availability_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blocks" ON public.availability_blocks
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own blocks" ON public.availability_blocks
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own blocks" ON public.availability_blocks
  FOR DELETE USING (user_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_availability_settings_updated_at
  BEFORE UPDATE ON public.availability_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_booking_config_updated_at
  BEFORE UPDATE ON public.booking_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
