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
let supabaseAvailable: boolean | null = null;

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  if (supabaseAvailable !== null) {
    return supabaseAvailable;
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  supabaseAvailable = !!(supabaseUrl && supabaseAnonKey);
  return supabaseAvailable;
}

/**
 * Get the browser-side Supabase client
 * Uses public anon key (safe for browser)
 * Returns null if Supabase is not configured
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (browserClient) {
    return browserClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
export type { User, Session };
