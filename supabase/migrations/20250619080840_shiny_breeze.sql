/*
  # Create initial schema for TherapifyMe

  1. New Tables
    - `users` - Store user profiles and preferences
    - `entries` - Store mood check-in sessions with voice recordings
    - `tavus_videos` - Store weekly therapy video references

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Users can only see their own entries and videos

  3. Storage
    - Create bucket for voice recordings
    - Set up policies for authenticated users
*/

-- Create users table for additional profile data
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text DEFAULT '',
  timezone text DEFAULT 'UTC',
  language text DEFAULT 'en',
  preferred_tone text DEFAULT 'calm',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create entries table for mood check-ins
CREATE TABLE IF NOT EXISTS entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  mood_tag text NOT NULL,
  voice_note_url text,
  ai_response_url text,
  text_summary text DEFAULT '',
  transcription text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create tavus_videos table for weekly therapy videos
CREATE TABLE IF NOT EXISTS tavus_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  week integer NOT NULL,
  tavus_video_url text NOT NULL,
  title text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tavus_videos ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
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

CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_id);

-- Create policies for entries table  
CREATE POLICY "Users can read own entries"
  ON entries
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = entries.user_id 
    AND users.auth_id = auth.uid()
  ));

CREATE POLICY "Users can insert own entries"
  ON entries
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = entries.user_id 
    AND users.auth_id = auth.uid()
  ));

CREATE POLICY "Users can update own entries"
  ON entries
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = entries.user_id 
    AND users.auth_id = auth.uid()
  ));

-- Create policies for tavus_videos table
CREATE POLICY "Users can read own videos"
  ON tavus_videos
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = tavus_videos.user_id 
    AND users.auth_id = auth.uid()
  ));

CREATE POLICY "Users can insert own videos"
  ON tavus_videos
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = tavus_videos.user_id 
    AND users.auth_id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tavus_videos_user_id ON tavus_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_tavus_videos_week ON tavus_videos(user_id, week);

-- Create storage bucket for voice recordings
INSERT INTO storage.buckets (id, name, public) 
VALUES ('voice-recordings', 'voice-recordings', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Users can upload their own voice recordings"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'voice-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can read their own voice recordings"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'voice-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO users (auth_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();