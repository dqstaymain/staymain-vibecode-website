/**
 * Structural checks on the admin's input styles.
 *
 * `.admin-input` sets its own padding in admin.css, and admin.css is loaded
 * after the Tailwind output - the admin layout only adds it once that route
 * hydrates. A padding utility on an input therefore has the same specificity as
 * the base class and loses on order, and it loses silently: the class is in the
 * markup, the stylesheet has the rule, tsc is happy, the build is happy, and the
 * browser quietly renders the default padding anyway.
 *
 * That is not hypothetical. `pl-8` on the page library's search field was
 * overridden by the base class, so the text started at 11px underneath an icon
 * spanning 10-25px. And `pr-8` on the shared Select had been overridden too,
 * which is why that control had no dropdown indicator at all.
 *
 * Only asymmetric padding is rejected. `pl-` and `pr-` exist on an input to make
 * room for something adjacent - an icon, a badge - and losing them puts one on
 * top of the other. `px-` and `py-` are just size tweaks, the default is close to
 * what they ask for, and losing one degrades to something that still looks fine.
 * Several dozen call sites pass those; refusing the build over them would be
 * noise, so they are left alone and only the collisions are caught here.
 */
import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'

const ROOT = process.cwd()
const DIR = join(ROOT, 'app', 'admin')

function walk(dir: string, out: string[] = []): string[] {
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const e of entries) {
    if (e === 'node_modules' || e.startsWith('.')) continue
    const full = join(dir, e)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.tsx?$/.test(e)) out.push(full)
  }
  return out
}

/** Padding utilities that clear room for something beside the text. */
const ASYMMETRIC = /\b(?:pl|pr)-\d/

/** The primitives that put `.admin-input` on the element. */
const PRIMITIVES = ['Input', 'Textarea', 'Select']

let failures = 0
let scanned = 0

for (const file of walk(DIR)) {
  const src = readFileSync(file, 'utf8')
  const rel = file.replace(ROOT + '\\', '')

  const report = (index: number, line: string) => {
    const lineNumber = src.slice(0, index).split('\n').length
    failures++
    console.log(
      `FAIL ${rel}:${lineNumber}\n` +
        `  ${line.trim().slice(0, 160)}\n` +
        `  .admin-input sets its own padding and is loaded after the Tailwind\n` +
        `  output, so this utility loses. Use data-leading-icon or\n` +
        `  data-trailing-icon, or a rule in admin.css that outranks the base class.`
    )
  }

  /**
   * The class lists to test, taken from className attributes only.
   *
   * Testing the whole props block flags the explanatory comment sitting next to
   * the fixed attribute - "Not `pl-8`: the base class wins that" - as if the
   * utility were still in use, which is how the first working version of this
   * check reported three failures against code that was already correct.
   */
  const classLists = (props: string): string[] => {
    const out: string[] = []
    const attr = /className\s*=\s*(?:"([^"]*)"|\{`([^`]*)`\})/g
    for (const m of props.matchAll(attr)) out.push(m[1] ?? m[2] ?? '')
    return out
  }

  const violates = (props: string) =>
    classLists(props).some(list => ASYMMETRIC.test(list))

  // The class is applied by the primitive, so the utility is somewhere in the
  // element's props - which run over several lines and do not contain the string
  // "admin-input" at all. Scanning line by line finds nothing and always passes,
  // which is how the first version of this check reported success on the exact
  // bug it was written for.
  const selfClosing = /<(Input|Textarea)\b([\s\S]*?)\/>/g
  for (const m of src.matchAll(selfClosing)) {
    scanned++
    if (violates(m[2])) report(m.index ?? 0, m[0])
  }

  // A select is written with an opening tag and children, so its props end at
  // the first ">". That is also the ">" of an arrow function in a handler, which
  // truncates the scan: a violation placed after one is missed. Cheap to accept
  // for a check whose failure mode is a lint, not a build break.
  const openTag = /<Select\b([\s\S]*?)>/g
  for (const m of src.matchAll(openTag)) {
    scanned++
    if (violates(m[1])) report(m.index ?? 0, m[0])
  }

  // And the base class written out by hand. Comments are stripped first, so the
  // note explaining the rule cannot trip the rule.
  const withoutComments = src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1')

  withoutComments.split('\n').forEach(line => {
    if (!line.includes('admin-input')) return
    if (!ASYMMETRIC.test(line)) return
    report(withoutComments.indexOf(line), line)
  })
}

console.log(`ok   scanned ${scanned} input element(s) across app/admin`)

// The base class has to keep owning padding, or the whole premise changes.
const css = readFileSync(join(DIR, 'admin.css'), 'utf8')
if (!/\.admin-input\s*\{[^}]*padding:/.test(css)) {
  failures++
  console.log(
    'FAIL app/admin/admin.css: .admin-input no longer sets its own padding.\n' +
      '  This check exists because it does. If it was moved elsewhere, update the\n' +
      '  reason here rather than deleting the check.'
  )
} else {
  console.log('ok   app/admin/admin.css: .admin-input owns its padding, as this check assumes')
}

if (!failures) console.log('ok   no input carries a padding utility the base class will override')

console.log(`\n${failures === 0 ? 'ALL PASS' : failures + ' FAILURE(S)'}`)
process.exit(failures === 0 ? 0 : 1)
