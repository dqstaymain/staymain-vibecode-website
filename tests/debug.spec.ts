import { test } from '@playwright/test'

const CREDENTIALS = require('./auth.cjs').loadEnvCredentials()

test('what renders where', async ({ page }) => {
  await page.goto('/admin/login')
  await page.locator('#login-email').waitFor({ state: 'visible', timeout: 15_000 })
  await page.locator('#login-email').fill(CREDENTIALS.email)
  await page.locator('#login-password').fill(CREDENTIALS.password)
  await page.getByRole('button', { name: 'Log ind' }).click()
  await page.waitForURL(/\/admin\//, { timeout: 30_000 })
  await page.waitForTimeout(1500)

  for (const u of ['/admin/sider', '/admin/menu', '/admin/cases', '/admin/finnes-ikke']) {
    await page.goto(u)
    await page.waitForTimeout(2000)
    const text = (await page.locator('body').innerText()).replace(/\n/g, ' | ')
    console.log(`${u} -> url=${page.url()} aside=${await page.locator('aside').count()}`)
    console.log(`   body: ${text.slice(0, 150)}`)
  }
})
