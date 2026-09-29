/**
 * Checks the flat-list menu model: a drag must never produce a detached branch,
 * a lost item, or a structure that does not round-trip.
 */
import { flattenNav, rebuildNavTree, resolveNavDrop } from '../lib/nav-tree'
import type { NavItem } from '../lib/cms'

let failures = 0
function ok(name: string) {
  console.log(`ok   ${name}`)
}
function check(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  if (a !== e) {
    failures++
    console.log(`FAIL ${name}\n  expected ${e}\n  actual   ${a}`)
  } else {
    console.log(`ok   ${name}`)
  }
}
function invariant(name: string, cond: boolean) {
  if (cond) console.log(`ok   ${name}`)
  else {
    failures++
    console.log(`FAIL ${name}`)
  }
}

const link = (id: string, children?: NavItem[]): NavItem => ({
  id, label: id, type: children ? 'dropdown' : 'link',
  href: `/${id}`, children: children || undefined,
})

// A drag is a pair of (fromIndex, insertAt, depthDelta). Every combination on
// every starting tree has to leave a valid tree behind.
const trees = [
  [link('a'), link('b'), link('c')],
  [link('a', [link('a1'), link('a2')]), link('b')],
  [link('a', [link('a1', [link('a1x')]), link('a2')]), link('b', [link('b1')]), link('c')],
]

for (const [ti, tree] of trees.entries()) {
  const flat = flattenNav(tree)
  const ids = flat.map(r => r.item.id)
  const depthOf = new Map(flat.map(r => [r.item.id, r.depth]))

  for (let from = 0; from < flat.length; from++) {
    for (let insertAt = 0; insertAt <= flat.length; insertAt++) {
      {
        const label = `tree${ti} from=${from} at=${insertAt}`
        const res = resolveNavDrop({ flat, fromIndex: from, insertAt })

        // Null is a legitimate refusal: a drop inside the branch being moved, or
        // into a gap that would orphan the rows below it. Both are checked
        // against the finished list rather than predicted from the indices.
        if (!res) {
          const prefix = `${flat[from].path}.`
          let end = from + 1
          while (end < flat.length && flat[end].path.startsWith(prefix)) end++
          if (insertAt > from && insertAt < end) {
            ok(`${label}: refused drop inside own branch`)
            continue
          }
          // Rebuild by hand to see whether the gap would orphan a row.
          const rest = flat.filter((_, i) => i < from || i >= end)
          const at = insertAt >= end ? insertAt - (end - from) : insertAt
          const prev = at > 0 ? rest[at - 1].depth : -1
          const lift = Math.max(0, flat[from].depth - (prev + 1))
          const seq = [
            ...rest.slice(0, at).map(r => r.depth),
            ...flat.slice(from, end).map(r => Math.max(0, r.depth - lift)),
            ...rest.slice(at).map(r => r.depth),
          ]
          let orphans = false
          for (let i = 1; i < seq.length; i++) if (seq[i] > seq[i - 1] + 1) orphans = true
          if (orphans) {
            ok(`${label}: refused drop that would orphan rows`)
            continue
          }
          failures++
          console.log(`FAIL ${label}: null result`)
          continue
        }

        // 1. Nothing lost, nothing duplicated.
        const outIds = res.placements.map(p => p.item.id)
        invariant(`${label}: no item lost`, outIds.length === ids.length)
        invariant(
          `${label}: no item duplicated`,
          new Set(outIds).size === outIds.length && outIds.every(id => ids.includes(id))
        )

        // 2. A drag never pushes anything deeper, so it can never turn a link
        //    into a dropdown. Rows keep their depth, except where a parent was
        //    dragged below its own children: those are promoted instead, because
        //    their parent is no longer above them.
        const movingId = flat[from].item.id
        const movingRow = res.placements.find(p => p.item.id === movingId)!
        invariant(
          `${label}: moved row never deepens`,
          movingRow.depth <= depthOf.get(movingId)!
        )
        for (const p of res.placements) {
          invariant(
            `${label}: ${p.item.id} never deepens`,
            p.depth <= depthOf.get(p.item.id)!
          )
        }

        // 3. A row is never left without the parent it is recorded under.
        let prev = -1
        let noOrphans = true
        for (const p of res.placements) {
          if (p.depth > prev + 1) noOrphans = false
          prev = p.depth
        }
        invariant(`${label}: no orphan jump`, noOrphans)

        // 3. The rebuilt tree is structurally valid and round-trips.
        const rebuilt = rebuildNavTree(res.placements)
        const count = (items: NavItem[]): number =>
          items.reduce((n: number, i: NavItem) => n + 1 + count(i.children || []), 0)
        invariant(`${label}: rebuilt count matches`, count(rebuilt) === ids.length)
        invariant(
          `${label}: dropdown iff it has children`,
          rebuilt.every(i => (i.children?.length ? i.type === 'dropdown' : i.type === 'link'))
        )
        invariant(
          `${label}: no empty children arrays`,
          JSON.stringify(rebuilt).indexOf('"children":[]') === -1
        )
        // Round-trip: flattening the result must give back the same depth per id.
        const back = flattenNav(rebuilt)
        invariant(
          `${label}: depths round-trip`,
          res.placements.every((p, i) => back[i] && back[i].item.id === p.item.id && back[i].depth === p.depth)
        )
      }
    }
  }
}

// Known outcomes, pinned so a change in behaviour is deliberate.
const base = [link('a'), link('b'), link('c')]
// insertAt is a gap in the current list: gap 0 is above row 0, gap 1 is below
// row 0, and so on.
const f0 = flattenNav(base)
check('no-op move', resolveNavDrop({ flat: f0, fromIndex: 0, insertAt: 0 })?.placements.map(p => [p.item.id, p.depth]),
  [['a', 0], ['b', 0], ['c', 0]])
// Gap 1 sits just below row 0, which is the row being moved, so this is a no-op.
check('dropping just below itself is a no-op', resolveNavDrop({ flat: f0, fromIndex: 0, insertAt: 1 })?.placements.map(p => p.item.id),
  ['a', 'b', 'c'])
check('reorder down one gap', resolveNavDrop({ flat: f0, fromIndex: 0, insertAt: 2 })?.placements.map(p => p.item.id),
  ['b', 'a', 'c'])
check('reorder to the end', resolveNavDrop({ flat: f0, fromIndex: 0, insertAt: 3 })?.placements.map(p => p.item.id),
  ['b', 'c', 'a'])
check('reorder up to the top', resolveNavDrop({ flat: f0, fromIndex: 2, insertAt: 0 })?.placements.map(p => p.item.id),
  ['c', 'a', 'b'])

// A child is dragged as part of its parent's branch, so the branch stays whole.
const nestedF = flattenNav([link('a', [link('a1', [link('a1x')])]), link('b')])
check('branch moves as one piece',
  resolveNavDrop({ flat: nestedF, fromIndex: 0, insertAt: 4 })?.placements.map(p => [p.item.id, p.depth]),
  [['b', 0], ['a', 0], ['a1', 1], ['a1x', 2]])
check('a child dragged to the top is promoted, not orphaned',
  resolveNavDrop({ flat: nestedF, fromIndex: 2, insertAt: 0 })?.placements.map(p => [p.item.id, p.depth]),
  [['a1x', 0], ['a', 0], ['a1', 1], ['b', 0]])
// A drag never deepens anything: it cannot turn a link into a dropdown.
check('a drag never deepens a row',
  resolveNavDrop({ flat: f0, fromIndex: 0, insertAt: 1 })?.placements.every(p => p.depth === 0), true)
check('dropping into a gap that would orphan rows is refused',
  resolveNavDrop({ flat: nestedF, fromIndex: 3, insertAt: 2 }), null)

console.log(`\n${failures === 0 ? 'ALL PASS' : failures + ' FAILURE(S)'}`)
process.exit(failures === 0 ? 0 : 1)
