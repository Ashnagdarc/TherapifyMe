/*
  # Fix RLS policies for users table

  1. Problem
    - Current RLS policies use `uid()` function which doesn't exist in Supabase
    - Should use `auth.uid()` to get the current authenticated user's ID
    - This is causing INSERT operations to hang and timeout

  2. Solution
    - Drop existing RLS policies
    - Recreate them with correct `auth.uid()` function
    - Ensure policies allow users to manage their own profiles

  3. Security
    - Users can only create, read, and update their own profile
    - Profile creation links to authenticated user via auth_id
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create correct policies using auth.uid()
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);