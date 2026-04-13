import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sacipjtmvvyazwxwvatm.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhY2lwanRtdnZ5YXp3eHd2YXRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5OTY0NDIsImV4cCI6MjA5MTU3MjQ0Mn0._IqB5I4yXHZ-ukcIJ9Vwqg25NMtzDg6l-is9H09t1SY'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhY2lwanRtdnZ5YXp3eHd2YXRtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTk5NjQ0MiwiZXhwIjoyMDkxNTcyNDQyfQ.O-zwTiNYhVXJ8tsSFjwSDRiwTSumRrclVTT4fZf5GFQ'

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })

export interface DBUser {
  id: string
  email: string
  password_hash: string
  created_at: string
}
