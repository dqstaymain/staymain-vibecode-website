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
 * Confirms the saved session from global setup is still good.
 *
 * The login itself happens once per run; without it every test made its own
 * Supabase auth round trip, which was both slow and the source of intermittent
 * timeouts waiting for the CMS.
 */
async function login(page: Page) {
  await page.goto('/admin/menu')
  const rail = page.locator('aside').first()
  if ((await rail.count()) === 0) {
    // No stored session (credentials absent, or it expired): fall back.
    await page.goto('/admin/login')
    await page.locator('#login-email').waitFor({ state: 'visible', timeout: 30_000 })
    await page.locator('#login-email').fill(CREDENTIALS.email)
    await page.locator('#login-password').fill(CREDENTIALS.password)
    await page.getByRole('button', { name: 'Log ind' }).click()
    await page.waitForURL(/\/admin\/[a-z-]+/, { timeout: 30_000 })
  }
  await expect(page.locator('aside').first()).toBeVisible({ timeout: 30_000 })
}

test.describe('sider', () => {
  test('the rail has no pages dropdown', async ({ page }) => {
    await login(page)
    // A workspace route, not /admin: the library page is a standalone screen
    // with no rail, and the rail is what this is about.
    await page.goto('/admin/menu')
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

    // The editor is the workspace: the rail and the save control are present.
    await expect(page.locator('aside').first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Gem/ })).toBeVisible()
  })

  testAuth('a page URL loads that page directly', async ({ page }) => {
    await login(page)
    await page.goto('/admin/sider')
    const first = page.locator('a[href^="/admin/sider/"]').first()
    const href = await first.getAttribute('href')

    // A cold load, not a client-side navigation, so the route really resolves.
    await page.goto(href!)
    await expect(page.locator('aside').first()).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('button', { name: /Gem/ })).toBeVisible()
  })
})
