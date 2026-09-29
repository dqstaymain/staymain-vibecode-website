/**
 * Prints the column names of a Supabase table. Reads credentials from
 * .env.local and never prints them.
 */
const fs = require('fs')

const env = {}
for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function columns(table) {
  const r = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  const j = await r.json()
  if (!Array.isArray(j) || !j[0]) return `${table}: ${JSON.stringify(j).slice(0, 200)}`
  return `${table}: ${Object.keys(j[0]).sort().join(', ')}`
}

async function ordered(table) {
  const r = await fetch(`${url}/rest/v1/${table}?select=*&order=position`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  const j = await r.json()
  return `${table} order=position -> ${r.status} ${r.status === 200 ? 'OK' : JSON.stringify(j).slice(0, 120)}`
}

;(async () => {
  for (const t of ['cms_navigation', 'cms_cases', 'cms_testimonials', 'cms_company_logos']) {
    console.log(await columns(t))
    console.log('  ' + (await ordered(t)))
  }
})()
