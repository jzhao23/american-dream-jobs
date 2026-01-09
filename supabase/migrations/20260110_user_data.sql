-- User Data Schema for Find Jobs Feature
-- This migration creates tables for storing user profiles, resumes, and job search data

-- User profiles table (core user identity)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,

  -- Location preferences
  location_code TEXT,
  location_name TEXT,

  -- Terms & Conditions acceptance
  tc_accepted_at TIMESTAMPTZ NOT NULL,
  tc_version TEXT DEFAULT '1.0',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Soft delete
  deleted_at TIMESTAMPTZ
);

-- User resumes table
CREATE TABLE IF NOT EXISTS user_resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- File metadata
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'pdf', 'docx', 'doc', 'txt', 'md'
  file_size_bytes INTEGER NOT NULL,

  -- Storage reference (Supabase Storage path)
  storage_path TEXT NOT NULL,

  -- Extracted and parsed content
  extracted_text TEXT,
  parsed_profile JSONB, -- Skills, experience, education from resume parser
  parse_confidence FLOAT,

  -- Version tracking (users can upload multiple versions)
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Career Compass questionnaire responses
-- Enhanced to link to user profiles for permanent storage
CREATE TABLE IF NOT EXISTS compass_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to user (optional for anonymous, required for registered)
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL, -- Browser session ID for anonymous users

  -- Questionnaire answers (matches CareerCompassWizard state)
  training_willingness TEXT, -- 'minimal', 'short-term', 'medium', 'significant'
  education_level TEXT, -- 'high-school', 'some-college', 'bachelors', 'masters-plus'
  work_background TEXT[], -- Array of selected backgrounds
  salary_target TEXT, -- 'under-40k', '40-60k', '60-80k', '80-100k', '100k-plus'
  work_style TEXT[], -- Array of selected work styles (max 2)
  additional_context TEXT, -- "Anything else we should know?"

  -- Location at time of submission
  location_code TEXT,
  location_name TEXT,

  -- Resume reference (if provided during compass)
  resume_id UUID REFERENCES user_resumes(id) ON DELETE SET NULL,

  -- Results metadata
  recommendations JSONB, -- Cached career recommendations
  model_used TEXT, -- 'model-a' (with resume) or 'model-b' (without)
  processing_time_ms INTEGER,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job search cache (24-hour TTL to reduce API calls)
CREATE TABLE IF NOT EXISTS job_search_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Cache key: career_slug:location_code:filters_hash
  cache_key TEXT UNIQUE NOT NULL,

  -- Search parameters
  career_slug TEXT NOT NULL,
  career_title TEXT NOT NULL,
  location_code TEXT NOT NULL,
  location_name TEXT NOT NULL,
  filters JSONB, -- Any filters applied

  -- Cached results
  results JSONB NOT NULL, -- Array of job listings
  results_count INTEGER NOT NULL,
  api_source TEXT NOT NULL, -- 'serpapi', 'jsearch', 'usajobs', 'mixed'

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Job search history (analytics and user history)
CREATE TABLE IF NOT EXISTS job_search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to user (optional for anonymous searches)
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,

  -- Search details
  career_slug TEXT NOT NULL,
  career_title TEXT NOT NULL,
  location_code TEXT NOT NULL,
  location_name TEXT NOT NULL,

  -- Results summary
  results_count INTEGER,
  api_source TEXT,
  cache_hit BOOLEAN DEFAULT FALSE,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_deleted ON user_profiles(deleted_at) WHERE deleted_at IS NULL;

-- Indexes for user_resumes
CREATE INDEX IF NOT EXISTS idx_user_resumes_user ON user_resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_resumes_active ON user_resumes(user_id, is_active) WHERE is_active = TRUE;

-- Indexes for compass_responses
CREATE INDEX IF NOT EXISTS idx_compass_responses_user ON compass_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_compass_responses_session ON compass_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_compass_responses_created ON compass_responses(created_at DESC);

-- Indexes for job_search_cache
CREATE INDEX IF NOT EXISTS idx_job_cache_key ON job_search_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_job_cache_career ON job_search_cache(career_slug);
CREATE INDEX IF NOT EXISTS idx_job_cache_expires ON job_search_cache(expires_at);

-- Indexes for job_search_history
CREATE INDEX IF NOT EXISTS idx_job_history_user ON job_search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_job_history_career ON job_search_history(career_slug);
CREATE INDEX IF NOT EXISTS idx_job_history_created ON job_search_history(created_at DESC);

-- Trigger to auto-update updated_at on user_profiles
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update updated_at on user_resumes
CREATE TRIGGER update_user_resumes_updated_at
  BEFORE UPDATE ON user_resumes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to cleanup expired job search cache
CREATE OR REPLACE FUNCTION cleanup_expired_job_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM job_search_cache
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create user by email
CREATE OR REPLACE FUNCTION get_or_create_user(
  p_email TEXT,
  p_location_code TEXT DEFAULT NULL,
  p_location_name TEXT DEFAULT NULL,
  p_tc_version TEXT DEFAULT '1.0'
)
RETURNS TABLE (
  user_id UUID,
  is_new BOOLEAN,
  has_resume BOOLEAN
) AS $$
DECLARE
  v_user_id UUID;
  v_is_new BOOLEAN := FALSE;
  v_has_resume BOOLEAN := FALSE;
BEGIN
  -- Try to find existing user
  SELECT id INTO v_user_id
  FROM user_profiles
  WHERE email = LOWER(TRIM(p_email))
    AND deleted_at IS NULL;

  IF v_user_id IS NULL THEN
    -- Create new user
    INSERT INTO user_profiles (email, location_code, location_name, tc_accepted_at, tc_version)
    VALUES (LOWER(TRIM(p_email)), p_location_code, p_location_name, NOW(), p_tc_version)
    RETURNING id INTO v_user_id;

    v_is_new := TRUE;
  ELSE
    -- Update location if provided
    IF p_location_code IS NOT NULL THEN
      UPDATE user_profiles
      SET location_code = p_location_code,
          location_name = p_location_name,
          updated_at = NOW()
      WHERE id = v_user_id;
    END IF;
  END IF;

  -- Check if user has active resume
  SELECT EXISTS(
    SELECT 1 FROM user_resumes
    WHERE user_id = v_user_id AND is_active = TRUE
  ) INTO v_has_resume;

  RETURN QUERY SELECT v_user_id, v_is_new, v_has_resume;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE user_profiles IS 'Core user identity and preferences for Find Jobs feature';
COMMENT ON TABLE user_resumes IS 'User-uploaded resumes with parsed content';
COMMENT ON TABLE compass_responses IS 'Career Compass questionnaire responses linked to users';
COMMENT ON TABLE job_search_cache IS '24-hour cache for job search results to reduce API calls';
COMMENT ON TABLE job_search_history IS 'Analytics and history of job searches';
COMMENT ON FUNCTION get_or_create_user IS 'Get existing user or create new one by email';
COMMENT ON FUNCTION cleanup_expired_job_cache IS 'Remove expired job search cache entries';
