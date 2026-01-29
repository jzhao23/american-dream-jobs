-- Security RLS Policies Migration
-- This migration adds Row Level Security policies to protect user data
--
-- IMPORTANT: These policies are designed for server-side access using service_key.
-- The application uses SUPABASE_SERVICE_KEY which bypasses RLS, but these policies
-- provide defense-in-depth for any direct database access or if RLS is enabled.

-- ===========================================
-- Enable RLS on all tables (defense-in-depth)
-- ===========================================

-- Form submission tables
ALTER TABLE email_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_requests ENABLE ROW LEVEL SECURITY;

-- User data tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE compass_responses ENABLE ROW LEVEL SECURITY;

-- Cache tables (non-sensitive, but RLS for consistency)
ALTER TABLE job_search_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_search_history ENABLE ROW LEVEL SECURITY;

-- Embedding tables (read-only for anon)
ALTER TABLE career_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE dwa_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profile_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_cache ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- EMAIL SUBSCRIPTIONS: Service-only write, no read via anon
-- ===========================================

-- Only service role can insert subscriptions
CREATE POLICY "Service can insert subscriptions"
ON email_subscriptions FOR INSERT
TO service_role
WITH CHECK (true);

-- Only service role can update subscriptions
CREATE POLICY "Service can update subscriptions"
ON email_subscriptions FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Only service role can read subscriptions (admin access only)
CREATE POLICY "Service can read subscriptions"
ON email_subscriptions FOR SELECT
TO service_role
USING (true);

-- ===========================================
-- CAREER CONTRIBUTIONS: Service-only write, approved visible to all
-- ===========================================

-- Only service role can insert contributions
CREATE POLICY "Service can insert contributions"
ON career_contributions FOR INSERT
TO service_role
WITH CHECK (true);

-- Only service role can update contributions
CREATE POLICY "Service can update contributions"
ON career_contributions FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Service can read all contributions
CREATE POLICY "Service can read contributions"
ON career_contributions FOR SELECT
TO service_role
USING (true);

-- Anon can only see approved contributions (no PII exposed)
CREATE POLICY "Anon can read approved contributions"
ON career_contributions FOR SELECT
TO anon
USING (
  status = 'approved' AND
  deleted_at IS NULL AND
  -- Only expose non-PII fields through views, not direct access
  false -- Currently disabled, use API instead
);

-- ===========================================
-- CAREER REQUESTS: Service-only write
-- ===========================================

-- Only service role can insert requests
CREATE POLICY "Service can insert requests"
ON career_requests FOR INSERT
TO service_role
WITH CHECK (true);

-- Only service role can update requests
CREATE POLICY "Service can update requests"
ON career_requests FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Only service role can read requests
CREATE POLICY "Service can read requests"
ON career_requests FOR SELECT
TO service_role
USING (true);

-- ===========================================
-- USER PROFILES: Deny all for alpha (auth disabled)
-- ===========================================

-- During alpha launch, user profiles are disabled
-- These policies ensure no access even if code paths exist
CREATE POLICY "Deny all user profile access during alpha"
ON user_profiles FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- Service role can access for migrations/admin
CREATE POLICY "Service can manage user profiles"
ON user_profiles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ===========================================
-- USER RESUMES: Deny all for alpha (auth disabled)
-- ===========================================

-- During alpha launch, resume storage is disabled
CREATE POLICY "Deny all resume access during alpha"
ON user_resumes FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- Service role can access for migrations/admin
CREATE POLICY "Service can manage resumes"
ON user_resumes FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ===========================================
-- COMPASS RESPONSES: Service-only write
-- ===========================================

-- Only service role can insert compass responses
CREATE POLICY "Service can insert compass responses"
ON compass_responses FOR INSERT
TO service_role
WITH CHECK (true);

-- Only service role can update compass responses
CREATE POLICY "Service can update compass responses"
ON compass_responses FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Only service role can read compass responses
CREATE POLICY "Service can read compass responses"
ON compass_responses FOR SELECT
TO service_role
USING (true);

-- ===========================================
-- JOB SEARCH CACHE: Service can read/write
-- ===========================================

CREATE POLICY "Service can manage job cache"
ON job_search_cache FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ===========================================
-- JOB SEARCH HISTORY: Service can read/write
-- ===========================================

CREATE POLICY "Service can manage job history"
ON job_search_history FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ===========================================
-- CAREER EMBEDDINGS: Read-only for anon (via RPC only)
-- ===========================================

-- Anon can read career embeddings (needed for search)
CREATE POLICY "Anon can read career embeddings"
ON career_embeddings FOR SELECT
TO anon
USING (true);

-- Service role has full access
CREATE POLICY "Service can manage career embeddings"
ON career_embeddings FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ===========================================
-- DWA EMBEDDINGS: Read-only for anon
-- ===========================================

CREATE POLICY "Anon can read DWA embeddings"
ON dwa_embeddings FOR SELECT
TO anon
USING (true);

CREATE POLICY "Service can manage DWA embeddings"
ON dwa_embeddings FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ===========================================
-- USER PROFILE EMBEDDINGS: Service-only (cache)
-- ===========================================

CREATE POLICY "Service can manage profile embeddings"
ON user_profile_embeddings FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ===========================================
-- RECOMMENDATION CACHE: Service-only (cache)
-- ===========================================

CREATE POLICY "Service can manage recommendation cache"
ON recommendation_cache FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ===========================================
-- Comments for documentation
-- ===========================================

COMMENT ON POLICY "Service can insert subscriptions" ON email_subscriptions IS
'Only API routes (via service key) can create subscriptions';

COMMENT ON POLICY "Deny all user profile access during alpha" ON user_profiles IS
'User authentication is disabled for alpha launch - no profile access allowed';

COMMENT ON POLICY "Deny all resume access during alpha" ON user_resumes IS
'Resume storage is disabled for alpha launch - resumes only stored in browser localStorage';
