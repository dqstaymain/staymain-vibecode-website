/**
 * Screenshots the public sections so the redesign can be looked at, not just
 * asserted about. Writes to test-results/design/ and is not a test.
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const OUT = path.join(process.cwd(), 'test-results', 'design')
const BASE = 'http://localhost:3000'

const SHOTS = [
  { name: 'forside', url: '/', full: true },
  { name: 'om-os', url: '/om-os', full: true },
]

;(async () => {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    baseURL: BASE,
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  })
  const page = await ctx.newPage()

  const errors = []
  page.on('console', m => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`))

  for (const shot of SHOTS) {
    await page.goto(shot.url, { waitUntil: 'networkidle' })
    // Let the reveal observers fire before capturing, or every section is
    // caught mid-fade at opacity 0 and the screenshot looks like a blank page.
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.8
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y)
        await new Promise(r => setTimeout(r, 90))
      }
      window.scrollTo(0, 0)
      await new Promise(r => setTimeout(r, 400))
    })
    await page.waitForTimeout(600)
    await page.screenshot({
      path: path.join(OUT, `${shot.name}.png`),
      fullPage: shot.full,
    })
    console.log(`captured ${shot.name} (${shot.url})`)
  }

  // A mobile pass on the front page, since the grids collapse differently.
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y)
      await new Promise(r => setTimeout(r, 90))
    }
    window.scrollTo(0, 0)
    await new Promise(r => setTimeout(r, 400))
  })
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(OUT, 'forside-mobile.png'), fullPage: true })
  console.log('captured forside-mobile')

  if (errors.length) {
    console.log('\nconsole errors:')
    for (const e of errors.slice(0, 15)) console.log('  ' + e)
  } else {
    console.log('\nno console errors')
  }

  await browser.close()
})()
