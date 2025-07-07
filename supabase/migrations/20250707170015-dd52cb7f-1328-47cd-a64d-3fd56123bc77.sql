-- Fix the user_type enum issue
CREATE TYPE public.user_type AS ENUM ('salon_owner', 'renter');

-- Update the handle_new_user function to use the correct enum
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, user_type)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE((new.raw_user_meta_data->>'user_type')::public.user_type, 'renter'::public.user_type)
  );
  RETURN new;
END;
$function$;