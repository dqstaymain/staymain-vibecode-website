import type { NavItem } from './cms'

/**
 * One row of the flattened menu editor.
 *
 * WordPress does not nest separate lists inside each other. It renders every
 * item in a single flat list and shows the tree structure purely through
 * indentation, so dragging left or right moves an item between levels. That is
 * a different model from a tree of nested droppables, and it is the reason
 * nesting works there without any ambiguous "into the middle of this row"
 * targets.
 */
export interface FlatNavItem {
  item: NavItem
  /** 0 for a top-level item, 1 for its child, and so on. */
  depth: number
  /** Stable per-render id, e.g. "0", "0.2", "0.2.1". */
  path: string
}

export interface NavPlacement {
  item: NavItem
  depth: number
}

/** Depth-first walk that flattens the tree into rows, tagging each with depth. */
export function flattenNav(nav: NavItem[]): FlatNavItem[] {
  const out: FlatNavItem[] = []
  const walk = (items: NavItem[], depth: number, prefix: string) => {
    items.forEach((item, i) => {
      const path = prefix === '' ? String(i) : `${prefix}.${i}`
      out.push({ item, depth, path })
      if (item.children?.length) walk(item.children, depth + 1, path)
    })
  }
  walk(nav, 0, '')
  return out
}

/**
 * Rebuilds a tree from a flat, depth-tagged list.
 *
 * Going through a flat list is what makes a single drag able to reorder and
 * re-parent at once, the way WordPress does it. Re-parenting therefore needs no
 * separate logic: a child is simply a row whose depth is one greater than the
 * row above it.
 *
 * A level is only legal directly under the row above it, so the depth is clamped
 * to the stack as it is built. A malformed list cannot produce a detached branch.
 */
export function rebuildNavTree(placements: NavPlacement[]): NavItem[] {
  const root: NavItem[] = []
  // stack[d] is the child array for the item currently open at depth d.
  const stack: NavItem[][] = [root]

  for (const { item, depth } of placements) {
    const d = Math.min(Math.max(0, depth), stack.length - 1)
    const children: NavItem[] = []
    const node: NavItem = { ...item, children }
    stack[d].push(node)
    stack.length = d + 1
    stack.push(children)
  }

  const normalise = (items: NavItem[]): NavItem[] =>
    items.map(node => {
      const kids = node.children?.length ? normalise(node.children) : undefined
      return {
        ...node,
        // An empty array is truthy, so leaving one in place persists a
        // childless 'dropdown' that renders a dead button.
        children: kids,
        type: kids ? 'dropdown' : 'link',
        parentNavId: undefined,
      }
    })

  return normalise(root)
}

export interface NavDropResult {
  placements: NavPlacement[]
  /** Depth the item ended up at, for confirming the intent. */
  depth: number
  parentId: string | null
}

/**
 * Works out where a dragged row lands.
 *
 * Reorder only. Nesting is not something a drag does here: dragging moves a row
 * up or down and keeps its existing parent, and turning a link into a dropdown
 * is an explicit click. That mirrors the block editor, where dragging reorders
 * and nothing else.
 *
 * A parent is dragged as a whole branch, children included, because a parent
 * has to stay directly above them. Moving one row on its own would either
 * separate them or silently promote them, so the subtree travels as a unit.
 *
 * `insertAt` is a gap in the *current* list, from 0 to flat.length, counted the
 * way the insertion line is drawn: gap N sits just above row N.
 */
export function resolveNavDrop({
  flat,
  fromIndex,
  insertAt,
}: {
  flat: FlatNavItem[]
  fromIndex: number
  /** Gap in the current list, 0..flat.length. */
  insertAt: number
}): NavDropResult | null {
  if (fromIndex < 0 || fromIndex >= flat.length) return null

  const moving = flat[fromIndex]

  // The rows that travel with the dragged one: itself plus everything under it.
  const prefix = `${moving.path}.`
  let end = fromIndex + 1
  while (end < flat.length && flat[end].path.startsWith(prefix)) end++
  const block = flat.slice(fromIndex, end)
  const rest = flat.filter((_, i) => i < fromIndex || i >= end)

  const gap = Math.min(Math.max(0, insertAt), flat.length)
  // A drop inside the branch being moved would be a no-op, not a reorder.
  if (gap > fromIndex && gap < end) return null

  // Removing the block first shortens the list, so a gap at or below it shifts up.
  const at = gap >= end ? gap - (end - fromIndex) : gap

  const before = rest.slice(0, at)
  const after = rest.slice(at)

  // A branch keeps its internal levels, but the row it hangs under may not be
  // able to hold it: a child dropped above its own parent, or at the very top of
  // the list, has no parent left to sit under. The whole branch is lifted just
  // far enough to become a child of whatever precedes it, which keeps every
  // level inside the branch intact.
  const prevDepth = before.length > 0 ? before[before.length - 1].depth : -1
  const lift = Math.max(0, block[0].depth - (prevDepth + 1))

  const placements: NavPlacement[] = [
    ...before.map(r => ({ item: r.item, depth: r.depth })),
    ...block.map(r => ({ item: r.item, depth: Math.max(0, r.depth - lift) })),
    ...after.map(r => ({ item: r.item, depth: r.depth })),
  ]

  // A gap can still land between a parent and one of its children, which would
  // split that branch and orphan everything below it. Rather than enumerate
  // which gaps those are, the finished list is checked directly: a row may only
  // ever sit one level under the row above it. Anything else is not a legal
  // place to drop.
  for (let i = 1; i < placements.length; i++) {
    if (placements[i].depth > placements[i - 1].depth + 1) return null
  }

  const depth = placements.find(p => p.item.id === moving.item.id)?.depth ?? 0

  // Reported for the caller's benefit; the tree is rebuilt from the depths.
  // Read back from the finished list so the index cannot run past its end.
  const movedAt = placements.findIndex(p => p.item.id === moving.item.id)
  let parentId: string | null = null
  for (let i = movedAt - 1; i >= 0; i--) {
    if (placements[i].depth < depth) {
      parentId = placements[i].item.id
      break
    }
  }

  return { placements, depth, parentId }
}

/** Row id for a flattened path. */
export const navRowId = (path: string) => `row:${path}`

export function navPathOf(rowId: string): string {
  return rowId.startsWith('row:') ? rowId.slice('row:'.length) : rowId
}
