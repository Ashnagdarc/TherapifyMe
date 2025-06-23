export interface User {
  id: string;
  auth_id: string;
  name: string;
  email?: string;
  timezone: string;
  language: string;
  preferred_tone: 'calm' | 'motivational' | 'reflective' | 'direct' | 'empathetic';
  storage_folder: string;
  created_at: string;
  updated_at: string;
  tavus_api_key?: string | null;
  gemini_api_key?: string | null;
  full_name?: string | null;
}

export interface Entry {
  id: string;
  user_id: string;
  mood_tag: string;
  voice_note_url?: string;
  ai_response_url?: string;
  text_summary: string;
  transcription: string;
  created_at: string;
  tavus_video_url?: string | null;
}

export interface TavusVideo {
  id: string;
  user_id: string;
  week: number;
  tavus_video_url: string;
  title: string;
  created_at: string;
}

export type MoodTag = 'happy' | 'sad' | 'anxious' | 'stressed' | 'calm' | 'excited' | 'frustrated' | 'grateful' | 'overwhelmed' | 'content';