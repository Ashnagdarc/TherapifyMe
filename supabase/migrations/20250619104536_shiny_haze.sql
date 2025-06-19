/*
# Fix Users Table RLS Policies

1. Policy Updates
   - Update existing RLS policies to use correct `auth.uid()` syntax instead of `uid()`
   - This fixes the profile creation timeout error by ensuring policies work correctly

2. Security
   - Maintains same security model but with correct function calls
   - Users can only access their own profile data
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Recreate policies with correct auth.uid() syntax
CREATE POLICY "Users can insert own profile"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Users can read own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_id);

CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);