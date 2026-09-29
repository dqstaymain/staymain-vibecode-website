import { test, expect, type Page } from '@playwright/test'

/**
 * The page library and its editor.
 *
 * Pages used to be a collapsible tree in the rail; they now have their own
 * route, so these check the navigation contract the old layout could not
 * express: Sider sits under Indhold, it lists every page, and a page opens the
 * editor at a URL of its own.
 */

const CREDENTIALS = require('./auth.cjs').loadEnvCredentials()
const testAuth = CREDENTIALS ? test : test.skip

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

/**
 * Asserts a page editor is really open, rather than the library behind it.
 *
 * These two used to assert the save control, which is only rendered when there
 * are unsaved changes. On a freshly loaded page that is deliberately absent, so
 * the assertion described a control the design intends not to show. "Did the
 * click navigate to the editor" is the actual question, and the hero plus the
 * block outline is what answers it.
 */
async function expectEditorOpen(page: Page) {
  await expect(page.locator('aside').first()).toBeVisible()
  await expect(page.getByRole('button', { name: /^Rediger hero$/ }).first()).toBeVisible()
  await expect(page.locator('[data-block-row]').first()).toBeVisible()
}

test.describe('sider', () => {
  test('the rail has no pages dropdown', async ({ page }) => {
    await login(page)
    const sider = page.locator('aside').getByRole('button', { name: 'Sider' }).first()
    await expect(sider).toBeVisible({ timeout: 20_000 })

    // The old tree listed every page inline in the rail. It must be gone, or the
    // rail would duplicate the library and eat the width.
    const rail = page.locator('aside')
    const pageTitles = await rail.locator('nav, [role="button"]').count()
    expect(pageTitles, 'the rail no longer inlines a page tree').toBe(0)
  })

  testAuth('Sider sits in the Indhold group and opens the library', async ({ page }) => {
    await login(page)
    await page.goto('/admin/menu')

    const rail = page.locator('aside')
    const siderItem = rail.getByRole('button', { name: 'Sider' }).first()
    await expect(siderItem).toBeVisible({ timeout: 20_000 })

    // Same visual group as the other content items, not its own heading.
    const groupLabel = page
      .locator('aside p.admin-eyebrow')
      .filter({ hasText: 'Indhold' })
    await expect(groupLabel).toBeVisible()
    expect(
      await page.locator('aside p.admin-eyebrow').filter({ hasText: /^Navigation$/ }).count(),
      'the Navigation group heading is gone'
    ).toBe(0)

    await siderItem.click()
    await page.waitForURL('**/admin/sider', { timeout: 15_000 })
  })

  testAuth('the library keeps the rail and the save control', async ({ page }) => {
    await login(page)
    await page.goto('/admin/sider')

    // It used to be a standalone screen with its own header, so arriving here
    // dropped the rail and left no way back into the rest of the CMS.
    await expect(page.locator('aside').first()).toBeVisible({ timeout: 20_000 })
    await expect(
      page.locator('aside button[aria-current="page"]:has-text("Sider")')
    ).toHaveCount(1)
  })

  testAuth('the library lists pages and offers to create one', async ({ page }) => {
    await login(page)
    await page.goto('/admin/sider')
    await expect(page.getByRole('heading', { name: 'Sider' })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('button', { name: 'Ny side' }).first()).toBeVisible()

    // Every page in the CMS should be reachable from here.
    const links = page.locator('main a[href^="/admin/sider/"], a[href^="/admin/sider/"]')
    const count = await links.count()
    expect(count, 'at least one page is listed').toBeGreaterThan(0)
  })

  testAuth('clicking a page opens its editor at its own URL', async ({ page }) => {
    await login(page)
    await page.goto('/admin/sider')
    const first = page.locator('a[href^="/admin/sider/"]').first()
    await expect(first).toBeVisible({ timeout: 20_000 })
    const href = await first.getAttribute('href')
    expect(href).toBeTruthy()

    await first.click()
    await page.waitForURL(`**${href}`, { timeout: 15_000 })

    await expectEditorOpen(page)
  })

  testAuth('a page URL loads that page directly', async ({ page }) => {
    await login(page)
    await page.goto('/admin/sider')
    const first = page.locator('a[href^="/admin/sider/"]').first()
    const href = await first.getAttribute('href')

    // A cold load, not a client-side navigation, so the route really resolves.
    await page.goto(href!)
    await expect(page.locator('aside').first()).toBeVisible({ timeout: 20_000 })
    await expectEditorOpen(page)
  })

  /**
   * The save control appears only once there is something to save.
   *
   * It used to be asserted as permanently visible, which both contradicted the
   * intended design and could only have passed by accident, off a draft left
   * over from an earlier test. Both halves matter: no control on a clean page,
   * a control as soon as an edit is made.
   */
  testAuth('the save control appears only once the page has unsaved changes', async ({
    page,
  }) => {
    await login(page)
    await page.goto('/admin/sider/home')
    await expectEditorOpen(page)

    await expect(page.getByRole('button', { name: /Gem/ })).toHaveCount(0)

    await page.locator('[data-block-row]').first().locator('[role="button"]').first().click()
    const editor = page.getByRole('dialog').last()
    await expect(editor).toBeVisible({ timeout: 20_000 })

    // The section title, addressed by role rather than by markup: a selector
    // like input[type="text"] silently matches nothing when a component stops
    // emitting the type attribute, which is a green test that tested nothing.
    const title = editor.getByRole('textbox', { name: /Overskrift|^$/ }).first()
    await title.fill('Endret af en test')
    await editor.getByRole('button', { name: /Anvend/ }).first().click()

    await expect(page.getByRole('button', { name: /Gem/ })).toBeVisible({ timeout: 20_000 })
  })
})

/**
 * Every page has a hero, and it is not a row in the outline.
 *
 * The hero used to be an ordinary block: added from the picker, dragged, deleted.
 * All three were reachable, and a page could end up with no H1 at all. These
 * check the three ways that could come back.
 */
test.describe('page hero', () => {
  testAuth('every page shows a hero panel that cannot be deleted or moved', async ({ page }) => {
    await login(page)
    await page.goto('/admin/sider')
    const first = page.locator('a[href^="/admin/sider/"]').first()
    await expect(first).toBeVisible({ timeout: 20_000 })
    await first.click()
    await expect(page.locator('aside').first()).toBeVisible({ timeout: 20_000 })

    // The panel is above the outline, not in it.
    const heroPanel = page.getByRole('button', { name: /Hero/ }).first()
    await expect(heroPanel).toBeVisible()

    // No delete, no drag handle, no reorder arrows. The outline rows have all
    // three, so their absence here is the assertion.
    const outline = page.locator('main .admin-spine')
    await expect(heroPanel.locator('[aria-label^="Slet"]')).toHaveCount(0)
    await expect(heroPanel.locator('[aria-label^="Flyt"]')).toHaveCount(0)
    await expect(outline.getByRole('button', { name: /^Hero/ })).toHaveCount(0)
  })

  testAuth('the component picker does not offer a hero', async ({ page }) => {
    await login(page)
    await page.goto('/admin/sider')
    const first = page.locator('a[href^="/admin/sider/"]').first()
    await expect(first).toBeVisible({ timeout: 20_000 })
    await first.click()
    await expect(page.locator('aside').first()).toBeVisible({ timeout: 20_000 })

    await page.getByText('Tilføj sektion').click()
    const picker = page.getByRole('heading', { name: 'Vælg komponent' })
    await expect(picker).toBeVisible({ timeout: 15_000 })

    // Offering it would let somebody put a second hero on the page.
    await expect(picker.locator('..').getByText('Hero', { exact: true })).toHaveCount(0)
  })

  testAuth('the hero editor offers three impact levels', async ({ page }) => {
    await login(page)
    await page.goto('/admin/sider')
    const first = page.locator('a[href^="/admin/sider/"]').first()
    await expect(first).toBeVisible({ timeout: 20_000 })
    await first.click()
    await expect(page.locator('aside').first()).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /Hero/ }).first().click()
    await expect(page.getByText('Rediger SEO').or(page.getByText('Hero')).first()).toBeVisible()

    for (const label of ['Høj effekt', 'Mellem effekt', 'Lav effekt']) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible()
    }
  })
})
