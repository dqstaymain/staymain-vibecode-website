/**
 * Exercises POST /api/media with a real signed-in session, the way the admin
 * does. Prints the status and body so a failure is legible rather than silent.
 */
const fs = require('fs')
const path = require('path')

const env = {}
for (const line of fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const BASE = 'http://localhost:3000'
const supabase = env.NEXT_PUBLIC_SUPABASE_URL
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function main() {
  // 1. Real sign-in, to get a genuine access token.
  const auth = await fetch(`${supabase}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anon, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD }),
  })
  const authBody = await auth.json()
  const token = authBody?.access_token
  console.log('sign-in status:', auth.status, 'token:', token ? 'obtained' : 'MISSING')
  if (!token) {
    console.log('  body:', JSON.stringify(authBody).slice(0, 300))
    return
  }

  // 2. A 1x1 PNG, the smallest thing the route should accept.
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  )
  const form = new FormData()
  form.append('file', new Blob([png], { type: 'image/png' }), 'probe.png')

  const res = await fetch(`${BASE}/api/media`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  const text = await res.text()
  console.log('POST /api/media ->', res.status)
  console.log('  body:', text.slice(0, 400))

  // 3. And the listing, to see whether the file is actually there.
  const list = await fetch(`${BASE}/api/media`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const listBody = await list.json()
  console.log('GET /api/media ->', list.status, 'files:', (listBody.files || []).length)
}

main().catch(e => {
  console.error('probe failed:', e.message)
  process.exit(1)
})
