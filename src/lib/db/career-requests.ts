/**
 * Career Requests Database Operations
 *
 * Handles user requests for new careers to be added to the database
 */

import { getSupabaseClient } from '../compass/supabase';

// Types
export interface CareerRequest {
  id: string;
  career_title: string;
  reason: string | null;
  additional_info: string | null;
  requester_email: string | null;
  vote_count: number;
  status: 'pending' | 'in-progress' | 'completed' | 'declined';
  implemented_career_slug: string | null;
  ip_hash: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface CreateCareerRequestInput {
  careerTitle: string;
  reason?: string;
  additionalInfo?: string;
  email?: string;
  ipHash?: string;
}

export interface CreateCareerRequestResult {
  request: CareerRequest;
  isNew: boolean;
  voteCount: number;
}

/**
 * Create or vote for a career request
 */
export async function createOrVoteCareerRequest(
  input: CreateCareerRequestInput
): Promise<CreateCareerRequestResult> {
  const supabase = getSupabaseClient();
  const normalizedTitle = input.careerTitle.trim();

  // Try to find existing request with similar title
  const { data: existing } = await supabase
    .from('career_requests')
    .select('*')
    .ilike('career_title', normalizedTitle)
    .eq('status', 'pending')
    .is('deleted_at', null)
    .limit(1)
    .single();

  if (existing) {
    // Increment vote count
    const { data: updated, error: updateError } = await supabase
      .from('career_requests')
      .update({ vote_count: existing.vote_count + 1 })
      .eq('id', existing.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to increment vote: ${updateError.message}`);
    }

    return {
      request: updated as CareerRequest,
      isNew: false,
      voteCount: updated.vote_count
    };
  }

  // Create new request
  const { data: newRequest, error: createError } = await supabase
    .from('career_requests')
    .insert({
      career_title: normalizedTitle,
      reason: input.reason || null,
      additional_info: input.additionalInfo || null,
      requester_email: input.email?.toLowerCase().trim() || null,
      ip_hash: input.ipHash || null
    })
    .select()
    .single();

  if (createError) {
    throw new Error(`Failed to create career request: ${createError.message}`);
  }

  return {
    request: newRequest as CareerRequest,
    isNew: true,
    voteCount: 1
  };
}

/**
 * Get popular career requests
 */
export async function getPopularCareerRequests(
  limit: number = 20
): Promise<CareerRequest[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('career_requests')
    .select('*')
    .eq('status', 'pending')
    .is('deleted_at', null)
    .order('vote_count', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get popular requests: ${error.message}`);
  }

  return data as CareerRequest[];
}

/**
 * Get recent career requests
 */
export async function getRecentCareerRequests(
  limit: number = 20
): Promise<CareerRequest[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('career_requests')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get recent requests: ${error.message}`);
  }

  return data as CareerRequest[];
}

/**
 * Update career request status (for admin)
 */
export async function updateCareerRequestStatus(
  id: string,
  status: 'in-progress' | 'completed' | 'declined',
  implementedCareerSlug?: string
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('career_requests')
    .update({
      status,
      implemented_career_slug: implementedCareerSlug || null
    })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update request status: ${error.message}`);
  }
}

/**
 * Soft delete career request
 */
export async function deleteCareerRequest(id: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('career_requests')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete career request: ${error.message}`);
  }
}
