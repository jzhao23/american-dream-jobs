/**
 * User Database Operations
 *
 * Handles user profile management for the Find Jobs feature
 */

import { getSupabaseClient } from '../compass/supabase';

// Types
export interface UserProfile {
  id: string;
  email: string;
  email_verified: boolean;
  location_code: string | null;
  location_name: string | null;
  tc_accepted_at: string;
  tc_version: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateUserInput {
  email: string;
  locationCode?: string;
  locationName?: string;
  tcVersion?: string;
}

export interface GetOrCreateUserResult {
  userId: string;
  isNew: boolean;
  hasResume: boolean;
}

/**
 * Get or create a user by email
 *
 * Uses the database function for atomic operation
 */
export async function getOrCreateUser(input: CreateUserInput): Promise<GetOrCreateUserResult> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc('get_or_create_user', {
    p_email: input.email.toLowerCase().trim(),
    p_location_code: input.locationCode || null,
    p_location_name: input.locationName || null,
    p_tc_version: input.tcVersion || '1.0'
  });

  if (error) {
    throw new Error(`Failed to get or create user: ${error.message}`);
  }

  // RPC returns an array with one row
  const result = Array.isArray(data) ? data[0] : data;

  return {
    userId: result.user_id,
    isNew: result.is_new,
    hasResume: result.has_resume
  };
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<UserProfile | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to get user: ${error.message}`);
  }

  return data as UserProfile;
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<UserProfile | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to get user: ${error.message}`);
  }

  return data as UserProfile;
}

/**
 * Check if a user exists by email
 */
export async function checkUserExists(email: string): Promise<{
  exists: boolean;
  hasResume: boolean;
  userId?: string;
}> {
  const supabase = getSupabaseClient();

  // Get user
  const { data: user, error: userError } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .is('deleted_at', null)
    .single();

  if (userError) {
    if (userError.code === 'PGRST116') {
      return { exists: false, hasResume: false };
    }
    throw new Error(`Failed to check user: ${userError.message}`);
  }

  // Check for resume
  const { data: resume } = await supabase
    .from('user_resumes')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .single();

  return {
    exists: true,
    hasResume: !!resume,
    userId: user.id
  };
}

/**
 * Update user location
 */
export async function updateUserLocation(
  userId: string,
  locationCode: string,
  locationName: string
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('user_profiles')
    .update({
      location_code: locationCode,
      location_name: locationName,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to update user location: ${error.message}`);
  }
}

/**
 * Soft delete a user (GDPR compliance)
 */
export async function deleteUser(userId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('user_profiles')
    .update({
      deleted_at: new Date().toISOString(),
      email: `deleted_${userId}@deleted.local`, // Anonymize email
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }
}
