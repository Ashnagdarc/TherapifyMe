-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload voice recordings to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own voice recordings" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own voice recordings" ON storage.objects;

-- Create policy to allow users to upload files to their own folder
CREATE POLICY "Users can upload voice recordings to their own folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'voice-recordings' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow users to read their own voice recordings
CREATE POLICY "Users can read their own voice recordings" ON storage.objects
FOR SELECT USING (
  bucket_id = 'voice-recordings' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow users to delete their own voice recordings
CREATE POLICY "Users can delete their own voice recordings" ON storage.objects
FOR DELETE USING (
  bucket_id = 'voice-recordings' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow users to update their own voice recordings (optional)
CREATE POLICY "Users can update their own voice recordings" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'voice-recordings' 
  AND auth.uid()::text = (storage.foldername(name))[1]
); 