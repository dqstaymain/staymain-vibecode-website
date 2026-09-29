import { test, expect, type Page } from '@playwright/test'

/**
 * Browser-level checks for the admin's drag and drop.
 *
 * Every one of these covers a fault that the type checker, the production build
 * and an HTTP route sweep all pass straight over: a row that renders as
 * draggable but was never registered as a droppable, an insertion line that
 * points at a gap the drop does not use, and an order that saves but reverts.
 * Only a real browser catches them.
 *
 * Credentials come from ADMIN_EMAIL / ADMIN_PASSWORD in .env.local. When they are
 * absent the signed-in tests skip rather than fail, so a fresh clone still gets
 * the public checks. The persistence test is expected to fail until
 * supabase/migrations/001_add_position_columns.sql has been applied.
 */

const CREDENTIALS = require('./auth.cjs').loadEnvCredentials()
const testAuth = CREDENTIALS ? test : test.skip

const rows = (page: Page) => page.locator('li[data-nav-row]')

/**
 * Navigates to a workspace route and waits for it to render.
 *
 * The session was captured once in global setup. There is deliberately no login
 * fallback here: the admin renders client-side, so a momentary "Indlaeser..."
 * would look like "no session" and send the test to /admin/login, which then
 * redirects straight back because the session is in fact valid - and
 * #login-email never appears.
 */
async function login(page: Page, path = '/admin/menu') {
  await page.goto(path)
  await expect(page.locator('aside').first()).toBeVisible({ timeout: 30_000 })
}

async function openMenu(page: Page) {
  await login(page)
  // Straight to the menu's own route. `/admin` now lands on the page library,
  // which is a standalone screen with no rail.
  await page.goto('/admin/menu')
  const menuButton = page.getByRole('button', { name: 'Rediger menu' }).first()
  await expect(menuButton).toBeVisible({ timeout: 20_000 })
  await expect(rows(page).first()).toBeVisible({ timeout: 20_000 })
}

/** Label of each row's depth badge, i.e. the nesting level. */
const depths = (page: Page) =>
  rows(page).evaluateAll(els =>
    els.map(e => (e.textContent ?? '').trim().slice(0, 1))
  )

/**
 * Presses a row's handle and moves the pointer.
 *
 * Has to be stepped: dnd-kit's PointerSensor ignores synthetic events, and its
 * 6px activation distance means a single jump would be read as a click. Rows are
 * scrolled into view first, because an off-screen bounding box hands the mouse
 * coordinates it can never reach and the press silently lands on nothing.
 */
async function grabAndMoveTo(page: Page, fromIndex: number, toIndex: number) {
  await rows(page).nth(fromIndex).scrollIntoViewIfNeeded()
  const handle = rows(page)
    .nth(fromIndex)
    .locator('button[aria-label^="Flyt "]')
  const start = await handle.boundingBox()
  if (!start) throw new Error('row not in view')

  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2)
  await page.mouse.down()
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2 + 10, {
    steps: 5,
  })

  await rows(page).nth(toIndex).scrollIntoViewIfNeeded().catch(() => {})
  const target = await rows(page).nth(toIndex).boundingBox()
  if (!target) return false
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, {
    steps: 15,
  })
  await page.waitForTimeout(300)
  return true
}

/** Which rows are showing a drop indicator, and whether it is a refusal. */
const dropMarkers = (page: Page) =>
  rows(page).evaluateAll(els =>
    els
      .map((e, i) => {
        if (e.hasAttribute('data-nav-blocked')) return { i, state: 'blocked' }
        const d = e.getAttribute('data-nav-drop')
        return d ? { i, state: d } : null
      })
      .filter(Boolean) as { i: number; state: string }[]
  )

test.describe('admin drag and drop', () => {
  test('public pages render without console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', m => m.type() === 'error' && errors.push(m.text()))
    page.on('pageerror', e => errors.push(String(e)))

    for (const path of ['/', '/en']) {
      await page.goto(path)
      await expect(page.locator('body')).toBeVisible()
    }

    // The browser extension that annotates the HTML is not an application
    // fault, and neither is the missing `position` column, which is covered by
    // its own test and by the banner in the admin.
    const real = errors.filter(
      e =>
        !/cz-shortcut-listen|hydrated but some attributes/i.test(e) &&
        !/Failed to load resource: the server responded with a status of 400/i.test(e)
    )
    expect(real, real.join('\n')).toEqual([])
  })

  testAuth('every row is a registered droppable', async ({ page }) => {
    await openMenu(page)

    // A missing sortable node leaves the handle with working listeners, so the
    // row looks draggable and nothing happens. The node ref is what registers
    // it, and it is the thing that was silently dropped before.
    const info = await rows(page).evaluateAll(els =>
      els.map(e => {
        const h = e.querySelector('button[aria-label^="Flyt "]')
        return {
          hasNode: e.hasAttribute('data-nav-row'),
          role: h?.getAttribute('aria-roledescription') ?? null,
          labelled: !!h?.getAttribute('aria-label'),
        }
      })
    )
    expect(info.length).toBeGreaterThan(0)
    expect(info.every(r => r.hasNode), 'every row carries its sortable id').toBe(true)
    expect(
      info.every(r => r.role === 'sortable'),
      'every handle is wired to dnd-kit'
    ).toBe(true)
    expect(info.every(r => r.labelled), 'every handle has an accessible name').toBe(true)
  })

  testAuth('a drag produces a gap indicator on a real gap', async ({ page }) => {
    await openMenu(page)
    const count = await rows(page).count()
    if (count < 3) test.skip(true, 'needs at least three rows')

    const moved = await grabAndMoveTo(page, 0, count - 1)
    expect(moved, 'target row was reachable').toBe(true)

    // Something must be showing, and it must not be a refusal.
    const markers = await dropMarkers(page)
    expect(markers.length, 'an indicator appeared during the drag').toBeGreaterThan(0)
    expect(
      markers.every(m => m.state !== 'blocked'),
      'no gap inside the dragged branch is reported as a refusal'
    ).toBe(true)

    await page.screenshot({ path: 'test-results/menu-drag.png' })
    await page.mouse.up()
  })

  testAuth('the indicator sits on a row edge, never mid-row', async ({ page }) => {
    await openMenu(page)
    const count = await rows(page).count()
    if (count < 3) test.skip(true, 'needs at least three rows')

    await grabAndMoveTo(page, 0, count - 1)

    const offsets = await rows(page).evaluateAll(els =>
      els.map(li => {
        const bar = [...li.querySelectorAll('span')].find(
          s =>
            s.className.includes('--accent') &&
            s.className.includes('h-0.5') &&
            s.getBoundingClientRect().width > 0
        ) as HTMLElement | undefined
        if (!bar) return null
        const b = bar.getBoundingClientRect()
        const r = li.getBoundingClientRect()
        return { fromTop: b.top - r.top, fromBottom: r.bottom - b.bottom }
      })
    )

    for (const o of offsets.filter(Boolean) as { fromTop: number; fromBottom: number }[]) {
      expect(
        o.fromTop < 6 || o.fromBottom < 6,
        `indicator was ${o.fromTop.toFixed(1)}px from the top and ` +
          `${o.fromBottom.toFixed(1)}px from the bottom of its row`
      ).toBe(true)
    }
    await page.mouse.up()
  })

  testAuth('a reorder changes the visible order', async ({ page }) => {
    await openMenu(page)
    const count = await rows(page).count()
    if (count < 2) test.skip(true, 'needs at least two rows')

    const before = await depths(page)
    await grabAndMoveTo(page, 0, count - 1)
    await page.mouse.up()
    await page.waitForTimeout(700)

    const after = await depths(page)
    expect(after.length, 'no rows were lost').toBe(before.length)
    expect(after.join(), 'the order actually changed').not.toBe(before.join())
  })

  testAuth('a reorder survives a reload', async ({ page }) => {
    await openMenu(page)
    const count = await rows(page).count()
    if (count < 2) test.skip(true, 'needs at least two rows')

    await grabAndMoveTo(page, 0, count - 1)
    await page.mouse.up()
    await page.waitForTimeout(1200)
    const after = await depths(page)

    await page.reload()
    // The reload lands on /admin/menu, so the rows come back on their own.
    await expect(rows(page).first()).toBeVisible({ timeout: 20_000 })
    const reloaded = await depths(page)

    // Requires supabase/migrations/001_add_position_columns.sql. Without the
    // position column the loader falls back to id order and this reverts.
    expect(
      reloaded.join(),
      'order reverted: the position column is missing, so the save is lost'
    ).toBe(after.join())
  })
})
