/*
  # Fix authentication policies and profile creation

  1. Policy Fixes
    - Drop all existing problematic policies
    - Recreate with correct auth.uid() syntax
    - Fix RLS policies for users, entries, and tavus_videos tables

  2. Trigger Function Fix
    - Improve handle_new_user function with proper error handling
    - Add storage_folder field for user profiles

  3. Performance Improvements
    - Add necessary indexes for better query performance
    - Ensure RLS is properly enabled

  4. Security
    - All policies use correct auth.uid() function
    - Proper WITH CHECK clauses for insert/update operations
*/

-- 1. COMPLETELY DROP ALL EXISTING POLICIES
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;  
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own entries" ON public.entries;
DROP POLICY IF EXISTS "Users can read own entries" ON public.entries;
DROP POLICY IF EXISTS "Users can update own entries" ON public.entries;
DROP POLICY IF EXISTS "Users can insert own videos" ON public.tavus_videos;
DROP POLICY IF EXISTS "Users can read own videos" ON public.tavus_videos;

-- 2. RECREATE USERS TABLE POLICIES WITH CORRECT SYNTAX
CREATE POLICY "users_select_own" 
  ON public.users
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = auth_id);

CREATE POLICY "users_insert_own"
  ON public.users  
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "users_update_own"
  ON public.users
  FOR UPDATE  
  TO authenticated
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

-- 3. RECREATE ENTRIES TABLE POLICIES  
CREATE POLICY "entries_select_own"
  ON public.entries
  FOR SELECT
  TO authenticated  
  USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = entries.user_id 
    AND users.auth_id = auth.uid()
  ));

CREATE POLICY "entries_insert_own"
  ON public.entries
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = entries.user_id
    AND users.auth_id = auth.uid()  
  ));

CREATE POLICY "entries_update_own"
  ON public.entries
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = entries.user_id  
    AND users.auth_id = auth.uid()
  ));

-- 4. RECREATE TAVUS_VIDEOS TABLE POLICIES
CREATE POLICY "tavus_videos_select_own" 
  ON public.tavus_videos
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = tavus_videos.user_id
    AND users.auth_id = auth.uid()
  ));

CREATE POLICY "tavus_videos_insert_own"
  ON public.tavus_videos
  FOR INSERT  
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = tavus_videos.user_id
    AND users.auth_id = auth.uid()
  ));

-- 5. ADD STORAGE_FOLDER COLUMN IF NOT EXISTS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'storage_folder'
  ) THEN
    ALTER TABLE public.users ADD COLUMN storage_folder text DEFAULT '';
  END IF;
END $$;

-- 6. FIX THE TRIGGER FUNCTION
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (auth_id, name, timezone, language, preferred_tone, storage_folder)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    'UTC',
    'en', 
    'calm',
    NEW.id::text
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail the auth process
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 7. RECREATE THE TRIGGER
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. ADD PERFORMANCE INDEXES (WITHOUT CONCURRENTLY)
CREATE INDEX IF NOT EXISTS idx_users_auth_id_active ON public.users(auth_id) WHERE auth_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_entries_user_created ON public.entries(user_id, created_at DESC);

-- 9. VERIFY RLS IS ENABLED
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY; 
ALTER TABLE public.tavus_videos ENABLE ROW LEVEL SECURITY;