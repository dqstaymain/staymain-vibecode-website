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

  testAuth('/admin opens the dashboard at its own URL', async ({ page }) => {
    await login(page)
    await page.goto('/admin')

    // It used to hand off to /admin/sider on mount, so logging in moved you off
    // the address you asked for. The home is a screen now, not a redirect.
    await expect(page.locator('aside').first()).toBeVisible({ timeout: 20_000 })
    await expect(page).toHaveURL(/\/admin$/)
    await expect(page.getByRole('heading', { name: 'Oversigt' })).toBeVisible()
    // The rail marks the screen it opened on as current.
    await expect(
      page.locator('aside button[aria-current="page"]:has-text("Oversigt")')
    ).toHaveCount(1)
  })

  testAuth('the dashboard counts each kind of content', async ({ page }) => {
    await login(page)
    await page.goto('/admin')

    // The counts are the point of the screen, so each tile is asserted by the
    // number next to its label rather than by the label alone.
    for (const label of ['Sider', 'Cases', 'Kundeudtalelser', 'Firmalogoer', 'Menupunkter']) {
      await expect(
        page.locator(`main a:has-text("${label}")`).first()
      ).toBeVisible({ timeout: 20_000 })
    }
  })

  testAuth('the dashboard links each content type to its own screen', async ({ page }) => {
    await login(page)
    await page.goto('/admin')

    const sider = page.locator('main a[href="/admin/sider"]').first()
    await expect(sider).toBeVisible({ timeout: 20_000 })
    await sider.click()
    await page.waitForURL('**/admin/sider', { timeout: 15_000 })
    await expect(page.getByRole('heading', { name: 'Sider' })).toBeVisible()
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
