
UPDATE public.profiles
  SET tour_completed = true
  WHERE created_at < now();
