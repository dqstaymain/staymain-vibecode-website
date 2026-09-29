import { defineConfig } from '@playwright/test'

/**
 * The admin is auth-gated, so visual checks need a real login. Credentials come
 * from ADMIN_EMAIL / ADMIN_PASSWORD, which are read from .env.local and never
 * committed. Leave them unset to skip the authenticated suite instead of
 * failing, so a fresh clone still gets the public checks.
 */
export default defineConfig({
  testDir: './tests',
  // One login per run, captured here, rather than one per test.
  globalSetup: require.resolve('./tests/global-setup.ts'),
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3000',
    // Absent when credentials are not configured; those tests skip anyway.
    storageState: 'tests/.auth/user.json',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    // A production build, not `next dev`. The dev server kept serving a cached
    // 404 for a route that provably existed in the build output, which is a
    // miserable thing to debug and says nothing about the shipped behaviour.
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    // Never reuse a running server. Reusing one silently tests whatever it was
    // serving, which means a source fix can look like it did nothing - and an
    // edit to a data-attribute or aria-label will not reach the tests at all.
    // The build is a few seconds; a green run against stale code is worthless.
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
