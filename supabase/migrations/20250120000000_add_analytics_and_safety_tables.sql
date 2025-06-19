/*
  # Add Analytics, Safety, and Advanced Feature Tables

  1. New Tables
    - `user_sessions` - Daily analytics and mood trend caching
    - `user_goals` - Goal tracking and achievement system
    - `entry_tags` - Advanced tagging and categorization
    - `ai_feedback` - AI response quality tracking
    - `crisis_resources` - Crisis prevention and safety resources
    - `crisis_flags` - Automatic crisis detection and flagging

  2. Performance Improvements
    - Indexed for fast queries
    - Optimized for dashboard analytics
    - Supports real-time trend calculations

  3. Safety Features
    - Crisis keyword detection
    - Emergency resource management
    - User safety monitoring
*/

-- 1. USER SESSIONS TABLE (Analytics & Performance)
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  session_date date NOT NULL,
  check_ins_count integer DEFAULT 0,
  total_session_time interval DEFAULT '0 minutes',
  dominant_mood text,
  mood_score integer CHECK (mood_score BETWEEN 1 AND 10),
  mood_trend_direction text CHECK (mood_trend_direction IN ('improving', 'stable', 'declining')),
  streak_days integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure one session per user per day
  UNIQUE(user_id, session_date)
);

-- 2. USER GOALS TABLE (Motivation & Engagement)
CREATE TABLE IF NOT EXISTS user_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  goal_type text NOT NULL CHECK (goal_type IN ('daily_checkin', 'mood_improvement', 'consistency', 'streak', 'reflection')),
  goal_name text NOT NULL,
  target_value integer NOT NULL,
  current_progress integer DEFAULT 0,
  achieved boolean DEFAULT false,
  achievement_date timestamptz,
  target_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. ENTRY TAGS TABLE (Advanced Search & Analytics)
CREATE TABLE IF NOT EXISTS entry_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid REFERENCES entries(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  tag_name text NOT NULL,
  tag_category text CHECK (tag_category IN ('trigger', 'activity', 'location', 'person', 'emotion', 'situation')),
  confidence_score float CHECK (confidence_score BETWEEN 0 AND 1), -- For AI-generated tags
  is_user_created boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 4. AI FEEDBACK TABLE (Machine Learning & Quality)
CREATE TABLE IF NOT EXISTS ai_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid REFERENCES entries(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  feedback_type text NOT NULL CHECK (feedback_type IN ('helpful', 'not_helpful', 'inappropriate', 'too_generic', 'too_intense')),
  feedback_rating integer CHECK (feedback_rating BETWEEN 1 AND 5),
  feedback_comment text,
  ai_response_tone text, -- The tone that was used
  user_mood_at_time text, -- User's mood when feedback was given
  created_at timestamptz DEFAULT now()
);

-- 5. CRISIS RESOURCES TABLE (Safety & Support)
CREATE TABLE IF NOT EXISTS crisis_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  resource_type text NOT NULL CHECK (resource_type IN ('hotline', 'local_therapist', 'emergency_contact', 'crisis_center', 'online_chat')),
  resource_name text NOT NULL,
  resource_data jsonb NOT NULL, -- Phone, address, website, hours, etc.
  priority_level integer DEFAULT 1 CHECK (priority_level BETWEEN 1 AND 5), -- 5 = highest priority
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false, -- System-provided resources
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. CRISIS FLAGS TABLE (Safety Monitoring)
CREATE TABLE IF NOT EXISTS crisis_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid REFERENCES entries(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  severity_score integer NOT NULL CHECK (severity_score BETWEEN 1 AND 10),
  keywords_detected text[] NOT NULL,
  context_snippet text, -- Part of the transcription that triggered flag
  ai_assessment text, -- AI's assessment of the situation
  flagged_at timestamptz DEFAULT now(),
  reviewed boolean DEFAULT false,
  reviewed_by text, -- System or admin ID
  reviewed_at timestamptz,
  action_taken text, -- What action was taken
  false_positive boolean DEFAULT false
);

-- CREATE INDEXES FOR PERFORMANCE

-- User Sessions indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_date ON user_sessions(user_id, session_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_streak ON user_sessions(user_id, streak_days DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_mood_trend ON user_sessions(mood_trend_direction, session_date DESC);

-- User Goals indexes
CREATE INDEX IF NOT EXISTS idx_user_goals_user_type ON user_goals(user_id, goal_type);
CREATE INDEX IF NOT EXISTS idx_user_goals_achieved ON user_goals(user_id, achieved, target_date);

-- Entry Tags indexes
CREATE INDEX IF NOT EXISTS idx_entry_tags_entry ON entry_tags(entry_id);
CREATE INDEX IF NOT EXISTS idx_entry_tags_user_category ON entry_tags(user_id, tag_category);
CREATE INDEX IF NOT EXISTS idx_entry_tags_name ON entry_tags(tag_name);

-- AI Feedback indexes
CREATE INDEX IF NOT EXISTS idx_ai_feedback_entry ON ai_feedback(entry_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user_rating ON ai_feedback(user_id, feedback_rating);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_type ON ai_feedback(feedback_type, created_at DESC);

-- Crisis Resources indexes
CREATE INDEX IF NOT EXISTS idx_crisis_resources_user_active ON crisis_resources(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_crisis_resources_type_priority ON crisis_resources(resource_type, priority_level DESC);

-- Crisis Flags indexes
CREATE INDEX IF NOT EXISTS idx_crisis_flags_user_severity ON crisis_flags(user_id, severity_score DESC, flagged_at DESC);
CREATE INDEX IF NOT EXISTS idx_crisis_flags_reviewed ON crisis_flags(reviewed, flagged_at DESC);
CREATE INDEX IF NOT EXISTS idx_crisis_flags_entry ON crisis_flags(entry_id);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_flags ENABLE ROW LEVEL SECURITY;

-- CREATE RLS POLICIES

-- User Sessions policies
CREATE POLICY "users_can_manage_own_sessions"
  ON user_sessions
  FOR ALL
  TO authenticated
  USING (user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  ))
  WITH CHECK (user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  ));

-- User Goals policies
CREATE POLICY "users_can_manage_own_goals"
  ON user_goals
  FOR ALL
  TO authenticated
  USING (user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  ))
  WITH CHECK (user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  ));

-- Entry Tags policies
CREATE POLICY "users_can_manage_own_entry_tags"
  ON entry_tags
  FOR ALL
  TO authenticated
  USING (user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  ))
  WITH CHECK (user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  ));

-- AI Feedback policies
CREATE POLICY "users_can_manage_own_ai_feedback"
  ON ai_feedback
  FOR ALL
  TO authenticated
  USING (user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  ))
  WITH CHECK (user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  ));

-- Crisis Resources policies
CREATE POLICY "users_can_manage_own_crisis_resources"
  ON crisis_resources
  FOR ALL
  TO authenticated
  USING (user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  ))
  WITH CHECK (user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  ));

-- Crisis Flags policies (users can only read their own, not modify)
CREATE POLICY "users_can_read_own_crisis_flags"
  ON crisis_flags
  FOR SELECT
  TO authenticated
  USING (user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  ));

-- System can insert crisis flags
CREATE POLICY "system_can_insert_crisis_flags"
  ON crisis_flags
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- INSERT DEFAULT CRISIS RESOURCES
INSERT INTO crisis_resources (user_id, resource_type, resource_name, resource_data, priority_level, is_default)
SELECT 
  u.id,
  'hotline',
  'National Suicide Prevention Lifeline',
  jsonb_build_object(
    'phone', '988',
    'website', 'https://suicidepreventionlifeline.org',
    'description', '24/7 crisis support',
    'availability', '24/7'
  ),
  5,
  true
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM crisis_resources cr 
  WHERE cr.user_id = u.id AND cr.resource_name = 'National Suicide Prevention Lifeline'
)
ON CONFLICT DO NOTHING;

INSERT INTO crisis_resources (user_id, resource_type, resource_name, resource_data, priority_level, is_default)
SELECT 
  u.id,
  'online_chat',
  'Crisis Text Line',
  jsonb_build_object(
    'phone', 'Text HOME to 741741',
    'website', 'https://www.crisistextline.org',
    'description', 'Text-based crisis counseling',
    'availability', '24/7'
  ),
  4,
  true
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM crisis_resources cr 
  WHERE cr.user_id = u.id AND cr.resource_name = 'Crisis Text Line'
)
ON CONFLICT DO NOTHING;

-- CREATE HELPFUL FUNCTIONS

-- Function to update user session analytics
CREATE OR REPLACE FUNCTION update_user_session_analytics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update or insert user session data when new entry is created
  INSERT INTO user_sessions (user_id, session_date, check_ins_count, dominant_mood)
  VALUES (
    NEW.user_id, 
    NEW.created_at::date, 
    1, 
    NEW.mood_tag
  )
  ON CONFLICT (user_id, session_date) 
  DO UPDATE SET
    check_ins_count = user_sessions.check_ins_count + 1,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic session tracking
CREATE OR REPLACE TRIGGER update_session_on_entry
  AFTER INSERT ON entries
  FOR EACH ROW
  EXECUTE FUNCTION update_user_session_analytics();

-- Function to check for crisis keywords
CREATE OR REPLACE FUNCTION check_crisis_keywords()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  crisis_keywords text[] := ARRAY[
    'suicide', 'kill myself', 'end it all', 'want to die', 'self harm',
    'cutting', 'overdose', 'can''t go on', 'hopeless', 'worthless',
    'no point living', 'better off dead', 'hurt myself'
  ];
  keyword text;
  found_keywords text[] := ARRAY[]::text[];
  severity integer := 0;
  text_to_check text;
BEGIN
  -- Combine transcription and text_summary for checking
  text_to_check := LOWER(COALESCE(NEW.transcription, '') || ' ' || COALESCE(NEW.text_summary, ''));
  
  -- Check for crisis keywords
  FOREACH keyword IN ARRAY crisis_keywords LOOP
    IF text_to_check LIKE '%' || keyword || '%' THEN
      found_keywords := array_append(found_keywords, keyword);
      severity := severity + 1;
    END IF;
  END LOOP;
  
  -- If crisis keywords found, create flag
  IF array_length(found_keywords, 1) > 0 THEN
    INSERT INTO crisis_flags (
      entry_id,
      user_id,
      severity_score,
      keywords_detected,
      context_snippet,
      ai_assessment
    ) VALUES (
      NEW.id,
      NEW.user_id,
      LEAST(severity * 2, 10), -- Scale severity
      found_keywords,
      LEFT(text_to_check, 200),
      'Automatic keyword detection triggered'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic crisis detection
CREATE OR REPLACE TRIGGER check_crisis_on_entry
  AFTER INSERT OR UPDATE ON entries
  FOR EACH ROW
  EXECUTE FUNCTION check_crisis_keywords();

-- Grant necessary permissions
GRANT ALL ON user_sessions TO authenticated;
GRANT ALL ON user_goals TO authenticated;
GRANT ALL ON entry_tags TO authenticated;
GRANT ALL ON ai_feedback TO authenticated;
GRANT ALL ON crisis_resources TO authenticated;
GRANT SELECT ON crisis_flags TO authenticated;

-- Add helpful comments
COMMENT ON TABLE user_sessions IS 'Daily user analytics and mood trend caching for performance';
COMMENT ON TABLE user_goals IS 'User goal tracking and achievement system';
COMMENT ON TABLE entry_tags IS 'Advanced tagging system for entries and analytics';
COMMENT ON TABLE ai_feedback IS 'User feedback on AI responses for quality improvement';
COMMENT ON TABLE crisis_resources IS 'Crisis prevention and safety resources';
COMMENT ON TABLE crisis_flags IS 'Automatic crisis detection and safety monitoring'; 