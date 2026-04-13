import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { email, password, action, userId } = await request.json()

    if (action === 'create') {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
          email,
          password,
          email_confirm: true
        })
      })

      const data = await response.json()

      if (!response.ok) {
        return NextResponse.json({ error: data.message || 'Fejl ved oprettelse' }, { status: 400 })
      }

      return NextResponse.json({ success: true, user: data })
    }

    if (action === 'update') {
      const { newEmail } = await request.json()
      const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ email: newEmail })
      })

      if (!response.ok) {
        const data = await response.json()
        return NextResponse.json({ error: data.message || 'Fejl ved opdatering' }, { status: 400 })
      }

      return NextResponse.json({ success: true })
    }

    if (action === 'updatePassword') {
      const { newPassword } = await request.json()
      const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ password: newPassword })
      })

      if (!response.ok) {
        const data = await response.json()
        return NextResponse.json({ error: data.message || 'Fejl ved opdatering' }, { status: 400 })
      }

      return NextResponse.json({ success: true })
    }

    if (action === 'delete') {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
        }
      })

      if (!response.ok) {
        const data = await response.json()
        return NextResponse.json({ error: data.message || 'Fejl ved sletning' }, { status: 400 })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Ukendt handling' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      }
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: data.message || 'Fejl ved hentning' }, { status: 400 })
    }

    return NextResponse.json({ users: data.users })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
