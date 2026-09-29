/**
 * Structural checks on the drag wiring.
 *
 * A useSortable whose setNodeRef is never attached to a DOM node still renders a
 * handle with working listeners, so it looks draggable and silently does nothing:
 * the row is never registered as a droppable. That failure is invisible to tsc,
 * to the build, and to a route sweep - it only shows up when someone tries to
 * drag. So it is asserted here instead.
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

let failures = 0
const files = DIRS.flatMap(d => walk(join(ROOT, d)))

for (const file of files) {
  const src = readFileSync(file, 'utf8')
  const rel = file.replace(ROOT + '\\', '')

  // Every useSortable destructure that pulls setNodeRef must use it in JSX.
  const hooks = [...src.matchAll(/=\s*useSortable\(/g)].length
  if (hooks === 0) continue
  const destructure = [...src.matchAll(/const\s*\{([^}]*)\}\s*=\s*useSortable\(/g)]
  const claimsNode = destructure.some(m => /setNodeRef/.test(m[1]))
  const attachesNode = /ref=\{setNodeRef\}/.test(src)

  if (claimsNode && !attachesNode) {
    failures++
    console.log(`FAIL ${rel}: useSortable takes setNodeRef but no ref={setNodeRef} anywhere`)
  } else if (claimsNode) {
    console.log(`ok   ${rel}: ${hooks} sortable hook(s), node ref attached`)
  } else {
    failures++
    console.log(`FAIL ${rel}: useSortable without setNodeRef (row will not be a droppable)`)
  }

  // A useDraggable activator needs its node ref too, or it cannot be measured.
  for (const m of src.matchAll(/const\s*\{([^}]*)\}\s*=\s*useDraggable\(/g)) {
    if (!/setNodeRef/.test(m[1])) {
      failures++
      console.log(`FAIL ${rel}: useDraggable without setNodeRef`)
    }
  }
}

// Every handle must actually spread its listeners, or the drag never starts.
for (const file of files) {
  const src = readFileSync(file, 'utf8')
  const rel = file.replace(ROOT + '\\', '')
  const grab = [...src.matchAll(/<DragHandle\b([\s\S]{0,400}?)\/>/g)]
  for (const m of grab) {
    if (!/\{listeners\}/.test(m[1])) {
      failures++
      console.log(`FAIL ${rel}: <DragHandle> does not spread {listeners}`)
    }
  }
  if (grab.length) console.log(`ok   ${rel}: ${grab.length} DragHandle(s) spread listeners`)
}

console.log(`\n${failures === 0 ? 'ALL PASS' : failures + ' FAILURE(S)'}`)
process.exit(failures === 0 ? 0 : 1)
