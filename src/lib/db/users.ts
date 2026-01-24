/**
 * User Database Operations
 *
 * Handles user profile management for the Find Jobs feature
 */

import { getSupabaseClient } from '../compass/supabase';

// Types
export interface UserProfile {
  id: string;
  auth_id: string | null;
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
 * Uses direct database operations for compatibility before migration is applied
 */
export async function getOrCreateUser(input: CreateUserInput): Promise<GetOrCreateUserResult> {
  const supabase = getSupabaseClient();
  const normalizedEmail = input.email.toLowerCase().trim();

  // First, try to find existing user
  const { data: existingUser, error: fetchError } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('email', normalizedEmail)
    .is('deleted_at', null)
    .single();

  // If user exists, check for resume and return
  if (existingUser) {
    // Check for active resume
    const { data: resume } = await supabase
      .from('user_resumes')
      .select('id')
      .eq('user_id', existingUser.id)
      .eq('is_active', true)
      .limit(1)
      .single();

    return {
      userId: existingUser.id,
      isNew: false,
      hasResume: !!resume
    };
  }

  // User not found (PGRST116 is "not found" error) - try to create
  if (fetchError && fetchError.code === 'PGRST116') {
    const { data: newUser, error: createError } = await supabase
      .from('user_profiles')
      .insert({
        email: normalizedEmail,
        location_code: input.locationCode || null,
        location_name: input.locationName || null,
        tc_version: input.tcVersion || '1.0',
        tc_accepted_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (createError) {
      // Could be a race condition - another request created the user
      // Try to fetch again
      if (createError.code === '23505') { // Unique violation
        const { data: retryUser, error: retryError } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('email', normalizedEmail)
          .is('deleted_at', null)
          .single();

        if (retryUser && !retryError) {
          return {
            userId: retryUser.id,
            isNew: false,
            hasResume: false
          };
        }
      }
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    return {
      userId: newUser.id,
      isNew: true,
      hasResume: false
    };
  }

  // Some other error occurred
  throw new Error(`Failed to get or create user: ${fetchError?.message || 'Unknown error'}`);
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

/**
 * Get or create user profile from Supabase Auth
 *
 * Called after successful authentication to ensure user has a profile
 * in our user_profiles table linked to their auth account.
 */
export interface GetOrCreateUserFromAuthResult {
  userId: string;
  isNew: boolean;
  hasResume: boolean;
}

export async function getOrCreateUserFromAuth(
  authId: string,
  email: string,
  locationCode?: string,
  locationName?: string
): Promise<GetOrCreateUserFromAuthResult> {
  const supabase = getSupabaseClient();

  // Use the database function
  const { data, error } = await supabase.rpc('get_or_create_user_from_auth', {
    p_auth_id: authId,
    p_email: email,
    p_location_code: locationCode || null,
    p_location_name: locationName || null
  });

  if (error) {
    throw new Error(`Failed to get or create user from auth: ${error.message}`);
  }

  const result = data?.[0] || data;

  return {
    userId: result?.user_id,
    isNew: result?.is_new || false,
    hasResume: result?.has_resume || false
  };
}

/**
 * Get user profile by Supabase Auth ID
 */
export async function getUserByAuthId(authId: string): Promise<UserProfile | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('auth_id', authId)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to get user by auth ID: ${error.message}`);
  }

  return data as UserProfile;
}

/**
 * Link anonymous session data to authenticated user
 *
 * Called when a user who has anonymous data signs up/in.
 * Links compass_responses from the session to the user's profile.
 */
export async function linkAnonymousDataToUser(
  authUserId: string,
  sessionId: string
): Promise<number> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc('link_anonymous_data_to_user', {
    p_auth_user_id: authUserId,
    p_session_id: sessionId
  });

  if (error) {
    console.warn(`Failed to link anonymous data: ${error.message}`);
    return 0;
  }

  return data || 0;
}
