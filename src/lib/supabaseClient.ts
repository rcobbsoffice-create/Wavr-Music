import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder'

console.log("[Supabase] Initializing with URL:", supabaseUrl);
if (supabaseAnonKey === 'placeholder') {
  console.warn("[Supabase] WARNING: Using placeholder key. Environment variables might not be loaded correctly.");
} else {
  console.log("[Supabase] Key detected starting with:", supabaseAnonKey.substring(0, 10));
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
