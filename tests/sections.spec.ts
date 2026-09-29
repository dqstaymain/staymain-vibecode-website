import { test, expect } from '@playwright/test'

/**
 * Section rendering, checked in a browser because every one of these failures is
 * invisible to the type checker, the build and a server-render smoke test: the
 * markup is all present in the DOM, it is simply invisible or missing.
 *
 * The reveal animation is the dangerous one. It starts at opacity 0, so a
 * missed IntersectionObserver does not skip an animation - it deletes the
 * content. A fast scroll left whole sections permanently blank once already;
 * these check that no element is ever left at zero opacity.
 */

const BASE = 'http://localhost:3000'

/** Scrolls the whole page the way a reader would, then returns to the top. */
async function scrollThrough(page: import('@playwright/test').Page, step = 0.8, pause = 80) {
  await page.evaluate(
    async ([stepRatio, pauseMs]) => {
      const stepPx = window.innerHeight * (stepRatio as number)
      const delay = pauseMs as number
      for (let y = 0; y < document.body.scrollHeight; y += stepPx) {
        window.scrollTo(0, y)
        await new Promise(r => setTimeout(r, delay))
      }
      window.scrollTo(0, 0)
      await new Promise(r => setTimeout(r, 400))
    },
    [step, pause] as const
  )
}

/** Blocks that have not finished revealing. */
const stuckReveals = (page: import('@playwright/test').Page) =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll('.reveal'))
      .map(el => ({
        top: Math.round(el.getBoundingClientRect().top + window.scrollY),
        opacity: Number(getComputedStyle(el).opacity),
      }))
      .filter(el => el.opacity < 0.99)
  )

/**
 * Waits for every block to finish revealing, or gives up.
 *
 * Polls rather than sleeping a fixed time, so this asserts the end state
 * instead of racing the animation - a fixed wait makes the test pass or fail
 * depending on how fast the machine is.
 */
async function waitForReveals(page: import('@playwright/test').Page, timeout = 6000) {
  await expect.poll(() => stuckReveals(page).then(s => s.length), { timeout }).toBe(0)
}

test.describe('public sections', () => {
  test('every section becomes visible after scrolling through the page', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await scrollThrough(page)
    await waitForReveals(page)

    const stuck = await stuckReveals(page)
    // The failure is a blank band on the page, not a missing animation, so this
    // asserts visibility and nothing about how it got there.
    expect(
      stuck,
      `these blocks are still invisible: ${stuck.map(s => s.top).join(', ')}`
    ).toEqual([])
  })

  test('no section renders as a tall empty band', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await scrollThrough(page)

    const bands = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('section.blk')).map(el => ({
        height: Math.round(el.getBoundingClientRect().height),
        text: (el.innerText || '').replace(/\s+/g, ' ').trim().length,
        // An empty band is the signature of a renderer that found no data: the
        // padding still renders, so the section looks present but says nothing.
        children: el.querySelectorAll('img, a, button').length,
      }))
    )

    expect(bands.length, 'the front page has sections to render').toBeGreaterThan(0)

    const empty = bands.filter(b => b.text === 0 && b.children === 0)
    expect(empty, `empty bands: ${empty.map(b => b.height + 'px').join(', ')}`).toEqual([])

    // A band two viewports tall for no content is the same fault wearing padding.
    const absurd = bands.filter(b => b.text < 40 && b.height > 900)
    expect(absurd, `oversized near-empty bands: ${absurd.map(b => b.height + 'px').join(', ')}`).toEqual([])
  })

  test('section images actually load', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await scrollThrough(page)

    const broken = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLImageElement>('section.blk img'))
        .filter(img => !img.complete || img.naturalWidth === 0)
        .map(img => img.getAttribute('src'))
    )

    expect(broken, `images that did not load: ${broken.join(', ')}`).toEqual([])
  })

  test('sections render in both light and dark tones', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' })

    const tones = await page.evaluate(() =>
      Array.from(document.querySelectorAll('section.blk')).map(el =>
        el.className.includes('blk--dark') ? 'dark' : el.className.includes('blk--muted') ? 'muted' : 'light'
      )
    )

    // The tone system exists to give a long page rhythm. If everything renders
    // the same tone the bands are indistinguishable and the system is unused.
    expect(tones.length).toBeGreaterThan(1)
    expect(new Set(tones).size, `tones on the page: ${tones.join(', ')}`).toBeGreaterThan(1)
  })

  test('a fast flick through the page still leaves everything visible', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' })

    // The case that produced blank bands: large jumps with almost no dwell time,
    // so the observer is very likely to miss the entries.
    await page.evaluate(async () => {
      const h = document.body.scrollHeight
      for (const y of [h, 0, h, 0, h, 0]) {
        window.scrollTo(0, y)
        await new Promise(r => setTimeout(r, 30))
      }
    })
    await waitForReveals(page)

    const stuck = await stuckReveals(page)
    expect(stuck, 'blocks left invisible after a fast scroll').toEqual([])
  })

  test('blocks use the minimal type and pill system', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' })

    // Section headings are the deliberate sans exception: the global rule pins
    // h2 to the serif, and `.blk-title` must override it, or every section
    // silently reverts to the old voice.
    const titleFont = await page.evaluate(() => {
      const el = document.querySelector('section.blk .blk-title')
      return el ? getComputedStyle(el).fontFamily : null
    })
    expect(titleFont, 'the page has a section heading to check').toBeTruthy()
    expect(titleFont!, 'section headings render in the sans face').toContain('DM Sans')
    expect(titleFont!, 'section headings do not use the serif').not.toContain('Baskerville')

    // Calls to action are quiet pills: a large radius and no shadow or lift.
    const pill = await page.evaluate(() => {
      const el = document.querySelector('section.blk .blk-btn--primary') as HTMLElement | null
      if (!el) return null
      const cs = getComputedStyle(el)
      return { radius: parseFloat(cs.borderRadius), shadow: cs.boxShadow }
    })
    expect(pill, 'the page has a primary section button to check').toBeTruthy()
    expect(pill!.radius, `pill radius: ${pill!.radius}px`).toBeGreaterThanOrEqual(30)
    expect(pill!.shadow, 'primary pills carry no shadow').toBe('none')

    // At least one section centres its header, the Codex default rhythm.
    const centered = await page.evaluate(
      () => document.querySelectorAll('section.blk .blk-head--center').length
    )
    expect(centered, 'at least one section centres its header').toBeGreaterThan(0)
  })

  test('blocks below the fold are visible without any scrolling at all', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' })
    // No scrolling. A block that renders below the fold must still end up
    // visible from the fallback, so a reader who jumps straight to an anchor or
    // restores a scroll position mid-page does not land on a blank band.
    await waitForReveals(page, 4000)
    expect(await stuckReveals(page), 'blocks stayed invisible with no scrolling').toEqual([])
  })
})
