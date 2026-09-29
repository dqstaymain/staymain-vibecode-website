/**
 * Reports what each public section actually rendered: its band, its height and
 * the text inside it. Catches a section that renders a full-height band with
 * nothing in it - the failure mode a screenshot shows but a smoke test passes.
 */
const { chromium } = require('@playwright/test')

const BASE = 'http://localhost:3000'
const slug = process.argv[2] || '/'

;(async () => {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ baseURL: BASE, viewport: { width: 1440, height: 1000 } })
  const page = await ctx.newPage()
  await page.goto(slug, { waitUntil: 'networkidle' })
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight * 0.8) {
      window.scrollTo(0, y)
      await new Promise(r => setTimeout(r, 80))
    }
    window.scrollTo(0, 0)
    await new Promise(r => setTimeout(r, 400))
  })

  const sections = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('section.blk')).map((el, i) => {
      const r = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      const text = (el.innerText || '').replace(/\s+/g, ' ').trim()
      const imgs = Array.from(el.querySelectorAll('img')).map(im => ({
        src: im.getAttribute('src'),
        // A broken image renders as an empty box, which looks like a blank band.
        natural: im.naturalWidth,
        complete: im.complete,
      }))
      return {
        i,
        cls: el.className.replace('blk ', ''),
        tone: cs.backgroundColor,
        height: Math.round(r.height),
        top: Math.round(r.top + window.scrollY),
        textLen: text.length,
        text: text.slice(0, 110),
        imgs,
      }
    })
  })

  console.log(`${sections.length} band(s) on ${slug}\n`)
  for (const s of sections) {
    const flag = s.textLen === 0 ? '  <<< EMPTY' : s.height > 900 ? '  <<< VERY TALL' : ''
    console.log(
      `[${s.i}] ${s.cls}  h=${s.height}  top=${s.top}  text=${s.textLen}${flag}`
    )
    console.log(`     "${s.text}"`)
    for (const im of s.imgs) {
      const bad = !im.complete || im.natural === 0 ? '  <<< IMAGE NOT LOADING' : ''
      console.log(`     img src=${im.src} natural=${im.natural}${bad}`)
    }
    console.log('')
  }

  await browser.close()
})()
