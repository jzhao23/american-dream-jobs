/**
 * Browser-side Supabase Client
 *
 * This client is used for authentication operations in the browser.
 * It uses the public anon key (safe to expose to browser) and handles
 * session management automatically.
 *
 * For server-side operations (like database queries), use the server
 * client in src/lib/compass/supabase.ts which uses the service key.
 */

import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

// Singleton browser client
let browserClient: SupabaseClient | null = null;
let isSupabaseConfigured: boolean | null = null;

/**
 * Check if Supabase browser auth is configured
 * Returns true if the required environment variables are set
 */
export function isSupabaseAuthEnabled(): boolean {
  if (isSupabaseConfigured === null) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);
  }
  return isSupabaseConfigured;
}

/**
 * Get the browser-side Supabase client
 * Uses public anon key (safe for browser)
 * Returns null if Supabase environment variables are not configured
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (browserClient) {
    return browserClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Supabase auth is not configured - this is fine, auth features will be disabled
    return null;
  }

  browserClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  return browserClient;
}

// Re-export types for convenience
export type { User, Session, SupabaseClient };
