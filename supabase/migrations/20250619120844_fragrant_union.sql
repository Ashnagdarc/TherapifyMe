/*
  # Fix Authentication Issues and Clean Database

  1. Clean up duplicate users
  2. Fix RLS policies  
  3. Improve trigger function
  4. Add proper constraints and indexes

  This migration resolves authentication loading issues by ensuring clean data and proper policies.
*/

-- 1. TEMPORARILY DISABLE RLS TO FIX ISSUES
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tavus_videos DISABLE ROW LEVEL SECURITY;

-- 2. DROP ALL EXISTING POLICIES COMPLETELY
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "entries_select_own" ON public.entries;
DROP POLICY IF EXISTS "entries_insert_own" ON public.entries;
DROP POLICY IF EXISTS "entries_update_own" ON public.entries;
DROP POLICY IF EXISTS "tavus_videos_select_own" ON public.tavus_videos;
DROP POLICY IF EXISTS "tavus_videos_insert_own" ON public.tavus_videos;
DROP POLICY IF EXISTS "users_policy" ON public.users;
DROP POLICY IF EXISTS "entries_policy" ON public.entries;
DROP POLICY IF EXISTS "tavus_videos_policy" ON public.tavus_videos;

-- 3. CLEAN UP DUPLICATE USERS (Keep the most recent one for each auth_id)
WITH duplicates AS (
  SELECT 
    auth_id,
    array_agg(id ORDER BY created_at DESC) as user_ids
  FROM public.users 
  WHERE auth_id IS NOT NULL
  GROUP BY auth_id 
  HAVING COUNT(*) > 1
),
ids_to_delete AS (
  SELECT unnest(user_ids[2:]) as id_to_delete
  FROM duplicates
)
DELETE FROM public.users 
WHERE id IN (SELECT id_to_delete FROM ids_to_delete);

-- 4. CLEAN UP ANY ORPHANED DATA
DELETE FROM public.users WHERE auth_id IS NULL;
DELETE FROM public.entries WHERE user_id NOT IN (SELECT id FROM public.users);
DELETE FROM public.tavus_videos WHERE user_id NOT IN (SELECT id FROM public.users);

-- 5. RECREATE TRIGGER FUNCTION WITH BETTER ERROR HANDLING
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_name text;
  existing_user_id uuid;
BEGIN
  -- Extract name from metadata
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', '');
  
  -- Check if user already exists
  SELECT id INTO existing_user_id
  FROM public.users
  WHERE auth_id = NEW.id;
  
  -- Only insert if user doesn't exist
  IF existing_user_id IS NULL THEN
    INSERT INTO public.users (
      auth_id, 
      name, 
      timezone, 
      language, 
      preferred_tone, 
      storage_folder,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      user_name,
      'UTC',
      'en',
      'calm',
      NEW.id::text,
      NOW(),
      NOW()
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't fail the auth process
    RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 6. CREATE THE TRIGGER
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. NOW ADD UNIQUE CONSTRAINT (after cleaning duplicates)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_auth_id_unique;
ALTER TABLE public.users ADD CONSTRAINT users_auth_id_unique UNIQUE (auth_id);

-- 8. RE-ENABLE RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tavus_videos ENABLE ROW LEVEL SECURITY;

-- 9. CREATE SIMPLE, WORKING RLS POLICIES
CREATE POLICY "users_policy"
  ON public.users
  FOR ALL
  TO authenticated
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

CREATE POLICY "entries_policy"
  ON public.entries
  FOR ALL
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "tavus_videos_policy"
  ON public.tavus_videos
  FOR ALL
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
    )
  );

-- 10. ENSURE PROPER INDEXES EXIST
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON public.entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_created_at ON public.entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tavus_videos_user_id ON public.tavus_videos(user_id);

-- 11. GRANT NECESSARY PERMISSIONS
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.entries TO authenticated;
GRANT ALL ON public.tavus_videos TO authenticated;

-- 12. ADD HELPFUL FUNCTIONS FOR DEBUGGING
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_profile public.users;
BEGIN
  SELECT * INTO user_profile
  FROM public.users
  WHERE auth_id = auth.uid();
  
  RETURN user_profile;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO authenticated;

-- 13. ADD COMMENTS FOR CLARITY
COMMENT ON TABLE public.users IS 'User profiles with unique auth_id constraint';
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates user profile automatically, prevents duplicates';
COMMENT ON FUNCTION public.get_current_user_profile() IS 'Helper function to get current authenticated user profile';