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

/**
 * Get the browser-side Supabase client
 * Uses public anon key (safe for browser)
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase browser environment variables. ' +
      'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
    );
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
export type { User, Session };
