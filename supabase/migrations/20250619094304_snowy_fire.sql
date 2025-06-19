/*
  # Fix user signup trigger function

  1. Updates
    - Recreates the `handle_new_user` trigger function to properly handle new user signups
    - Ensures auth_id is correctly set when creating user profiles
    - Handles the user metadata (name) passed during signup

  2. Security
    - Maintains existing RLS policies
    - Ensures proper foreign key relationships
*/

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (auth_id, name, timezone, language, preferred_tone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    'UTC',
    'en',
    'calm'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();