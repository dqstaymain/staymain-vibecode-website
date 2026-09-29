import { test, expect, type Page } from '@playwright/test'

/**
 * Every admin section has its own URL.
 *
 * The sections used to be seven mutually exclusive booleans toggled by one
 * `goTo` function, which meant no section could be linked to, the browser Back
 * button did nothing, and adding a section meant editing a precedence chain.
 * These check the routing contract that replaced it.
 */

const CREDENTIALS = require('./auth.cjs').loadEnvCredentials()
const testAuth = CREDENTIALS ? test : test.skip

const SECTIONS = [
  { segment: 'generelt', label: 'Generelle oplysninger' },
  { segment: 'header-footer', label: 'Header / Footer' },
  { segment: 'cases', label: 'Cases' },
  { segment: 'anmeldelser', label: 'Kundeudtalelser' },
  { segment: 'logoer', label: 'Firmalogoer' },
  { segment: 'mediebibliotek', label: 'Mediebibliotek' },
  { segment: 'menu', label: 'Rediger menu' },
]

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

test.describe('admin routing', () => {
  test('an unknown section shows the admin 404, not a blank screen', async ({ page }) => {
    await login(page)
    await page.goto('/admin/finnes-ikke')
    // Asserted on what is rendered rather than the status: Next serves a 200
    // with the not-found body for an unmatched segment, and what matters here
    // is that a signed-in editor is not left staring at an empty canvas.
    await expect(page.getByText('Siden findes ikke')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('aside')).toHaveCount(0)
    // There has to be a way back out.
    await expect(page.getByRole('link', { name: 'Tilbage til sider' })).toBeVisible()
  })

  testAuth('/admin lands on a real section', async ({ page }) => {
    await login(page)
    await page.goto('/admin')
    await page.waitForURL(/\/admin\/(sider|generelt|cases|mediebibliotek|menu)/, {
      timeout: 15_000,
    })
  })

  for (const { segment, label } of SECTIONS) {
    testAuth(`${label} opens directly at its own URL`, async ({ page }) => {
      await login(page)
      // A cold load, so the route really resolves rather than relying on a
      // previous client-side navigation having warmed it.
      await page.goto(`/admin/${segment}`)
      await expect(page.locator('aside').first()).toBeVisible({ timeout: 20_000 })

      const railItem = page.locator('aside').getByRole('button', { name: label }).first()
      await expect(railItem).toBeVisible()

      // The screen for this URL, and only this one, should be showing.
      await expect(
        page.locator(`aside button[aria-current="page"]:has-text("${label}")`)
      ).toHaveCount(1)
    })
  }

  testAuth('clicking a rail item navigates to that section URL', async ({ page }) => {
    await login(page)
    // Start on a route that has the rail. /admin lands on the page library,
    // which is a standalone screen without one.
    await page.goto('/admin/menu')
    await expect(page.locator('aside').first()).toBeVisible({ timeout: 20_000 })

    for (const { segment, label } of SECTIONS) {
      const item = page.locator('aside').getByRole('button', { name: label }).first()
      await expect(item).toBeVisible({ timeout: 20_000 })
      await item.click()
      await page.waitForURL(`**/admin/${segment}`, { timeout: 15_000 })
    }
  })

  testAuth('Back returns to the previous section', async ({ page }) => {
    await login(page)
    await page.goto('/admin/generelt')
    await expect(page.locator('aside').first()).toBeVisible({ timeout: 20_000 })
    await page.locator('aside').getByRole('button', { name: 'Mediebibliotek' }).first().click()
    await page.waitForURL('**/admin/mediebibliotek', { timeout: 15_000 })

    // Previously every section lived on one URL, so Back had nowhere to go.
    await page.goBack()
    await page.waitForURL('**/admin/generelt', { timeout: 15_000 })
  })
})
