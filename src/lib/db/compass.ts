/**
 * Compass Responses Database Operations
 *
 * Handles saving and retrieving Career Compass questionnaire responses
 * with comprehensive data for full reconstruction of inputs/outputs
 */

import { getSupabaseClient } from '../compass/supabase';

// Types for parsed profile from resume
export interface ParsedProfile {
  skills: string[];
  jobTitles: string[];
  education: {
    level: string;
    fields: string[];
  };
  industries: string[];
  experienceYears: number;
  confidence: number;
}

// Types for career recommendations
export interface CareerMatch {
  slug: string;
  title: string;
  category: string;
  matchScore: number;
  medianPay: number;
  aiResilience: string;
  reasoning: string;
  skillsGap: [string, string, string];
  transitionTimeline: string;
  education: string;
}

// Types for processing metadata
export interface CompassMetadata {
  stage1Candidates: number;
  stage2Candidates: number;
  finalMatches: number;
  processingTimeMs: number;
  costUsd: number;
}

// Full compass response from database
export interface CompassResponse {
  id: string;
  user_id: string | null;
  session_id: string;
  training_willingness: string | null;
  education_level: string | null;
  work_background: string[] | null;
  salary_target: string | null;
  work_style: string[] | null;
  additional_context: string | null;
  location_code: string | null;
  location_name: string | null;
  location_short_name: string | null;
  resume_id: string | null;
  resume_text: string | null;
  parsed_profile: ParsedProfile | null;
  recommendations: CareerMatch[] | null;
  metadata: CompassMetadata | null;
  model_used: string | null;
  processing_time_ms: number | null;
  created_at: string;
  updated_at: string | null;
}

// Input for saving compass response
export interface SaveCompassResponseInput {
  userId?: string;
  sessionId: string;
  trainingWillingness?: string;
  educationLevel?: string;
  workBackground?: string[];
  salaryTarget?: string;
  workStyle?: string[];
  additionalContext?: string;
  locationCode?: string;
  locationName?: string;
  locationShortName?: string;
  resumeId?: string;
  resumeText?: string;
  parsedProfile?: ParsedProfile;
  recommendations?: CareerMatch[];
  metadata?: CompassMetadata;
  modelUsed?: string;
  processingTimeMs?: number;
}

/**
 * Save a compass response (creates new record)
 */
export async function saveCompassResponse(input: SaveCompassResponseInput): Promise<CompassResponse> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('compass_responses')
    .insert({
      user_id: input.userId || null,
      session_id: input.sessionId,
      training_willingness: input.trainingWillingness || null,
      education_level: input.educationLevel || null,
      work_background: input.workBackground || null,
      salary_target: input.salaryTarget || null,
      work_style: input.workStyle || null,
      additional_context: input.additionalContext || null,
      location_code: input.locationCode || null,
      location_name: input.locationName || null,
      location_short_name: input.locationShortName || null,
      resume_id: input.resumeId || null,
      resume_text: input.resumeText || null,
      parsed_profile: input.parsedProfile || null,
      recommendations: input.recommendations || null,
      metadata: input.metadata || null,
      model_used: input.modelUsed || null,
      processing_time_ms: input.processingTimeMs || null
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save compass response: ${error.message}`);
  }

  return data as CompassResponse;
}

/**
 * Upsert compass response for a user (new runs overwrite old)
 * For users with accounts, we keep only the latest result
 */
export async function upsertUserCompassResponse(input: SaveCompassResponseInput): Promise<CompassResponse> {
  if (!input.userId) {
    // No user ID, just insert normally
    return saveCompassResponse(input);
  }

  const supabase = getSupabaseClient();

  // First, try to find existing response for this user
  const { data: existing } = await supabase
    .from('compass_responses')
    .select('id')
    .eq('user_id', input.userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (existing) {
    // Update existing record
    const { data, error } = await supabase
      .from('compass_responses')
      .update({
        session_id: input.sessionId,
        training_willingness: input.trainingWillingness || null,
        education_level: input.educationLevel || null,
        work_background: input.workBackground || null,
        salary_target: input.salaryTarget || null,
        work_style: input.workStyle || null,
        additional_context: input.additionalContext || null,
        location_code: input.locationCode || null,
        location_name: input.locationName || null,
        location_short_name: input.locationShortName || null,
        resume_id: input.resumeId || null,
        resume_text: input.resumeText || null,
        parsed_profile: input.parsedProfile || null,
        recommendations: input.recommendations || null,
        metadata: input.metadata || null,
        model_used: input.modelUsed || null,
        processing_time_ms: input.processingTimeMs || null
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update compass response: ${error.message}`);
    }

    return data as CompassResponse;
  }

  // No existing record, insert new
  return saveCompassResponse(input);
}

/**
 * Get compass responses for a user
 */
export async function getUserCompassResponses(userId: string): Promise<CompassResponse[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('compass_responses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get user compass responses: ${error.message}`);
  }

  return data as CompassResponse[];
}

/**
 * Get latest compass response for a user
 */
export async function getLatestCompassResponse(userId: string): Promise<CompassResponse | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('compass_responses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get latest compass response: ${error.message}`);
  }

  return data as CompassResponse;
}

/**
 * Link anonymous compass responses to a user
 */
export async function linkCompassResponsesToUser(
  sessionId: string,
  userId: string
): Promise<number> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('compass_responses')
    .update({ user_id: userId })
    .eq('session_id', sessionId)
    .is('user_id', null)
    .select();

  if (error) {
    throw new Error(`Failed to link compass responses: ${error.message}`);
  }

  return data?.length || 0;
}

/**
 * Update compass response with recommendations
 */
export async function updateCompassRecommendations(
  responseId: string,
  recommendations: unknown,
  modelUsed: string,
  processingTimeMs: number
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('compass_responses')
    .update({
      recommendations,
      model_used: modelUsed,
      processing_time_ms: processingTimeMs
    })
    .eq('id', responseId);

  if (error) {
    throw new Error(`Failed to update compass recommendations: ${error.message}`);
  }
}

/**
 * Get comprehensive compass results for a user
 * Returns the latest results with all data needed for reconstruction
 */
export async function getCompassResultsForUser(userId: string): Promise<CompassResponse | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('compass_responses')
    .select('*')
    .eq('user_id', userId)
    .not('recommendations', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get compass results: ${error.message}`);
  }

  return data as CompassResponse;
}

/**
 * Delete compass results for a user
 */
export async function deleteUserCompassResults(userId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('compass_responses')
    .delete()
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete compass results: ${error.message}`);
  }
}

/**
 * Get a summary of saved results for banner display
 */
export interface CompassResultsSummary {
  savedAt: Date;
  matchCount: number;
  topMatch: string;
  hasResume: boolean;
}

export async function getCompassResultsSummary(userId: string): Promise<CompassResultsSummary | null> {
  const results = await getCompassResultsForUser(userId);

  if (!results || !results.recommendations || results.recommendations.length === 0) {
    return null;
  }

  return {
    savedAt: new Date(results.updated_at || results.created_at),
    matchCount: results.recommendations.length,
    topMatch: results.recommendations[0]?.title || 'Unknown',
    hasResume: !!results.resume_text || !!results.resume_id,
  };
}

/**
 * Format a relative time string for display
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
}
