/**
 * Career Contributions Database Operations
 *
 * Handles user-submitted corrections, experiences, and video links for careers
 */

import { getSupabaseClient } from '../compass/supabase';

// Types
export interface CareerContribution {
  id: string;
  career_slug: string | null;
  submission_type: 'correction' | 'experience' | 'video';
  content: string;
  contributor_name: string | null;
  contributor_email: string | null;
  link: string | null;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  reviewed_at: string | null;
  reviewer_notes: string | null;
  ip_hash: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface CreateContributionInput {
  careerSlug?: string;
  submissionType: 'correction' | 'experience' | 'video';
  content: string;
  name?: string;
  email?: string;
  link?: string;
  ipHash?: string;
}

/**
 * Create a new contribution
 */
export async function createContribution(
  input: CreateContributionInput
): Promise<CareerContribution> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('career_contributions')
    .insert({
      career_slug: input.careerSlug || null,
      submission_type: input.submissionType,
      content: input.content,
      contributor_name: input.name || null,
      contributor_email: input.email?.toLowerCase().trim() || null,
      link: input.link || null,
      ip_hash: input.ipHash || null
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create contribution: ${error.message}`);
  }

  return data as CareerContribution;
}

/**
 * Get contributions by career slug
 */
export async function getContributionsByCareer(
  careerSlug: string,
  status?: 'pending' | 'reviewed' | 'approved' | 'rejected'
): Promise<CareerContribution[]> {
  const supabase = getSupabaseClient();

  let query = supabase
    .from('career_contributions')
    .select('*')
    .eq('career_slug', careerSlug)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get contributions: ${error.message}`);
  }

  return data as CareerContribution[];
}

/**
 * Get pending contributions for review
 */
export async function getPendingContributions(
  limit: number = 50
): Promise<CareerContribution[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('career_contributions')
    .select('*')
    .eq('status', 'pending')
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get pending contributions: ${error.message}`);
  }

  return data as CareerContribution[];
}

/**
 * Update contribution status (for admin review)
 */
export async function updateContributionStatus(
  id: string,
  status: 'reviewed' | 'approved' | 'rejected',
  reviewerNotes?: string
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('career_contributions')
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewer_notes: reviewerNotes || null
    })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update contribution status: ${error.message}`);
  }
}

/**
 * Soft delete contribution
 */
export async function deleteContribution(id: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('career_contributions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete contribution: ${error.message}`);
  }
}
