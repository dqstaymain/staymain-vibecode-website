/**
 * Checks that no hook is declared below an early return.
 *
 * A hook after an `if (...) return` makes the number of hooks depend on whether
 * that branch was taken, and React reports the difference as a change in the
 * order of hooks. It is the single most repeated mistake in the admin: two
 * anchors in app/admin/page.tsx exist purely to hold hooks above the auth gate,
 * and a third arrived anyway.
 *
 * The cost is high and the cause is invisible - the component still renders, and
 * the error only appears once someone happens to load it signed out and then
 * signed in - so it is asserted here instead of left to a comment.
 *
 * Indentation, not brace counting. This codebase is consistently indented by two
 * spaces, and a top-level hook is at exactly the body's indent while a hook
 * inside a callback is deeper. That makes the check a line comparison with no
 * parser to get wrong, and it cannot report a hook that is merely *near* a guard
 * rather than below one.
 */
import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'

const ROOT = process.cwd()
const DIRS = ['app', 'components', 'lib']

function walk(dir: string, out: string[] = []): string[] {
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const e of entries) {
    if (e === 'node_modules' || e === '.next' || e.startsWith('.')) continue
    const full = join(dir, e)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.tsx$/.test(e)) out.push(full)
  }
  return out
}

/**
 * A hook call anywhere on the line.
 *
 * Not anchored: `const [x, setX] = useState(false)` does not start with `use`,
 * and a check that only matches a bare `useState(...)` at column N passes while
 * the exact bug it was written for sits there - which is how the first version of
 * this check reported success on a misplaced hook.
 */
const HOOK = /(^|[^.\w])use[A-Z]\w*\(/
/** `if (...) {` at the start of a line, ignoring leading indentation. */
const IF = /^if\s*\(/

let failures = 0
let hooksChecked = 0

for (const file of DIRS.flatMap(d => walk(join(ROOT, d)))) {
  const src = readFileSync(file, 'utf8')
  const rel = file.replace(ROOT + '\\', '')
  const lines = src.split('\n')

  for (let i = 0; i < lines.length; i++) {
    // A function body is what we are checking; find its signature first.
    const sig = lines[i].match(/^(?:export\s+)?(?:default\s+)?function\s+(\w+)/)
    if (!sig) continue
    const name = sig[1]

    /**
     * Where the signature ends and the body begins.
     *
     * Cannot be "the next line": a signature with destructured props spans many
     * of them and closes with `}: {` at column 0, which looks exactly like the
     * end of the function to an indentation test. That made the first version of
     * this check give up on every multi-line component and pass on a misplaced
     * hook. So the brace and paren depth are tracked instead, and the body is the
     * brace that opens at zero depth.
     */
    let brace = 0
    let paren = 0
    let bodyStart = -1
    outer: for (let j = i; j < lines.length; j++) {
      for (const ch of lines[j]) {
        if (ch === '(') paren++
        else if (ch === ')') paren--
        else if (ch === '{') {
          if (brace === 0 && paren === 0 && j > i) {
            bodyStart = j
            break outer
          }
          brace++
        } else if (ch === '}') brace--
      }
    }
    if (bodyStart === -1) continue

    // Body indent: the indentation of the first non-blank line after it.
    let bodyIndent = -1
    for (let j = bodyStart + 1; j < lines.length; j++) {
      const line = lines[j]
      if (!line.trim()) continue
      const indent = line.length - line.trimStart().length
      if (indent === 0) break // closing brace of the function
      bodyIndent = indent
      break
    }
    if (bodyIndent < 0) continue

    // Find the first early-return guard at that exact indent.
    let guardAt = -1
    for (let j = bodyStart + 1; j < lines.length; j++) {
      const line = lines[j]
      const indent = line.length - line.trimStart().length
      if (indent === 0) break // end of function
      if (indent !== bodyIndent) continue
      if (IF.test(line.trim())) {
        // A guard returns almost immediately. Anything deeper still counts.
        const next = (lines[j + 1] || '').trim()
        if (next.startsWith('return')) {
          guardAt = j
          break
        }
      }
    }
    if (guardAt === -1) continue

    // Anything hook-shaped at body indent from here on is below the gate.
    for (let j = guardAt + 1; j < lines.length; j++) {
      const line = lines[j]
      const indent = line.length - line.trimStart().length
      if (indent === 0) break // end of function
      if (indent !== bodyIndent) continue
      const trimmed = line.trim()
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue
      if (!HOOK.test(trimmed)) continue

      hooksChecked++
      failures++
      console.log(
        `FAIL ${rel}:${j + 1}  ${name}()\n` +
          `  ${trimmed}\n` +
          `  Declared below the early return on line ${guardAt + 1}, so the number\n` +
          `  of hooks depends on which branch was taken. Move it above the return.`
      )
    }
  }
}

if (!failures) {
  console.log(`ok   no hook declared below an early return (${hooksChecked} misplaced)`)
}

console.log(`\n${failures === 0 ? 'ALL PASS' : failures + ' FAILURE(S)'}`)
process.exit(failures === 0 ? 0 : 1)
