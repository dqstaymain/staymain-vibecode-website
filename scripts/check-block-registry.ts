/**
 * Fails if the block registry and the public renderer can disagree.
 *
 * The blocks used to be described twice: once in a switch in BlockRenderer and
 * once in a hand-written editor, with no link between them. The result was a
 * `cta` whose editor offered a button the renderer never drew, renderers reading
 * `imageAlt` and `button2Text` with no input for them, a `gallery` that ignored
 * its own image, and a `contact` block that rendered nothing at all.
 *
 * This checks the two lists are the same list. It cannot check that a renderer
 * actually uses every field - only a person reading the components knows that -
 * but it does catch a block being added, renamed or removed on one side only.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { BLOCK_DEFINITIONS, ADDABLE_BLOCK_TYPES } from '../lib/blocks'

const failures: string[] = []
const ok = (label: string) => console.log(`ok   ${label}`)
const fail = (label: string) => {
  failures.push(label)
  console.log(`FAIL ${label}`)
}

// 1. The registry covers every type the CMS type allows.
//
// Parsed with the TypeScript compiler rather than a regex: a regex over a union
// like `'a' | 'b' | 'c'` picks up the letters of the separators, which is
// exactly the kind of check that reports a nonsense failure and gets ignored.
import ts from 'typescript'

const cmsPath = join(process.cwd(), 'lib', 'cms.tsx')
const cmsSource = readFileSync(cmsPath, 'utf8')
const sf = ts.createSourceFile(cmsPath, cmsSource, ts.ScriptTarget.Latest, true)

let unionMembers: string[] = []
const visit = (node: ts.Node) => {
  if (
    ts.isInterfaceDeclaration(node) &&
    node.name.text === 'CMSBlock' &&
    node.members.some(
      m => ts.isPropertySignature(m) && m.name.getText() === 'type'
    )
  ) {
    const prop = node.members.find(
      m => ts.isPropertySignature(m) && m.name.getText() === 'type'
    ) as ts.PropertySignature
    if (prop.type) {
      // Walk down to the literals inside the union, so the members of a union
      // are read from the syntax tree rather than inferred from punctuation.
      const collect = (t: ts.TypeNode) => {
        if (ts.isLiteralTypeNode(t) && ts.isStringLiteral(t.literal)) {
          unionMembers.push(t.literal.text)
        } else if (ts.isUnionTypeNode(t)) {
          t.types.forEach(collect)
        }
      }
      collect(prop.type)
    }
  }
  ts.forEachChild(node, visit)
}
visit(sf)

if (!unionMembers.length) {
  fail('could not read the CMSBlock type union from lib/cms.tsx')
} else {
  const declared = new Set(BLOCK_DEFINITIONS.map(d => d.type))
  const missing = unionMembers.filter(t => !declared.has(t as never))
  if (missing.length) {
    fail(`block types with no definition: ${missing.join(', ')}`)
  } else {
    ok(`every CMSBlock type has a definition (${unionMembers.length} types)`)
  }
}

// 2. The renderer's switch handles every defined type.
const renderer = readFileSync(join(process.cwd(), 'components', 'BlockRenderer.tsx'), 'utf8')
const switchBody = renderer.match(/switch\s*\(block\.type\)\s*\{([\s\S]*?)\n  \}/)
if (!switchBody) {
  fail('could not find the block switch in components/BlockRenderer.tsx')
} else {
  const handled = new Set([...switchBody[1].matchAll(/case\s+'([^']+)'/g)].map(m => m[1]))
  const defined = BLOCK_DEFINITIONS.map(d => d.type)
  const unrendered = defined.filter(t => !handled.has(t))
  if (unrendered.length) {
    fail(`blocks with no renderer: ${unrendered.join(', ')}`)
  } else {
    ok(`every defined block has a renderer (${defined.length} blocks)`)
  }
}

// 3. The picker offers every block except the hero.
const hero = BLOCK_DEFINITIONS.find(d => d.type === 'hero')
if (!hero) {
  fail('the registry has no hero, but every page depends on one')
} else if (ADDABLE_BLOCK_TYPES.some(d => d.type === 'hero')) {
  fail('the hero is offered in the add-section picker, so a page could get a second one')
} else {
  ok(`hero is pinned and excluded from the picker (${ADDABLE_BLOCK_TYPES.length} addable)`)
}

// 4. Defaults are produced by a call, so two blocks never share one object.
for (const def of BLOCK_DEFINITIONS) {
  if (typeof def.defaultContent !== 'function') {
    fail(`${def.type}.defaultContent is not a function, so blocks would share state`)
    continue
  }
  const a = def.defaultContent()
  const b = def.defaultContent()
  // Equal content is expected. Shared identity is not: two blocks seeded from
  // the same object would edit each other.
  if (a === b) {
    fail(`${def.type}.defaultContent returns the same object on every call`)
  }
  if ('id' in a) {
    fail(`${def.type} default content must not set a block id`)
  }
}
ok('every default content is produced by a call, not a shared object')

// 5. Repeater fields declare what a row needs.
for (const def of BLOCK_DEFINITIONS) {
  for (const field of def.fields) {
    if (field.kind !== 'repeater') continue
    if (!field.itemFields?.length) {
      fail(`${def.type}.${field.key} is a repeater with no item fields`)
    }
    if (!field.itemDefaults) {
      fail(`${def.type}.${field.key} is a repeater with no item defaults`)
    }
  }
}
ok('every repeater declares its item fields and defaults')

if (failures.length) {
  console.log(`\n${failures.length} problem(s)`)
  process.exit(1)
}
console.log('ALL PASS')
