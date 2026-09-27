import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Verifies the caller's Supabase session token.
 *
 * The /api routes act with the service-role key, which bypasses row level
 * security, so every one of them has to prove the caller is signed in before
 * touching anything privileged.
 */
export async function getAuthenticatedUser(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()

  if (!url || !anonKey || !token) return null

  const client = createClient(url, anonKey, { auth: { persistSession: false } })
  const { data, error } = await client.auth.getUser(token)
  if (error || !data.user) return null

  return data.user
}

/** Returns a 401 response when the request is not authenticated. */
export async function requireAuth(request: NextRequest): Promise<NextResponse | null> {
  const user = await getAuthenticatedUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Du skal være logget ind' }, { status: 401 })
  }
  return null
}
