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

    // The Supabase client persists the session under an `sb-<ref>-auth-token`
    // localStorage key. Capturing state without it writes a file that looks
    // valid but authenticates nothing: every spec then loads the admin, gets
    // redirected client-side to /admin/login, and - because the admin shell
    // paints first - assertions can pass against a page the user is about to be
    // thrown off. That is a test that reports success while testing nothing.
    //
    // Polled rather than read once, because the token is written on the auth
    // response, which can land after `networkidle` has already fired.
    try {
      await page.waitForFunction(
        () => Object.keys(window.localStorage).some(k => k.includes('auth-token')),
        undefined,
        { timeout: 15_000 }
      )
    } catch {
      throw new Error(
        'Signed in but no Supabase session was persisted to localStorage, so the ' +
          'saved storage state would not authenticate. Refusing to write one.'
      )
    }

    await context.storageState({ path: STORAGE_STATE })
    console.log('Signed in; session saved for reuse.')
  } finally {
    await browser.close()
  }
}
