import { test, expect } from '@playwright/test'

/**
 * The public menu has to render the whole tree.
 *
 * It previously mapped `item.children` exactly once, so anything nested deeper
 * existed in the admin but never appeared on the site. These tests compare the
 * tree the database actually holds against what the menu shows, at both
 * breakpoints, navigating by the real ancestor chain rather than clicking
 * blindly - a blind walk dead-ends on the first leaf it meets and proves
 * nothing about the rest of the tree.
 */

import * as fs from 'fs'
import * as path from 'path'

interface Node {
  id: string
  label: string
  depth: number
  /** Labels of every ancestor, outermost first. */
  ancestors: string[]
}

function env(): Record<string, string> {
  const out: Record<string, string> = {}
  const file = path.join(process.cwd(), '.env.local')
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return out
}

/** Reads the menu straight from the API: top-level rows plus nested children. */
async function fetchTree(): Promise<Node[]> {
  const e = env()
  const r = await fetch(`${e.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/cms_navigation?select=*`, {
    headers: {
      apikey: e.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${e.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    },
  })
  const rows = await r.json()
  if (!Array.isArray(rows)) return []

  const out: Node[] = []
  const walk = (items: any[], depth: number, ancestors: string[]) => {
    for (const i of items) {
      if (!i) continue
      out.push({ id: i.id, label: i.label, depth, ancestors: [...ancestors] })
      if (Array.isArray(i.children) && i.children.length) {
        walk(i.children, depth + 1, [...ancestors, i.label])
      }
    }
  }
  walk(rows, 0, [])
  return out
}

/**
 * Both bars render the same labels, and the inactive one is `display:none`.
 * Without scoping, `.first()` can land on a hidden desktop link and report an
 * item that is in fact on screen as missing.
 */
const visible = (page: import('@playwright/test').Page, label: string, scope = '[data-nav-desktop]') =>
  page
    .locator(scope)
    .getByText(label, { exact: true })
    .first()
    .isVisible()
    .catch(() => false)

const MOBILE = '[data-nav-mobile]'

test.describe('public navigation', () => {
  test('desktop menu exposes every nesting level', async ({ page }) => {
    const tree = await fetchTree()
    test.skip(tree.length === 0, 'navigation table is empty')
    const maxDepth = Math.max(...tree.map(t => t.depth))
    test.skip(maxDepth < 1, 'menu has no nesting to verify')

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.waitForSelector('nav', { timeout: 15_000 })
    await page.waitForTimeout(1500)

    const deepest = tree.filter(t => t.depth === maxDepth)

    for (const node of deepest) {
      for (const ancestor of node.ancestors) {
        if (await visible(page, node.label)) break
        // Open the branch by name. Nested flyouts sit in the DOM after their
        // parent, so the last match is the one at the deepest open level.
        const trigger = page
          .locator('[data-nav-desktop] button[aria-expanded="false"]')
          .filter({ hasText: new RegExp(`^${escapeRe(ancestor)}$`) })
          .last()
        if ((await trigger.count()) === 0) break
        await trigger.hover()
        await trigger.click()
        await page.waitForTimeout(250)
      }
      expect(
        await visible(page, node.label),
        `"${node.label}" is at depth ${maxDepth} under ${node.ancestors.join(' > ')} ` +
          `but never appears in the desktop menu`
      ).toBe(true)
    }
  })

  test('mobile menu can be drilled to the deepest level', async ({ page }) => {
    const tree = await fetchTree()
    test.skip(tree.length === 0, 'navigation table is empty')
    const maxDepth = Math.max(...tree.map(t => t.depth))
    test.skip(maxDepth < 1, 'menu has no nesting to verify')

    await page.setViewportSize({ width: 420, height: 900 })
    await page.goto('/')
    await page.waitForSelector('nav', { timeout: 15_000 })
    await page.waitForTimeout(1500)

    await page.locator('nav .lg\\:hidden button').last().click()
    await page.waitForTimeout(400)

    const deepest = tree.filter(t => t.depth === maxDepth)

    for (const node of deepest) {
      for (const ancestor of node.ancestors) {
        if (await visible(page, node.label, MOBILE)) break
        const branch = page
          .locator(`${MOBILE} button[aria-label="Åbn underpunkter for ${ancestor}"]`)
          .first()
        if ((await branch.count()) === 0) break
        await branch.click()
        await page.waitForTimeout(250)
      }
      expect(
        await visible(page, node.label, MOBILE),
        `"${node.label}" is at depth ${maxDepth} under ${node.ancestors.join(' > ')} ` +
          `but the mobile menu cannot reach it`
      ).toBe(true)
    }
  })
})

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
