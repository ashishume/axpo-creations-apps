import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create Supabase client
let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
} else {
  console.warn(
    'Supabase URL or Anon Key not configured. The app will use local storage as fallback.',
    '\nSet VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
  );
}

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  return !!supabase;
}

/**
 * Get the Supabase client instance
 * Throws error if not configured
 */
export function getSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please set environment variables.');
  }
  return supabase;
}

/**
 * Get the Supabase client instance or null if not configured
 */
export function getSupabaseOrNull(): SupabaseClient | null {
  return supabase;
}

export { supabase };
export type { SupabaseClient };
