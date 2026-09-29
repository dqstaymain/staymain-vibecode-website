/**
 * Fails if anyone posts to /api/media outside `uploadMediaFile`.
 *
 * The upload bug this guards against was not a mistake in one place, it was six
 * copies of the same handler that drifted apart. Two of them dropped the
 * Authorization header, so the API answered 401, and because the handler read
 * `data.file` off the response without checking `res.ok`, a rejection was
 * indistinguishable from a success - the file was chosen, nothing appeared, and
 * nothing was reported.
 *
 * A reviewer reading a new inline `fetch('/api/media')` cannot see that. This
 * check makes the single implementation the only legal way to upload, so the
 * next copy cannot quietly arrive without the header or the error handling.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = join(process.cwd(), 'app')
const HELPER = 'lib/supabase.ts'
const failures: string[] = []
let checked = 0

function walk(dir: string) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      walk(full)
      continue
    }
    if (!/\.(ts|tsx)$/.test(entry)) continue

    const rel = relative(process.cwd(), full).replace(/\\/g, '/')
    const source = readFileSync(full, 'utf8')
    const lines = source.split('\n')

    lines.forEach((line, i) => {
      if (!line.includes('/api/media')) return
      checked++

      // The helper itself is the one place allowed to build the request.
      if (rel === HELPER) return

      // A GET (listing) or a DELETE is a different call and carries its own
      // header inline; only a POST is the upload path that must be shared.
      const window = lines.slice(i, i + 8).join('\n')
      const isUpload = /method:\s*['"]POST['"]/.test(window)
      if (!isUpload) return

      failures.push(
        `${rel}:${i + 1} posts to /api/media directly. ` +
          'Use uploadMediaFile() from lib/supabase.ts instead.'
      )
    })
  }
}

walk(ROOT)

if (failures.length) {
  console.log('FAIL no inline media uploads may bypass uploadMediaFile\n')
  for (const f of failures) console.log(`  x ${f}`)
  console.log(`\n${failures.length} problem(s)`)
  process.exit(1)
}

console.log(`ok ${checked} /api/media call site(s) reviewed`)
console.log('ok every upload goes through uploadMediaFile()')
console.log('ALL PASS')
