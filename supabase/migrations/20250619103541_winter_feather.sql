/*
  # Fix RLS policies for users table

  1. Security Changes
    - Drop existing RLS policies that use incorrect `uid()` function
    - Create new RLS policies using correct `auth.uid()` function
    - Ensure authenticated users can read and insert their own profile data

  2. Policy Updates
    - "Users can insert own profile" - allows authenticated users to create their profile
    - "Users can read own profile" - allows authenticated users to read their profile  
    - "Users can update own profile" - allows authenticated users to update their profile

  This fixes the profile creation timeout and fetch errors by ensuring proper authentication checks.
*/

-- Drop existing policies that use incorrect uid() function
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create new policies with correct auth.uid() function
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
  USING (auth.uid() = auth_id);