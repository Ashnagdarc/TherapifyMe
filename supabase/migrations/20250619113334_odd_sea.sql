/*
  # Create Storage Bucket for Voice Recordings

  1. Storage Setup
    - Create 'voice-recordings' bucket if not exists
    - Set up RLS policies for authenticated users
    - Allow users to upload and read their own recordings

  2. Security
    - Users can only upload to their own folder (user_id)
    - Users can only read their own recordings
    - Public access is disabled
*/

-- Create storage bucket for voice recordings if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'voice-recordings', 
  'voice-recordings', 
  false, 
  10485760, -- 10MB limit
  ARRAY['audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own voice recordings" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own voice recordings" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own voice recordings" ON storage.objects;

-- Create storage policies for voice recordings
CREATE POLICY "Users can upload their own voice recordings"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'voice-recordings' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can read their own voice recordings"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'voice-recordings' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own voice recordings"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'voice-recordings' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Update users table to include folder reference
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'storage_folder'
  ) THEN
    ALTER TABLE users ADD COLUMN storage_folder text DEFAULT '';
    
    -- Update existing users to set their storage folder to their auth_id
    UPDATE users SET storage_folder = auth_id::text WHERE storage_folder = '';
  END IF;
END $$;