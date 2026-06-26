import { createClient } from '@supabase/supabase-js'

// HARDCODED FOR TESTING - Next.js is failing to load your .env vars in the browser
const supabaseUrl = "https://ozvcectjbdadvznxspsm.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96dmNlY3RqYmRhZHZ6bnhzcHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1NzYxNTMsImV4cCI6MjA5MjE1MjE1M30.pdRFtEdDJS43CL63XDIAF9MgCCL4l1U9xmx94CUJXIo"

console.log("[Supabase] Initializing with HARDCODED Key...");

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
