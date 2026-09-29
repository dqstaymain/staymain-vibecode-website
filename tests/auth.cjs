/**
 * Loads ADMIN_EMAIL / ADMIN_PASSWORD from .env.local so the signed-in suite can
 * run without the values being committed or passed on the command line.
 *
 * Returns null when they are absent, which is how the tests decide to skip
 * rather than fail.
 */
const fs = require('fs')
const path = require('path')

function loadEnvCredentials() {
  const file = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(file)) return null

  const values = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!m) continue
    values[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }

  const email = values.ADMIN_EMAIL
  const password = values.ADMIN_PASSWORD
  if (!email || !password) return null
  return { email, password }
}

module.exports = { loadEnvCredentials }
