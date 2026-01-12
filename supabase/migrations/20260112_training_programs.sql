-- ============================================================================
-- Training Programs Tables
-- Version: 2.3
-- Description: Curated training program recommendations per career
-- ============================================================================

-- Training programs table (source of truth for curated programs)
CREATE TABLE IF NOT EXISTS training_programs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bootcamp', 'certification', 'online_course', 'apprenticeship', 'degree_program', 'professional_development')),
  provider TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  duration_months INTEGER,
  format TEXT CHECK (format IN ('online', 'in-person', 'hybrid')),
  cost_amount NUMERIC,
  cost_type TEXT CHECK (cost_type IN ('free', 'low', 'moderate', 'high')),
  cost_notes TEXT,
  credential_earned TEXT,
  relevance_score INTEGER CHECK (relevance_score BETWEEN 1 AND 5),
  verified BOOLEAN DEFAULT FALSE,
  last_verified TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction table for career-program relationships
CREATE TABLE IF NOT EXISTS career_training_programs (
  career_slug TEXT NOT NULL,
  program_id TEXT NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (career_slug, program_id)
);

-- Category-level training resources
CREATE TABLE IF NOT EXISTS category_training_resources (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_career_training_career ON career_training_programs(career_slug);
CREATE INDEX IF NOT EXISTS idx_training_programs_type ON training_programs(type);
CREATE INDEX IF NOT EXISTS idx_category_training ON category_training_resources(category);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_training_programs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS training_programs_updated_at ON training_programs;
CREATE TRIGGER training_programs_updated_at
  BEFORE UPDATE ON training_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_training_programs_updated_at();

-- Comments
COMMENT ON TABLE training_programs IS 'Curated training programs for career development';
COMMENT ON TABLE career_training_programs IS 'Links careers to relevant training programs';
COMMENT ON TABLE category_training_resources IS 'General training resources by career category';
