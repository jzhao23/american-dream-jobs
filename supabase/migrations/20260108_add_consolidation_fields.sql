-- Add consolidation fields to career_embeddings table
-- This migration adds columns to track consolidated careers and filter them in Career Compass

-- Add new columns for consolidation tracking
ALTER TABLE career_embeddings
ADD COLUMN IF NOT EXISTS is_consolidated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS specialization_count INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS parent_career_slug TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'onet';

-- Create indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_career_embeddings_consolidated
ON career_embeddings(is_consolidated);

CREATE INDEX IF NOT EXISTS idx_career_embeddings_parent_career
ON career_embeddings(parent_career_slug);

CREATE INDEX IF NOT EXISTS idx_career_embeddings_data_source
ON career_embeddings(data_source);

-- Drop and recreate find_similar_careers function with consolidation filtering
DROP FUNCTION IF EXISTS find_similar_careers(vector(1536), vector(1536), vector(1536), FLOAT, FLOAT, FLOAT, INTEGER);

-- Updated function with consolidation preference option
-- When prefer_consolidated is true, returns only consolidated careers and non-specialization careers
-- When false, returns all careers (for browsing individual specializations)
CREATE OR REPLACE FUNCTION find_similar_careers(
  query_task vector(1536),
  query_narrative vector(1536),
  query_skills vector(1536),
  task_weight FLOAT DEFAULT 0.5,
  narrative_weight FLOAT DEFAULT 0.3,
  skills_weight FLOAT DEFAULT 0.2,
  result_limit INTEGER DEFAULT 50,
  prefer_consolidated BOOLEAN DEFAULT true
)
RETURNS TABLE (
  career_slug TEXT,
  onet_code TEXT,
  title TEXT,
  category TEXT,
  median_salary INTEGER,
  ai_resilience TEXT,
  is_consolidated BOOLEAN,
  specialization_count INTEGER,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ce.career_slug,
    ce.onet_code,
    ce.title,
    ce.category,
    ce.median_salary,
    ce.ai_resilience,
    ce.is_consolidated,
    ce.specialization_count,
    (
      task_weight * (1 - (ce.task_embedding <=> query_task)) +
      narrative_weight * (1 - (ce.narrative_embedding <=> query_narrative)) +
      skills_weight * (1 - (ce.skills_embedding <=> query_skills))
    ) as similarity
  FROM career_embeddings ce
  WHERE ce.task_embedding IS NOT NULL
    AND ce.narrative_embedding IS NOT NULL
    AND ce.skills_embedding IS NOT NULL
    -- Filter: when prefer_consolidated is true, exclude careers that are specializations
    -- (i.e., have a parent_career_slug set). This ensures we return consolidated careers
    -- and standalone careers, but not individual specializations within a consolidated group.
    AND (NOT prefer_consolidated OR ce.parent_career_slug IS NULL)
  ORDER BY similarity DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Update comment
COMMENT ON FUNCTION find_similar_careers IS 'Find top N similar careers using weighted multi-field embedding search. Set prefer_consolidated=true to exclude individual specializations and return consolidated careers instead.';

-- Add comments for new columns
COMMENT ON COLUMN career_embeddings.is_consolidated IS 'True if this career represents a consolidated group of specializations';
COMMENT ON COLUMN career_embeddings.specialization_count IS 'Number of specializations under this consolidated career (null for non-consolidated)';
COMMENT ON COLUMN career_embeddings.parent_career_slug IS 'For specializations, the slug of the parent consolidated career (null for consolidated and standalone careers)';
COMMENT ON COLUMN career_embeddings.data_source IS 'Source of career data: onet or manual';
