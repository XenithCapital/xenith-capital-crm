-- Drop and recreate the handle_new_user trigger with full error isolation
-- This version catches ALL exceptions so it can NEVER block user creation

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role    public.user_role := 'introducer';
  v_name    text;
BEGIN
  -- Safely parse role
  BEGIN
    IF (NEW.raw_user_meta_data->>'role') IS NOT NULL THEN
      v_role := (NEW.raw_user_meta_data->>'role')::public.user_role;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_role := 'introducer';
  END;

  -- Safely parse name
  v_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
    split_part(COALESCE(NEW.email, ''), '@', 1),
    'User'
  );

  -- Insert profile, ignore if already exists
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    v_name,
    v_role
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- Never block user creation due to profile insert failure
  RETURN NEW;
END;
$$;
