/**
 * Checks that nothing in the CMS writes to the database behind the save button.
 *
 * The admin used to save on every change, in two places at once: six effects
 * that persisted whatever state changed, and a save call inside each of the
 * mutations. Every edit reached Supabase twice, before anybody decided to save
 * it - so an accidental change, a mis-dragged row or a mis-typed field was live
 * on the site the moment it happened.
 *
 * Both are gone. Now exactly one function writes, and it is the one the button
 * calls. That is a property worth asserting rather than hoping for: it is
 * invisible in review, invisible in a build, and the kind of thing that creeps
 * back one `saveCMSPages(newPages)` at a time.
 *
 * So the rule is simply that lib/cms.tsx calls no `saveCMS*` or `deleteCMS*`
 * outside `save()`. Users are exempt for a real reason - they go through
 * /api/users and a save button cannot un-create an account - and media has never
 * been in this file.
 */
import { readFileSync } from 'fs'
import { join } from 'path'

const ROOT = process.cwd()
const FILE = 'lib/cms.tsx'

let failures = 0

const src = readFileSync(join(ROOT, FILE), 'utf8')
const lines = src.split('\n')

/** The name of the function that is allowed to write. */
const COMMIT = 'const save = async'

const commitStart = lines.findIndex(l => l.includes(COMMIT))
if (commitStart === -1) {
  console.log(`FAIL ${FILE}: no commit function found.`)
  console.log('  This check looks for `const save = async`. If it was renamed, update')
  console.log('  the reason here rather than deleting the check.')
  failures++
} else {
  console.log(`ok   ${FILE}: commit function found at line ${commitStart + 1}`)
}

/**
 * Where the commit function ends: the first line at or after it that closes at
 * the same brace depth it opened at. Crude, but it only has to be right about
 * this one file, and a wrong answer here shows up as a failure rather than as a
 * silent pass.
 */
function commitRange(): [number, number] {
  let depth = 0
  let started = false
  for (let i = commitStart; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === '{') {
        depth++
        started = true
      } else if (ch === '}') {
        depth--
        if (started && depth === 0) return [commitStart, i]
      }
    }
  }
  return [commitStart, lines.length - 1]
}

const [from, to] = commitRange()

lines.forEach((line, i) => {
  if (!/\b(?:saveCMS|deleteCMS)\w*\(/.test(line)) return
  // A comment naming the helpers is not a call.
  const trimmed = line.trim()
  if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return

  if (i >= from && i <= to) return

  failures++
  console.log(
    `FAIL ${FILE}:${i + 1}\n` +
      `  ${trimmed}\n` +
      `  Writes have to go through save(), which the Gem ændringer button calls.\n` +
      `  A write here reaches the site without anybody saving it.`
  )
})

if (!failures) {
  console.log(`ok   every write is inside save() (lines ${from + 1}-${to + 1})`)
}

// The blanketing effects are the other half of the old behaviour, and they come
// back as a single line rather than as a named save.
const autoSaves = lines.filter(
  l => /\b(?:saveCMS|deleteCMS)\w*\(/.test(l) && !l.includes('const save')
).length
const effectBound = /useEffect\([\s\S]{0,400}?\bsaveCMS\w*\(/.test(src)
if (effectBound) {
  failures++
  console.log(
    `FAIL ${FILE}: a useEffect still calls a save helper.\n` +
      `  That is the auto-save this check exists to prevent: it writes whatever\n` +
      `  state changed, with nobody having pressed anything.`
  )
} else {
  console.log(`ok   no effect saves on a state change`)
}
void autoSaves

console.log(`\n${failures === 0 ? 'ALL PASS' : failures + ' FAILURE(S)'}`)
process.exit(failures === 0 ? 0 : 1)
