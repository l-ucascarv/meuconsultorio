CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _name text;
  _crp text;
  _specialty text;
  _slug text;
  _base_slug text;
  _existing record;
  _attempts int := 0;
BEGIN
  -- Extract from user metadata
  _name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NULL);
  _crp := NEW.raw_user_meta_data->>'crp';
  _specialty := NEW.raw_user_meta_data->>'specialty';

  -- Generate slug
  _base_slug := COALESCE(
    lower(regexp_replace(translate(_name, 'àáâãäéèêëíìîïóòôõöúùûüçÀÁÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ', 'aaaaaeeeeiiiioooooeuuuucAAAAAEEEEIIIIOOOOOEUUUUC'), '[^a-zA-Z0-9-]', '-', 'g')),
    split_part(NEW.email, '@', 1)
  );
  _base_slug := lower(regexp_replace(_base_slug, '-+', '-', 'g'));
  _base_slug := trim(both '-' from _base_slug);
  _slug := _base_slug;

  LOOP
    SELECT id INTO _existing FROM public.profiles WHERE slug = _slug;
    EXIT WHEN _existing IS NULL OR _attempts >= 10;
    _attempts := _attempts + 1;
    _slug := _base_slug || '-' || floor(random() * 9000 + 1000)::int;
  END LOOP;

  INSERT INTO public.profiles (user_id, email, name, crp, specialty, slug, must_change_password, subscription_status)
  VALUES (NEW.id, NEW.email, _name, _crp, _specialty, _slug, false, 'trial')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'subscriber')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();