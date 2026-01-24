-- Comprehensive Career Compass Data Migration
-- Adds columns to store full resume text, parsed profile, and metadata for complete reconstruction

-- Add resume text column (for users without account or for direct text input)
ALTER TABLE compass_responses
ADD COLUMN IF NOT EXISTS resume_text TEXT;

-- Add parsed profile from resume analysis
ALTER TABLE compass_responses
ADD COLUMN IF NOT EXISTS parsed_profile JSONB;

-- Add metadata (processing stats, costs, stage info)
ALTER TABLE compass_responses
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add location short name for display
ALTER TABLE compass_responses
ADD COLUMN IF NOT EXISTS location_short_name TEXT;

-- Add updated_at for tracking overwrites
ALTER TABLE compass_responses
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_compass_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_compass_responses_updated_at ON compass_responses;
CREATE TRIGGER update_compass_responses_updated_at
  BEFORE UPDATE ON compass_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_compass_responses_updated_at();

-- Add index for faster user lookups with ordering
CREATE INDEX IF NOT EXISTS idx_compass_responses_user_latest
ON compass_responses(user_id, created_at DESC)
WHERE user_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN compass_responses.resume_text IS 'Full resume text for reconstruction (non-sensitive career data only)';
COMMENT ON COLUMN compass_responses.parsed_profile IS 'Parsed profile from resume: skills, jobTitles, education, industries, experienceYears';
COMMENT ON COLUMN compass_responses.metadata IS 'Processing metadata: stage candidates, processing time, cost, model info';
COMMENT ON COLUMN compass_responses.location_short_name IS 'Short display name for location (e.g., "New York")';
