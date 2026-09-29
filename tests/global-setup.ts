import { chromium, type FullConfig } from '@playwright/test'

/**
 * Signs in once per run and saves the session for every spec to reuse.
 *
 * Each test used to perform its own login, which meant two dozen Supabase auth
 * round trips and, under that load, occasional 20s timeouts waiting for the CMS
 * to become ready. One login per run is faster and far steadier.
 */
const CREDENTIALS = require('./auth.cjs').loadEnvCredentials()
const STORAGE_STATE = 'tests/.auth/user.json'

export default async function globalSetup(_config: FullConfig) {
  if (!CREDENTIALS) {
    console.log('ADMIN_EMAIL / ADMIN_PASSWORD not set: authenticated tests will skip.')
    return
  }

  const browser = await chromium.launch()
  try {
    const context = await browser.newContext({ baseURL: 'http://localhost:3000' })
    const page = await context.newPage()

    await page.goto('/admin/login')
    await page.locator('#login-email').waitFor({ state: 'visible', timeout: 30_000 })
    await page.locator('#login-email').fill(CREDENTIALS.email)
    await page.locator('#login-password').fill(CREDENTIALS.password)
    await page.getByRole('button', { name: 'Log ind' }).click()
    await page.waitForURL(/\/admin\/[a-z-]+/, { timeout: 30_000 })
    // Wait for the CMS to finish loading before the cookies are captured, so
    // nothing races the session restore on the first real navigation.
    await page.waitForLoadState('networkidle')

    await context.storageState({ path: STORAGE_STATE })
    console.log('Signed in; session saved for reuse.')
  } finally {
    await browser.close()
  }
}
