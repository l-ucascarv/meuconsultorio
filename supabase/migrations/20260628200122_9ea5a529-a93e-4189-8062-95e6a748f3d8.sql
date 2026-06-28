
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS consent_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tour_completed boolean NOT NULL DEFAULT false;

-- Mark existing profiles with CRP as already onboarded so they aren't re-prompted
UPDATE public.profiles
  SET consent_accepted = true
  WHERE crp IS NOT NULL AND length(trim(crp)) > 0;
