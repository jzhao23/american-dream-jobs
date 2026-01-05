/**
 * Supabase Client for Career Compass
 *
 * Provides database access for vector embeddings and caching
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Types for our database tables
export interface CareerEmbedding {
  id: number;
  career_slug: string;
  onet_code: string;
  title: string;
  category: string;
  task_embedding: number[] | null;
  narrative_embedding: number[] | null;
  skills_embedding: number[] | null;
  combined_embedding: number[] | null;
  median_salary: number | null;
  ai_resilience: string | null;
  job_zone: number | null;
  embedding_input: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface DWAEmbedding {
  id: number;
  dwa_id: string;
  dwa_title: string;
  iwa_id: string;
  iwa_title: string;
  gwa_id: string;
  gwa_title: string;
  embedding: number[] | null;
  embedding_text: string;
  created_at: string;
}

export interface UserProfileEmbedding {
  id: number;
  profile_hash: string;
  task_embedding: number[] | null;
  narrative_embedding: number[] | null;
  skills_embedding: number[] | null;
  profile_data: Record<string, unknown>;
  created_at: string;
  expires_at: string;
}

export interface SimilarCareer {
  career_slug: string;
  onet_code: string;
  title: string;
  category: string;
  median_salary: number | null;
  ai_resilience: string | null;
  similarity: number;
}

// Singleton Supabase client
let supabaseClient: SupabaseClient | null = null;

/**
 * Get or create Supabase client
 */
export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Please set SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_ANON_KEY) in .env.local'
    );
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey);
  return supabaseClient;
}

/**
 * Insert or update career embedding
 */
export async function upsertCareerEmbedding(
  embedding: Omit<CareerEmbedding, 'id' | 'created_at' | 'updated_at'>
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('career_embeddings')
    .upsert(embedding, { onConflict: 'career_slug' });

  if (error) {
    throw new Error(`Failed to upsert career embedding: ${error.message}`);
  }
}

/**
 * Batch insert career embeddings
 */
export async function batchUpsertCareerEmbeddings(
  embeddings: Omit<CareerEmbedding, 'id' | 'created_at' | 'updated_at'>[]
): Promise<void> {
  const supabase = getSupabaseClient();

  // Supabase has a limit on batch size, process in chunks
  const chunkSize = 100;
  for (let i = 0; i < embeddings.length; i += chunkSize) {
    const chunk = embeddings.slice(i, i + chunkSize);

    const { error } = await supabase
      .from('career_embeddings')
      .upsert(chunk, { onConflict: 'career_slug' });

    if (error) {
      throw new Error(`Failed to upsert career embeddings batch: ${error.message}`);
    }
  }
}

/**
 * Insert or update DWA embedding
 */
export async function upsertDWAEmbedding(
  embedding: Omit<DWAEmbedding, 'id' | 'created_at'>
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('dwa_embeddings')
    .upsert(embedding, { onConflict: 'dwa_id' });

  if (error) {
    throw new Error(`Failed to upsert DWA embedding: ${error.message}`);
  }
}

/**
 * Batch insert DWA embeddings
 */
export async function batchUpsertDWAEmbeddings(
  embeddings: Omit<DWAEmbedding, 'id' | 'created_at'>[]
): Promise<void> {
  const supabase = getSupabaseClient();

  const chunkSize = 100;
  for (let i = 0; i < embeddings.length; i += chunkSize) {
    const chunk = embeddings.slice(i, i + chunkSize);

    const { error } = await supabase
      .from('dwa_embeddings')
      .upsert(chunk, { onConflict: 'dwa_id' });

    if (error) {
      throw new Error(`Failed to upsert DWA embeddings batch: ${error.message}`);
    }
  }
}

/**
 * Find similar careers using weighted multi-field search
 */
export async function findSimilarCareers(
  taskEmbedding: number[],
  narrativeEmbedding: number[],
  skillsEmbedding: number[],
  options: {
    taskWeight?: number;
    narrativeWeight?: number;
    skillsWeight?: number;
    limit?: number;
  } = {}
): Promise<SimilarCareer[]> {
  const supabase = getSupabaseClient();

  const {
    taskWeight = 0.5,
    narrativeWeight = 0.3,
    skillsWeight = 0.2,
    limit = 50
  } = options;

  // Use the custom function for weighted search
  const { data, error } = await supabase.rpc('find_similar_careers', {
    query_task: taskEmbedding,
    query_narrative: narrativeEmbedding,
    query_skills: skillsEmbedding,
    task_weight: taskWeight,
    narrative_weight: narrativeWeight,
    skills_weight: skillsWeight,
    result_limit: limit
  });

  if (error) {
    throw new Error(`Failed to find similar careers: ${error.message}`);
  }

  return data as SimilarCareer[];
}

/**
 * Find similar DWAs
 */
export async function findSimilarDWAs(
  queryEmbedding: number[],
  limit: number = 20
): Promise<{ dwa_id: string; dwa_title: string; similarity: number }[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc('find_careers_by_dwa_similarity', {
    query_embedding: queryEmbedding,
    result_limit: limit
  });

  if (error) {
    throw new Error(`Failed to find similar DWAs: ${error.message}`);
  }

  return data;
}

/**
 * Get career embedding by slug
 */
export async function getCareerEmbedding(slug: string): Promise<CareerEmbedding | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('career_embeddings')
    .select('*')
    .eq('career_slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to get career embedding: ${error.message}`);
  }

  return data as CareerEmbedding;
}

/**
 * Get all career embeddings count
 */
export async function getCareerEmbeddingsCount(): Promise<number> {
  const supabase = getSupabaseClient();

  const { count, error } = await supabase
    .from('career_embeddings')
    .select('*', { count: 'exact', head: true });

  if (error) {
    throw new Error(`Failed to get career embeddings count: ${error.message}`);
  }

  return count || 0;
}

/**
 * Cache user profile embedding
 */
export async function cacheUserProfileEmbedding(
  profileHash: string,
  taskEmbedding: number[],
  narrativeEmbedding: number[],
  skillsEmbedding: number[],
  profileData: Record<string, unknown>
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('user_profile_embeddings')
    .upsert({
      profile_hash: profileHash,
      task_embedding: taskEmbedding,
      narrative_embedding: narrativeEmbedding,
      skills_embedding: skillsEmbedding,
      profile_data: profileData
    }, { onConflict: 'profile_hash' });

  if (error) {
    // Non-critical error, just log
    console.warn(`Failed to cache user profile embedding: ${error.message}`);
  }
}

/**
 * Get cached user profile embedding
 */
export async function getCachedUserProfileEmbedding(
  profileHash: string
): Promise<UserProfileEmbedding | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('user_profile_embeddings')
    .select('*')
    .eq('profile_hash', profileHash)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found or expired
    }
    // Non-critical error
    console.warn(`Failed to get cached profile: ${error.message}`);
    return null;
  }

  return data as UserProfileEmbedding;
}

/**
 * Clean up expired cache entries
 */
export async function cleanupExpiredCache(): Promise<number> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc('cleanup_expired_cache');

  if (error) {
    console.warn(`Failed to cleanup expired cache: ${error.message}`);
    return 0;
  }

  return data as number;
}
