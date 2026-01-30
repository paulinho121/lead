import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase environment variables are missing! Persistent storage will be disabled.");
}

export const supabase = (supabaseUrl.startsWith('http'))
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
