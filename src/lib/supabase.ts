import { createClient, SupabaseClient } from "@supabase/supabase-js";

export function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseAdminClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;

  return createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

