-- Security RLS Policies Migration
-- This migration adds Row Level Security policies to protect user data
--
-- IMPORTANT: These policies are designed for server-side access using service_key.
-- The application uses SUPABASE_SERVICE_KEY which bypasses RLS, but these policies
-- provide defense-in-depth for any direct database access or if RLS is enabled.
--
-- NOTE: This migration only applies to tables that exist. Run other migrations first
-- if you want full coverage.

-- ===========================================
-- Enable RLS on tables that exist
-- ===========================================

-- Form submission tables (from 20260109_form_submissions.sql)
DO $$ BEGIN
  ALTER TABLE email_subscriptions ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE career_contributions ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE career_requests ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- Embedding tables (from 20260104_career_compass_embeddings.sql)
DO $$ BEGIN
  ALTER TABLE career_embeddings ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE dwa_embeddings ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE user_profile_embeddings ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE recommendation_cache ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- User data tables (from 20260110_user_data.sql - may not exist yet)
DO $$ BEGIN
  ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE user_resumes ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE compass_responses ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE job_search_cache ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE job_search_history ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ===========================================
-- EMAIL SUBSCRIPTIONS: Service-only write, no read via anon
-- ===========================================

DO $$ BEGIN
  DROP POLICY IF EXISTS "Service can insert subscriptions" ON email_subscriptions;
  CREATE POLICY "Service can insert subscriptions"
  ON email_subscriptions FOR INSERT
  TO service_role
  WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Service can update subscriptions" ON email_subscriptions;
  CREATE POLICY "Service can update subscriptions"
  ON email_subscriptions FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Service can read subscriptions" ON email_subscriptions;
  CREATE POLICY "Service can read subscriptions"
  ON email_subscriptions FOR SELECT
  TO service_role
  USING (true);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ===========================================
-- CAREER CONTRIBUTIONS: Service-only write
-- ===========================================

DO $$ BEGIN
  DROP POLICY IF EXISTS "Service can insert contributions" ON career_contributions;
  CREATE POLICY "Service can insert contributions"
  ON career_contributions FOR INSERT
  TO service_role
  WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Service can update contributions" ON career_contributions;
  CREATE POLICY "Service can update contributions"
  ON career_contributions FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Service can read contributions" ON career_contributions;
  CREATE POLICY "Service can read contributions"
  ON career_contributions FOR SELECT
  TO service_role
  USING (true);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ===========================================
-- CAREER REQUESTS: Service-only write
-- ===========================================

DO $$ BEGIN
  DROP POLICY IF EXISTS "Service can insert requests" ON career_requests;
  CREATE POLICY "Service can insert requests"
  ON career_requests FOR INSERT
  TO service_role
  WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Service can update requests" ON career_requests;
  CREATE POLICY "Service can update requests"
  ON career_requests FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Service can read requests" ON career_requests;
  CREATE POLICY "Service can read requests"
  ON career_requests FOR SELECT
  TO service_role
  USING (true);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ===========================================
-- CAREER EMBEDDINGS: Read-only for anon (needed for search)
-- ===========================================

DO $$ BEGIN
  DROP POLICY IF EXISTS "Anon can read career embeddings" ON career_embeddings;
  CREATE POLICY "Anon can read career embeddings"
  ON career_embeddings FOR SELECT
  TO anon
  USING (true);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Service can manage career embeddings" ON career_embeddings;
  CREATE POLICY "Service can manage career embeddings"
  ON career_embeddings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ===========================================
-- DWA EMBEDDINGS: Read-only for anon
-- ===========================================

DO $$ BEGIN
  DROP POLICY IF EXISTS "Anon can read DWA embeddings" ON dwa_embeddings;
  CREATE POLICY "Anon can read DWA embeddings"
  ON dwa_embeddings FOR SELECT
  TO anon
  USING (true);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Service can manage DWA embeddings" ON dwa_embeddings;
  CREATE POLICY "Service can manage DWA embeddings"
  ON dwa_embeddings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ===========================================
-- USER PROFILE EMBEDDINGS: Service-only (cache)
-- ===========================================

DO $$ BEGIN
  DROP POLICY IF EXISTS "Service can manage profile embeddings" ON user_profile_embeddings;
  CREATE POLICY "Service can manage profile embeddings"
  ON user_profile_embeddings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ===========================================
-- RECOMMENDATION CACHE: Service-only (cache)
-- ===========================================

DO $$ BEGIN
  DROP POLICY IF EXISTS "Service can manage recommendation cache" ON recommendation_cache;
  CREATE POLICY "Service can manage recommendation cache"
  ON recommendation_cache FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ===========================================
-- USER PROFILES: Deny all for alpha (if table exists)
-- ===========================================

DO $$ BEGIN
  DROP POLICY IF EXISTS "Deny all user profile access during alpha" ON user_profiles;
  CREATE POLICY "Deny all user profile access during alpha"
  ON user_profiles FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Service can manage user profiles" ON user_profiles;
  CREATE POLICY "Service can manage user profiles"
  ON user_profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ===========================================
-- USER RESUMES: Deny all for alpha (if table exists)
-- ===========================================

DO $$ BEGIN
  DROP POLICY IF EXISTS "Deny all resume access during alpha" ON user_resumes;
  CREATE POLICY "Deny all resume access during alpha"
  ON user_resumes FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Service can manage resumes" ON user_resumes;
  CREATE POLICY "Service can manage resumes"
  ON user_resumes FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ===========================================
-- COMPASS RESPONSES: Service-only (if table exists)
-- ===========================================

DO $$ BEGIN
  DROP POLICY IF EXISTS "Service can insert compass responses" ON compass_responses;
  CREATE POLICY "Service can insert compass responses"
  ON compass_responses FOR INSERT
  TO service_role
  WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Service can update compass responses" ON compass_responses;
  CREATE POLICY "Service can update compass responses"
  ON compass_responses FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Service can read compass responses" ON compass_responses;
  CREATE POLICY "Service can read compass responses"
  ON compass_responses FOR SELECT
  TO service_role
  USING (true);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ===========================================
-- JOB SEARCH CACHE: Service can read/write (if table exists)
-- ===========================================

DO $$ BEGIN
  DROP POLICY IF EXISTS "Service can manage job cache" ON job_search_cache;
  CREATE POLICY "Service can manage job cache"
  ON job_search_cache FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ===========================================
-- JOB SEARCH HISTORY: Service can read/write (if table exists)
-- ===========================================

DO $$ BEGIN
  DROP POLICY IF EXISTS "Service can manage job history" ON job_search_history;
  CREATE POLICY "Service can manage job history"
  ON job_search_history FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN NULL; END $$;
