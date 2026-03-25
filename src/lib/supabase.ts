import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url === "your_supabase_project_url" || key === "your_supabase_anon_key") {
    return null;
  }
  if (!_client) {
    _client = createClient(url, key);
  }
  return _client;
}

// Convenience export — returns null when not configured
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase();
    if (!client) return () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } });
    return (client as Record<string | symbol, unknown>)[prop];
  },
});

// Database types
export interface DbUser {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  is_admin: boolean;
  created_at: string;
}

export interface DbVisit {
  id: string;
  session_id: string;
  user_id: string | null;
  page: string;
  referrer: string;
  user_agent: string;
  created_at: string;
}

export interface DbPageView {
  id: string;
  session_id: string;
  user_id: string | null;
  page: string;
  created_at: string;
}

export interface DbSignup {
  id: string;
  user_id: string;
  name: string;
  email: string;
  created_at: string;
}
