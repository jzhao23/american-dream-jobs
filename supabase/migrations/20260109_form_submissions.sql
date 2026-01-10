-- Form Submissions Schema
-- This migration creates tables for storing email subscriptions, career contributions, and career requests

-- ===========================================
-- Email Subscriptions Table
-- ===========================================
CREATE TABLE IF NOT EXISTS email_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  persona TEXT CHECK (persona IN ('student', 'switcher', 'practitioner', 'educator')),
  source TEXT DEFAULT 'website',
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Unique constraint on email for active subscriptions only
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_subscriptions_email_unique
ON email_subscriptions(email)
WHERE deleted_at IS NULL;

-- Index for lookup by email
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_email
ON email_subscriptions(email);

-- Index for persona analytics
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_persona
ON email_subscriptions(persona)
WHERE deleted_at IS NULL;

-- Index for active subscriptions
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_active
ON email_subscriptions(deleted_at)
WHERE deleted_at IS NULL AND unsubscribed_at IS NULL;

-- ===========================================
-- Career Contributions Table
-- ===========================================
CREATE TABLE IF NOT EXISTS career_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_slug TEXT,
  submission_type TEXT NOT NULL CHECK (submission_type IN ('correction', 'experience', 'video')),
  content TEXT NOT NULL,
  contributor_name TEXT,
  contributor_email TEXT,
  link TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected')),
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT,
  ip_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Index for filtering by career
CREATE INDEX IF NOT EXISTS idx_career_contributions_career
ON career_contributions(career_slug);

-- Index for status-based queries (admin review)
CREATE INDEX IF NOT EXISTS idx_career_contributions_status
ON career_contributions(status)
WHERE deleted_at IS NULL;

-- Index for submission type analytics
CREATE INDEX IF NOT EXISTS idx_career_contributions_type
ON career_contributions(submission_type)
WHERE deleted_at IS NULL;

-- Index for recent submissions
CREATE INDEX IF NOT EXISTS idx_career_contributions_created
ON career_contributions(created_at DESC)
WHERE deleted_at IS NULL;

-- ===========================================
-- Career Requests Table
-- ===========================================
CREATE TABLE IF NOT EXISTS career_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_title TEXT NOT NULL,
  reason TEXT,
  additional_info TEXT,
  requester_email TEXT,
  vote_count INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'declined')),
  implemented_career_slug TEXT,
  ip_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Index for finding existing requests (for vote counting)
CREATE INDEX IF NOT EXISTS idx_career_requests_title
ON career_requests(LOWER(career_title))
WHERE deleted_at IS NULL;

-- Index for status-based queries
CREATE INDEX IF NOT EXISTS idx_career_requests_status
ON career_requests(status)
WHERE deleted_at IS NULL;

-- Index for popular requests (by vote count)
CREATE INDEX IF NOT EXISTS idx_career_requests_votes
ON career_requests(vote_count DESC)
WHERE deleted_at IS NULL AND status = 'pending';

-- Index for recent requests
CREATE INDEX IF NOT EXISTS idx_career_requests_created
ON career_requests(created_at DESC)
WHERE deleted_at IS NULL;

-- ===========================================
-- Helper Functions
-- ===========================================

-- Function to soft delete by email (GDPR compliance)
CREATE OR REPLACE FUNCTION gdpr_delete_by_email(p_email TEXT)
RETURNS TABLE (
  subscriptions_deleted INTEGER,
  contributions_anonymized INTEGER,
  requests_anonymized INTEGER
) AS $$
DECLARE
  v_subscriptions INTEGER;
  v_contributions INTEGER;
  v_requests INTEGER;
BEGIN
  -- Soft delete subscriptions
  UPDATE email_subscriptions
  SET deleted_at = NOW(),
      email = 'deleted_' || id || '@deleted.local'
  WHERE email = LOWER(TRIM(p_email))
    AND deleted_at IS NULL;
  GET DIAGNOSTICS v_subscriptions = ROW_COUNT;

  -- Anonymize contributions
  UPDATE career_contributions
  SET contributor_email = NULL,
      contributor_name = 'Anonymous'
  WHERE contributor_email = LOWER(TRIM(p_email));
  GET DIAGNOSTICS v_contributions = ROW_COUNT;

  -- Anonymize career requests
  UPDATE career_requests
  SET requester_email = NULL
  WHERE requester_email = LOWER(TRIM(p_email));
  GET DIAGNOSTICS v_requests = ROW_COUNT;

  RETURN QUERY SELECT v_subscriptions, v_contributions, v_requests;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- Comments for Documentation
-- ===========================================
COMMENT ON TABLE email_subscriptions IS 'Newsletter and update subscriptions from website forms';
COMMENT ON TABLE career_contributions IS 'User-submitted corrections, experiences, and video links for careers';
COMMENT ON TABLE career_requests IS 'Requests for new careers to be added to the database';
COMMENT ON FUNCTION gdpr_delete_by_email IS 'GDPR-compliant deletion/anonymization of user data by email';
