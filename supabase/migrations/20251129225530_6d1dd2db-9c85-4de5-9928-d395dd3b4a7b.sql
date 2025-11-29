-- Fix the update_application_timestamp function to have immutable search_path
CREATE OR REPLACE FUNCTION public.update_application_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;