import { createClient } from "@supabase/supabase-js";

// Vite exposes env vars prefixed with VITE_ via import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials not found. Using localStorage fallback.");
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");

// Helper to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  console.log("supabaseUrl", supabaseUrl);
  console.log("supabaseAnonKey", supabaseAnonKey);
  return Boolean(supabaseUrl && supabaseAnonKey);
}
