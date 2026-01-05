-- Career Compass Embeddings Schema
-- This migration creates tables for storing vector embeddings for career matching

-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Career embeddings table
-- Stores pre-computed embeddings for all 1,016 careers
CREATE TABLE IF NOT EXISTS career_embeddings (
  id SERIAL PRIMARY KEY,
  career_slug TEXT UNIQUE NOT NULL,
  onet_code TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,

  -- Multi-field embeddings (1536 dimensions each for text-embedding-3-small)
  -- Tasks: What you do day-to-day (50% weight)
  task_embedding vector(1536),
  -- Narrative: Work culture and environment (30% weight)
  narrative_embedding vector(1536),
  -- Skills: Technical and cognitive abilities (20% weight)
  skills_embedding vector(1536),

  -- Combined embedding for quick single-vector search
  combined_embedding vector(1536),

  -- Metadata for filtering
  median_salary INTEGER,
  ai_resilience TEXT,
  job_zone INTEGER,

  -- Source data for re-embedding
  embedding_input JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DWA embeddings table
-- Stores embeddings for 2,087 Detailed Work Activities
CREATE TABLE IF NOT EXISTS dwa_embeddings (
  id SERIAL PRIMARY KEY,
  dwa_id TEXT UNIQUE NOT NULL,
  dwa_title TEXT NOT NULL,
  iwa_id TEXT NOT NULL,
  iwa_title TEXT NOT NULL,
  gwa_id TEXT NOT NULL,
  gwa_title TEXT NOT NULL,

  -- DWA embedding (1536 dimensions)
  embedding vector(1536),

  -- Combined text used for embedding
  embedding_text TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profile embeddings (for caching repeated users)
CREATE TABLE IF NOT EXISTS user_profile_embeddings (
  id SERIAL PRIMARY KEY,
  profile_hash TEXT UNIQUE NOT NULL, -- Hash of user profile for deduplication

  -- Multi-field query embeddings
  task_embedding vector(1536),
  narrative_embedding vector(1536),
  skills_embedding vector(1536),

  -- Original profile data
  profile_data JSONB NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Recommendation cache (optional - for returning users)
CREATE TABLE IF NOT EXISTS recommendation_cache (
  id SERIAL PRIMARY KEY,
  profile_hash TEXT NOT NULL,
  recommendations JSONB NOT NULL,
  processing_time_ms INTEGER,
  cost_usd DECIMAL(10, 6),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Create indexes for fast similarity search using IVFFlat
-- IVFFlat is faster for large datasets, HNSW is more accurate but slower to build

-- Career embeddings indexes (use cosine distance)
CREATE INDEX IF NOT EXISTS idx_career_task_embedding
ON career_embeddings
USING ivfflat (task_embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_career_narrative_embedding
ON career_embeddings
USING ivfflat (narrative_embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_career_skills_embedding
ON career_embeddings
USING ivfflat (skills_embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_career_combined_embedding
ON career_embeddings
USING ivfflat (combined_embedding vector_cosine_ops)
WITH (lists = 100);

-- DWA embeddings index
CREATE INDEX IF NOT EXISTS idx_dwa_embedding
ON dwa_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Additional indexes for filtering
CREATE INDEX IF NOT EXISTS idx_career_category ON career_embeddings(category);
CREATE INDEX IF NOT EXISTS idx_career_ai_resilience ON career_embeddings(ai_resilience);
CREATE INDEX IF NOT EXISTS idx_career_salary ON career_embeddings(median_salary);
CREATE INDEX IF NOT EXISTS idx_career_onet ON career_embeddings(onet_code);

-- Index for cache lookups
CREATE INDEX IF NOT EXISTS idx_profile_hash ON user_profile_embeddings(profile_hash);
CREATE INDEX IF NOT EXISTS idx_recommendation_profile ON recommendation_cache(profile_hash);

-- Index for cache expiration cleanup
CREATE INDEX IF NOT EXISTS idx_profile_expires ON user_profile_embeddings(expires_at);
CREATE INDEX IF NOT EXISTS idx_recommendation_expires ON recommendation_cache(expires_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_career_embeddings_updated_at
  BEFORE UPDATE ON career_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to find similar careers using weighted multi-field search
CREATE OR REPLACE FUNCTION find_similar_careers(
  query_task vector(1536),
  query_narrative vector(1536),
  query_skills vector(1536),
  task_weight FLOAT DEFAULT 0.5,
  narrative_weight FLOAT DEFAULT 0.3,
  skills_weight FLOAT DEFAULT 0.2,
  result_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  career_slug TEXT,
  onet_code TEXT,
  title TEXT,
  category TEXT,
  median_salary INTEGER,
  ai_resilience TEXT,
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
    (
      task_weight * (1 - (ce.task_embedding <=> query_task)) +
      narrative_weight * (1 - (ce.narrative_embedding <=> query_narrative)) +
      skills_weight * (1 - (ce.skills_embedding <=> query_skills))
    ) as similarity
  FROM career_embeddings ce
  WHERE ce.task_embedding IS NOT NULL
    AND ce.narrative_embedding IS NOT NULL
    AND ce.skills_embedding IS NOT NULL
  ORDER BY similarity DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to find careers matching specific DWAs
CREATE OR REPLACE FUNCTION find_careers_by_dwa_similarity(
  query_embedding vector(1536),
  result_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  dwa_id TEXT,
  dwa_title TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.dwa_id,
    de.dwa_title,
    (1 - (de.embedding <=> query_embedding)) as similarity
  FROM dwa_embeddings de
  WHERE de.embedding IS NOT NULL
  ORDER BY de.embedding <=> query_embedding
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Cleanup function for expired cache entries (run via pg_cron or manually)
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted_profiles AS (
    DELETE FROM user_profile_embeddings
    WHERE expires_at < NOW()
    RETURNING id
  ),
  deleted_recommendations AS (
    DELETE FROM recommendation_cache
    WHERE expires_at < NOW()
    RETURNING id
  )
  SELECT
    (SELECT COUNT(*) FROM deleted_profiles) +
    (SELECT COUNT(*) FROM deleted_recommendations)
  INTO deleted_count;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE career_embeddings IS 'Pre-computed vector embeddings for all careers in the database';
COMMENT ON TABLE dwa_embeddings IS 'Vector embeddings for O*NET Detailed Work Activities';
COMMENT ON TABLE user_profile_embeddings IS 'Cached user profile embeddings for repeat queries';
COMMENT ON TABLE recommendation_cache IS 'Cached career recommendations for returning users';
COMMENT ON FUNCTION find_similar_careers IS 'Find top N similar careers using weighted multi-field embedding search';
COMMENT ON FUNCTION find_careers_by_dwa_similarity IS 'Find DWAs similar to a query embedding';
