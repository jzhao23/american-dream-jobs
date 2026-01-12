-- ============================================================================
-- Financial Aid / Scholarships Tables
-- Version: 2.3
-- Description: Scholarship and financial aid information per career
-- ============================================================================

-- Scholarships table
CREATE TABLE IF NOT EXISTS scholarships (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  provider TEXT NOT NULL,
  amount_min NUMERIC,
  amount_max NUMERIC,
  amount_text TEXT,  -- For "Full tuition", "Varies", etc.
  eligibility TEXT,
  deadline TEXT,
  renewable BOOLEAN DEFAULT FALSE,
  scope TEXT CHECK (scope IN ('national', 'state', 'local', 'institution')),
  verified BOOLEAN DEFAULT FALSE,
  last_verified TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Career-scholarship junction
CREATE TABLE IF NOT EXISTS career_scholarships (
  career_slug TEXT NOT NULL,
  scholarship_id TEXT NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (career_slug, scholarship_id)
);

-- Category-level financial aid resources
CREATE TABLE IF NOT EXISTS category_financial_resources (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  resource_type TEXT CHECK (resource_type IN ('scholarship_db', 'federal_aid', 'employer', 'general')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Federal aid eligibility by education level
CREATE TABLE IF NOT EXISTS education_federal_aid (
  education_level TEXT PRIMARY KEY,
  federal_aid_eligible BOOLEAN NOT NULL,
  typical_aid_sources TEXT[] NOT NULL,
  notes TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_career_scholarships ON career_scholarships(career_slug);
CREATE INDEX IF NOT EXISTS idx_scholarships_scope ON scholarships(scope);
CREATE INDEX IF NOT EXISTS idx_category_financial ON category_financial_resources(category);

-- Updated at trigger for scholarships
CREATE OR REPLACE FUNCTION update_scholarships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS scholarships_updated_at ON scholarships;
CREATE TRIGGER scholarships_updated_at
  BEFORE UPDATE ON scholarships
  FOR EACH ROW
  EXECUTE FUNCTION update_scholarships_updated_at();

-- Seed federal aid eligibility data
INSERT INTO education_federal_aid (education_level, federal_aid_eligible, typical_aid_sources, notes)
VALUES
  ('No formal educational credential', FALSE, ARRAY['Workforce development grants'], 'Limited federal aid; state programs may apply'),
  ('High school diploma or equivalent', FALSE, ARRAY['Workforce development grants'], 'Limited federal aid; vocational programs may qualify'),
  ('Some college, no degree', TRUE, ARRAY['Pell Grant', 'Federal student loans', 'Work-study'], 'Standard federal aid applies'),
  ('Postsecondary nondegree award', TRUE, ARRAY['Pell Grant', 'Federal student loans'], 'Aid available for eligible certificate programs'),
  ('Associate''s degree', TRUE, ARRAY['Pell Grant', 'Federal student loans', 'Work-study'], 'Full federal aid available'),
  ('Bachelor''s degree', TRUE, ARRAY['Pell Grant', 'Federal student loans', 'Work-study', 'TEACH Grant'], 'Full federal aid available'),
  ('Master''s degree', TRUE, ARRAY['Federal student loans', 'Graduate PLUS loans', 'Assistantships'], 'Graduate-level aid available'),
  ('Doctoral or professional degree', TRUE, ARRAY['Federal student loans', 'Graduate PLUS loans', 'Fellowships', 'Assistantships'], 'Advanced degree aid available')
ON CONFLICT (education_level) DO NOTHING;

-- Comments
COMMENT ON TABLE scholarships IS 'Curated scholarship opportunities for career training';
COMMENT ON TABLE career_scholarships IS 'Links careers to relevant scholarships';
COMMENT ON TABLE category_financial_resources IS 'General financial aid resources by category';
COMMENT ON TABLE education_federal_aid IS 'Federal aid eligibility by education level';
