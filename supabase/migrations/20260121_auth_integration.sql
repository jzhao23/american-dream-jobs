-- Authentication Integration Migration
-- Links user_profiles to Supabase Auth users
--
-- Purpose:
-- This migration adds the auth_id column to user_profiles table to link
-- our application's user profiles with Supabase Auth users. This enables:
-- 1. Email/password authentication via Supabase Auth
-- 2. Persistent user data across sessions/devices
-- 3. Secure session management
--
-- Data flow:
-- 1. User signs up/in via Supabase Auth -> creates auth.users record
-- 2. On successful auth, we get or create a user_profiles record
-- 3. user_profiles.auth_id links to auth.users(id)

-- Add auth_id column to user_profiles
-- This column links to Supabase's auth.users table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;

-- Add index for faster lookups by auth_id
CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_id
ON user_profiles(auth_id)
WHERE auth_id IS NOT NULL;

-- Function to get or create user profile from Supabase Auth
-- Called after successful authentication
CREATE OR REPLACE FUNCTION get_or_create_user_from_auth(
  p_auth_id UUID,
  p_email TEXT,
  p_location_code TEXT DEFAULT NULL,
  p_location_name TEXT DEFAULT NULL
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
  -- First, try to find user by auth_id (already linked)
  SELECT id INTO v_user_id
  FROM user_profiles
  WHERE auth_id = p_auth_id
    AND deleted_at IS NULL;

  IF v_user_id IS NOT NULL THEN
    -- User found by auth_id
    SELECT EXISTS(
      SELECT 1 FROM user_resumes
      WHERE user_id = v_user_id AND is_active = TRUE
    ) INTO v_has_resume;

    RETURN QUERY SELECT v_user_id, FALSE, v_has_resume;
    RETURN;
  END IF;

  -- Try to find existing user by email (for migration from anonymous)
  SELECT id INTO v_user_id
  FROM user_profiles
  WHERE email = LOWER(TRIM(p_email))
    AND auth_id IS NULL
    AND deleted_at IS NULL;

  IF v_user_id IS NOT NULL THEN
    -- Link existing anonymous profile to auth
    UPDATE user_profiles
    SET auth_id = p_auth_id,
        email_verified = TRUE,
        updated_at = NOW()
    WHERE id = v_user_id;

    SELECT EXISTS(
      SELECT 1 FROM user_resumes
      WHERE user_id = v_user_id AND is_active = TRUE
    ) INTO v_has_resume;

    RETURN QUERY SELECT v_user_id, FALSE, v_has_resume;
    RETURN;
  END IF;

  -- Create new user profile
  INSERT INTO user_profiles (
    auth_id,
    email,
    email_verified,
    location_code,
    location_name,
    tc_accepted_at,
    tc_version
  )
  VALUES (
    p_auth_id,
    LOWER(TRIM(p_email)),
    TRUE,
    p_location_code,
    p_location_name,
    NOW(),
    '1.0'
  )
  RETURNING id INTO v_user_id;

  v_is_new := TRUE;

  RETURN QUERY SELECT v_user_id, v_is_new, FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to link anonymous user data to authenticated user
-- Called when a user who has anonymous data signs up/in
CREATE OR REPLACE FUNCTION link_anonymous_data_to_user(
  p_auth_user_id UUID,
  p_session_id TEXT
)
RETURNS INTEGER AS $$
DECLARE
  v_user_profile_id UUID;
  v_linked_count INTEGER := 0;
BEGIN
  -- Get the user profile ID
  SELECT id INTO v_user_profile_id
  FROM user_profiles
  WHERE auth_id = p_auth_user_id
    AND deleted_at IS NULL;

  IF v_user_profile_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Link compass responses from this session to the user
  UPDATE compass_responses
  SET user_id = v_user_profile_id
  WHERE session_id = p_session_id
    AND user_id IS NULL;

  GET DIAGNOSTICS v_linked_count = ROW_COUNT;

  RETURN v_linked_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON COLUMN user_profiles.auth_id IS 'Links to Supabase auth.users(id) for authenticated users';
COMMENT ON FUNCTION get_or_create_user_from_auth IS 'Get or create user profile from Supabase Auth credentials';
COMMENT ON FUNCTION link_anonymous_data_to_user IS 'Link anonymous session data (compass responses) to authenticated user';
