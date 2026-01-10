/**
 * Compass Responses Database Operations
 *
 * Handles saving Career Compass questionnaire responses
 */

import { getSupabaseClient } from '../compass/supabase';

// Types
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
  resume_id: string | null;
  recommendations: unknown | null;
  model_used: string | null;
  processing_time_ms: number | null;
  created_at: string;
}

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
  resumeId?: string;
  recommendations?: unknown;
  modelUsed?: string;
  processingTimeMs?: number;
}

/**
 * Save a compass response
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
      resume_id: input.resumeId || null,
      recommendations: input.recommendations || null,
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
