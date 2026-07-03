import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client — null when env vars are missing so the app runs on mock
 * data with zero setup. Copy .env.example → .env to go live.
 */
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;
