
-- Add transfer_code column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS transfer_code text UNIQUE;

-- Function to generate unique transfer code
CREATE OR REPLACE FUNCTION public.generate_transfer_code()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    new_code := 'NNQ' || lpad(floor(random() * 1000)::text, 3, '0');
    SELECT EXISTS(SELECT 1 FROM profiles WHERE transfer_code = new_code) INTO code_exists;
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$;

-- Trigger to auto-assign transfer_code on new profile
CREATE OR REPLACE FUNCTION public.assign_transfer_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.transfer_code IS NULL THEN
    NEW.transfer_code := generate_transfer_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_transfer_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_transfer_code();

-- Backfill existing profiles
UPDATE public.profiles SET transfer_code = generate_transfer_code() WHERE transfer_code IS NULL;
