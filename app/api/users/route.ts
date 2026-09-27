import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

/** Surfaces Supabase's real reason instead of masking it with a generic message. */
function errorMessage(data: any, fallback: string): string {
  return data?.msg || data?.error_description || data?.message || fallback
}

export async function POST(request: NextRequest) {
  try {
    const unauthorized = await requireAuth(request)
    if (unauthorized) return unauthorized

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      console.error('Supabase service credentials are not configured')
      return NextResponse.json({ error: 'Serveren er ikke korrekt konfigureret' }, { status: 500 })
    }

    const { email, password, action, userId, newEmail, newPassword } = await request.json()

    const headers = {
      'Content-Type': 'application/json',
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    }

    if (action === 'create') {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, password, email_confirm: true }),
      })
      const data = await response.json()
      if (!response.ok) {
        return NextResponse.json({ error: errorMessage(data, 'Fejl ved oprettelse') }, { status: 400 })
      }
      return NextResponse.json({ success: true, user: data })
    }

    if (action === 'update') {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ email: newEmail }),
      })
      if (!response.ok) {
        const data = await response.json()
        return NextResponse.json({ error: errorMessage(data, 'Fejl ved opdatering') }, { status: 400 })
      }
      return NextResponse.json({ success: true })
    }

    if (action === 'updatePassword') {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ password: newPassword }),
      })
      if (!response.ok) {
        const data = await response.json()
        return NextResponse.json({ error: errorMessage(data, 'Fejl ved opdatering') }, { status: 400 })
      }
      return NextResponse.json({ success: true })
    }

    if (action === 'delete') {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
        method: 'DELETE',
        headers,
      })
      if (!response.ok) {
        const data = await response.json()
        return NextResponse.json({ error: errorMessage(data, 'Fejl ved sletning') }, { status: 400 })
      }
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Ukendt handling' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const unauthorized = await requireAuth(request)
    if (unauthorized) return unauthorized

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      console.error('Supabase service credentials are not configured')
      return NextResponse.json({ error: 'Serveren er ikke korrekt konfigureret' }, { status: 500 })
    }

    // The admin list endpoint defaults to 50 per page, which silently truncated
    // the admin's user list before.
    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page') || '1')
    const perPage = Number(searchParams.get('per_page') || '1000')

    const response = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
      {
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        },
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: errorMessage(data, 'Fejl ved hentning') }, { status: 400 })
    }

    return NextResponse.json({ users: data.users ?? [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
