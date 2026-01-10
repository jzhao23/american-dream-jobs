/**
 * Email Subscription Database Operations
 *
 * Handles newsletter and update subscriptions from website forms
 */

import { getSupabaseClient } from '../compass/supabase';

// Types
export interface EmailSubscription {
  id: string;
  email: string;
  persona: 'student' | 'switcher' | 'practitioner' | 'educator' | null;
  source: string;
  verified: boolean;
  verified_at: string | null;
  unsubscribed_at: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface CreateSubscriptionInput {
  email: string;
  persona?: 'student' | 'switcher' | 'practitioner' | 'educator';
  source?: string;
}

export interface CreateSubscriptionResult {
  subscription: EmailSubscription;
  isNew: boolean;
}

/**
 * Create or reactivate an email subscription
 */
export async function createSubscription(
  input: CreateSubscriptionInput
): Promise<CreateSubscriptionResult> {
  const supabase = getSupabaseClient();
  const normalizedEmail = input.email.toLowerCase().trim();

  // Check for existing subscription
  const { data: existing, error: fetchError } = await supabase
    .from('email_subscriptions')
    .select('*')
    .eq('email', normalizedEmail)
    .is('deleted_at', null)
    .single();

  // If exists and not unsubscribed, return it
  if (existing && !existing.unsubscribed_at) {
    return {
      subscription: existing as EmailSubscription,
      isNew: false
    };
  }

  // If exists but unsubscribed, reactivate
  if (existing && existing.unsubscribed_at) {
    const { data: reactivated, error: updateError } = await supabase
      .from('email_subscriptions')
      .update({
        unsubscribed_at: null,
        persona: input.persona || existing.persona
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to reactivate subscription: ${updateError.message}`);
    }

    return {
      subscription: reactivated as EmailSubscription,
      isNew: false
    };
  }

  // Create new subscription
  const { data: newSub, error: createError } = await supabase
    .from('email_subscriptions')
    .insert({
      email: normalizedEmail,
      persona: input.persona || null,
      source: input.source || 'website'
    })
    .select()
    .single();

  if (createError) {
    // Handle unique constraint violation (race condition)
    if (createError.code === '23505') {
      const { data: retry } = await supabase
        .from('email_subscriptions')
        .select('*')
        .eq('email', normalizedEmail)
        .is('deleted_at', null)
        .single();

      if (retry) {
        return {
          subscription: retry as EmailSubscription,
          isNew: false
        };
      }
    }
    throw new Error(`Failed to create subscription: ${createError.message}`);
  }

  return {
    subscription: newSub as EmailSubscription,
    isNew: true
  };
}

/**
 * Get subscription by email
 */
export async function getSubscriptionByEmail(
  email: string
): Promise<EmailSubscription | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('email_subscriptions')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get subscription: ${error.message}`);
  }

  return data as EmailSubscription;
}

/**
 * Unsubscribe (soft)
 */
export async function unsubscribe(email: string): Promise<boolean> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('email_subscriptions')
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq('email', email.toLowerCase().trim())
    .is('deleted_at', null)
    .is('unsubscribed_at', null)
    .select();

  if (error) {
    throw new Error(`Failed to unsubscribe: ${error.message}`);
  }

  return (data?.length || 0) > 0;
}

/**
 * Delete subscription (GDPR hard delete)
 */
export async function deleteSubscription(email: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('email_subscriptions')
    .update({
      deleted_at: new Date().toISOString(),
      email: `deleted_${Date.now()}@deleted.local`
    })
    .eq('email', email.toLowerCase().trim())
    .is('deleted_at', null);

  if (error) {
    throw new Error(`Failed to delete subscription: ${error.message}`);
  }
}

/**
 * Get subscription statistics
 */
export async function getSubscriptionStats(): Promise<{
  total: number;
  byPersona: Record<string, number>;
  unsubscribed: number;
}> {
  const supabase = getSupabaseClient();

  const { count: total } = await supabase
    .from('email_subscriptions')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)
    .is('unsubscribed_at', null);

  const { count: unsubscribed } = await supabase
    .from('email_subscriptions')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)
    .not('unsubscribed_at', 'is', null);

  return {
    total: total || 0,
    byPersona: {},
    unsubscribed: unsubscribed || 0
  };
}
