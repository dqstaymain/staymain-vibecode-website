import { test, expect, type Page, type Locator } from '@playwright/test'

/**
 * Regression tests for admin media uploads.
 *
 * The media API itself was always healthy: a signed-in POST /api/media returns
 * 200 and a file URL. What broke was the browser path. The upload handler was
 * copy-pasted into six components and the copies had drifted - the two that back
 * the media picker and the logo editor never sent an Authorization header, so the
 * API answered 401. Because those handlers read `data.file` off the response
 * without checking `res.ok`, a rejection looked byte-for-byte like a success: the
 * file was chosen, no error appeared, and the field stayed empty.
 *
 * These drive the real UI. Type checking, the build and a route sweep all pass
 * straight over a missing request header, so only a browser catches it.
 */

const CREDENTIALS = require('./auth.cjs').loadEnvCredentials()
const testAuth = CREDENTIALS ? test : test.skip

/** 1x1 transparent PNG - small, valid, and a real image to the API's checks. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
)

/**
 * Confirms the saved session actually applied.
 *
 * Waiting for the admin shell alone is not enough: the shell paints before the
 * client-side auth check has finished, so on an expired session the page renders
 * the admin and is then thrown back to /admin/login a moment later. Asserting
 * the login form is absent closes that window, and failing here says "the
 * session expired", not "the upload is broken".
 */
async function signIn(page: Page) {
  await page.goto('/admin/menu')
  await expect(page.locator('aside').first()).toBeVisible({ timeout: 30_000 })
  await expect(page.locator('#login-email')).toHaveCount(0)
}

/** The media library is a top-level admin section with its own route. */
const LIBRARY = '/admin/mediebibliotek'

/**
 * Every file this spec uploads starts with this, so cleanup can identify its
 * own uploads by name instead of assuming the library contains nothing else.
 */
const PROBE_PREFIX = 'medialibprobe-'

/**
 * Asserts no upload error banner is showing.
 *
 * Scoped to [data-upload-error] rather than role="alert", because Next's own
 * route announcer is a role="alert" element that is always on the page.
 */
function expectNoUploadError(scope: Page | Locator) {
  return expect(scope.locator('[data-upload-error]')).toHaveCount(0)
}

/**
 * Reads a count only once it has stopped moving.
 *
 * Both the library and the picker fetch their file list asynchronously, so a
 * count taken the instant the UI appears can be 0 while the real list is still
 * loading - which makes "did this upload add a card?" compare against a baseline
 * that was never true.
 */
async function settledCount(cards: Locator): Promise<number> {
  let previous = -1
  await expect
    .poll(
      async () => {
        const current = await cards.count()
        const stable = current === previous
        previous = current
        return stable ? current : -1
      },
      { timeout: 20_000, intervals: [250, 250, 250, 250, 250, 250, 250, 250] }
    )
    .toBeGreaterThanOrEqual(0)
  return previous
}

test.describe('media library upload', () => {
  testAuth('uploading an image shows it in the library', async ({ page }) => {
    await signIn(page)
    await page.goto(LIBRARY)
    await expect(page.getByText('Upload filer')).toBeVisible({ timeout: 20_000 })

    // The API suffixes the stored name (`<base>-<timestamp>-<rand>.<ext>`) so a
    // re-upload cannot clobber the live asset. Earlier runs leave their own
    // uploads behind, so count this prefix and require it to grow by exactly one
    // rather than looking for any particular file.
    const cards = page.locator(`img[alt^="${PROBE_PREFIX}"]`)
    const before = await settledCount(cards)

    await page.setInputFiles('input[type="file"]', {
      name: `${PROBE_PREFIX}upload.png`,
      mimeType: 'image/png',
      buffer: PNG,
    })

    // The card must appear without a reload, proving the authenticated request
    // succeeded rather than being swallowed into a silent no-op.
    await expect.poll(() => cards.count(), { timeout: 20_000 }).toBe(before + 1)
    await expectNoUploadError(page)

    // Do not leave the file behind.
    await purgeProbes(page)
  })

  testAuth('an unsupported file surfaces an error instead of failing silently', async ({
    page,
  }) => {
    await signIn(page)
    await page.goto(LIBRARY)
    await expect(page.getByText('Upload filer')).toBeVisible({ timeout: 20_000 })

    await page.setInputFiles('input[type="file"]', {
      name: 'not-media.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('plain text'),
    })

    // The old code caught nothing and checked nothing, so this used to be a
    // no-op with no feedback whatsoever.
    await expect(page.locator('[data-upload-error]')).toBeVisible({ timeout: 20_000 })
  })
})

/**
 * Probe-file helpers, shared by the delete and layout specs.
 *
 * Scoped to the module because both the bulk-delete and grid-layout tests need
 * to upload files and clean up after themselves, and a cleanup only one of them
 * can reach is a cleanup that will drift.
 */

/**
 * Narrows the grid to this suite's own files, using the library's search.
 *
 * The first version of the cleanup pressed "Vælg alle" and then "Slet valgte",
 * assuming the library held nothing but this suite's probe files. It held the
 * real site images too, so it deleted the user's media - eleven files,
 * recoverable only from git. A helper that widens the blast radius to whatever
 * happens to be on screen is not a cleanup step.
 *
 * Searching first means the only files reachable by "select all" are the ones
 * this spec uploaded, and `assertOnlyProbesVisible` re-checks that before any
 * destructive click rather than trusting the filter to have held.
 */
async function showOnlyProbes(page: Page) {
  const search = page.getByRole('textbox', { name: 'Søg efter filer' })
  await search.fill(PROBE_PREFIX)
  // Wait for the grid to re-render on the filtered set.
  await expect
    .poll(async () => {
      const cards = page.locator('[data-media-item]')
      const total = await cards.count()
      const probes = await cards
        .filter({ has: page.locator(`img[alt^="${PROBE_PREFIX}"]`) })
        .count()
      return { total, probes }
    }, { timeout: 20_000 })
    .toEqual({ total: expect.any(Number), probes: expect.any(Number) })

  await assertOnlyProbesVisible(page)
}

/** Fails loudly rather than deleting anything it did not upload. */
async function assertOnlyProbesVisible(page: Page) {
  const cards = page.locator('[data-media-item]')
  const total = await cards.count()
  if (total === 0) return
  const probes = await cards
    .filter({ has: page.locator(`img[alt^="${PROBE_PREFIX}"]`) })
    .count()
  if (probes !== total) {
    throw new Error(
      `refusing to delete: ${probes} probe files among ${total} visible library ` +
        'files. The media library contains files this suite did not create.'
    )
  }
}

/** Deletes the visible probe files, and only those. */
async function purgeProbes(page: Page) {
  await showOnlyProbes(page)

  const box = page.getByRole('checkbox', { name: /Vælg alle/ })
  if (!(await box.count())) return
  if (!(await page.locator('[data-media-item]').count())) return

  await assertOnlyProbesVisible(page)
  await box.check()
  const bar = page.getByRole('region', { name: 'Valgte filer' })
  await expect(bar).toBeVisible()
  await bar.getByRole('button', { name: 'Slet valgte' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Slet' }).click()
  await expect(bar).toHaveCount(0, { timeout: 20_000 })

  // Leave the search box as it was found.
  await page.getByRole('textbox', { name: 'Søg efter filer' }).fill('')
}

/** Uploads throwaway files and returns their stored names. */
async function seed(page: Page, count: number): Promise<string[]> {
  await purgeProbes(page)
  const names: string[] = []
  for (let i = 0; i < count; i++) {
    const base = `${PROBE_PREFIX}${i}.png`
    await page.setInputFiles('input[type="file"]', {
      name: base,
      mimeType: 'image/png',
      buffer: PNG,
    })
    // Wait for this one to land, or the next upload races the list update.
    const card = page.locator(`img[alt^="${PROBE_PREFIX}${i}-"]`).first()
    await expect(card).toBeVisible({ timeout: 20_000 })
    names.push((await card.getAttribute('alt'))!)
  }
  return names
}

test.describe('bulk selection and delete', () => {
  testAuth('selects several files and deletes them together', async ({ page }) => {
    await signIn(page)
    await page.goto(LIBRARY)
    await expect(page.getByText('Upload filer')).toBeVisible({ timeout: 20_000 })

    const seeded = await seed(page, 3)
    try {
      // seed leaves the search box filtering to the probe files. Clear it, so
      // "select all" has the whole library in front of it and selecting three
      // of them is genuinely partial - which is the state worth asserting.
      await page.getByRole('textbox', { name: 'Søg efter filer' }).fill('')
      await expect
        .poll(() => page.locator('[data-media-item]').count(), { timeout: 20_000 })
        .toBeGreaterThan(3)

      // The bulk bar must stay out of the way until something is picked.
      await expect(page.getByRole('region', { name: 'Valgte filer' })).toHaveCount(0)

      for (const name of seeded) {
        await page.getByRole('checkbox', { name: `Vælg ${name}` }).check()
      }

      const bar = page.getByRole('region', { name: 'Valgte filer' })
      await expect(bar).toBeVisible()
      await expect(bar.getByText('3 valgte filer')).toBeVisible()

      // "Select all" reads as partially applied, not done.
      const selectAll = page.getByRole('checkbox', { name: /Vælg alle/ })
      await expect(selectAll).not.toBeChecked()
      expect(
        await selectAll.evaluate((el: HTMLInputElement) => el.indeterminate),
        'partially selected means indeterminate'
      ).toBe(true)

      await bar.getByRole('button', { name: 'Slet valgte' }).click()

      // Destructive and irreversible, so it asks first, and says how many.
      const confirm = page.getByRole('dialog')
      await expect(confirm).toBeVisible()
      await expect(confirm.getByText('Slet 3 filer?')).toBeVisible()
      await confirm.getByRole('button', { name: 'Slet' }).click()

      // Every selected file is gone from the grid.
      for (const name of seeded) {
        await expect(page.locator(`img[alt="${name}"]`)).toHaveCount(0)
      }
      // And the selection is cleared, not left pointing at deleted files.
      await expect(page.getByRole('region', { name: 'Valgte filer' })).toHaveCount(0)
    } finally {
      // These tests delete real files, so remove anything left behind.
      await purgeProbes(page)
    }
  })

  testAuth('select all picks every file on screen, then clears', async ({ page }) => {
    await signIn(page)
    await page.goto(LIBRARY)
    await expect(page.getByText('Upload filer')).toBeVisible({ timeout: 20_000 })

    const seeded = await seed(page, 2)
    try {
      const total = await page.locator('[data-media-item]').count()

      const selectAll = page.getByRole('checkbox', { name: /Vælg alle/ })
      await selectAll.check()

      const bar = page.getByRole('region', { name: 'Valgte filer' })
      await expect(bar).toBeVisible()
      await expect(bar.getByText(`${total} valgte filer`)).toBeVisible()
      await expect(selectAll).toBeChecked()

      // Clearing the selection must not delete anything.
      await bar.getByRole('button', { name: 'Ryd valg' }).click()
      await expect(bar).toHaveCount(0)
      for (const name of seeded) {
        await expect(page.locator(`img[alt="${name}"]`)).toBeVisible()
      }
    } finally {
      await purgeProbes(page)
    }
  })

  testAuth('cancelling the confirmation deletes nothing', async ({ page }) => {
    await signIn(page)
    await page.goto(LIBRARY)
    await expect(page.getByText('Upload filer')).toBeVisible({ timeout: 20_000 })

    const seeded = await seed(page, 1)
    const name = seeded[0]

    await page.getByRole('checkbox', { name: `Vælg ${name}` }).check()
    await page
      .getByRole('region', { name: 'Valgte filer' })
      .getByRole('button', { name: 'Slet valgte' })
      .click()

    const confirm = page.getByRole('dialog')
    await expect(confirm).toBeVisible()
    await confirm.getByRole('button', { name: 'Annuller' }).click()

    await expect(confirm).toHaveCount(0)
    await expect(page.locator(`img[alt="${name}"]`)).toBeVisible()

    // Leave the library as it was found.
    await page.getByRole('checkbox', { name: `Vælg ${name}` }).uncheck()
  })
})

test.describe('media grid layout', () => {
  testAuth('shows five items per row on a wide screen', async ({ page }) => {
    await signIn(page)
    await page.setViewportSize({ width: 1600, height: 1000 })
    await page.goto(LIBRARY)
    await expect(page.getByText('Upload filer')).toBeVisible({ timeout: 20_000 })

    const items = page.locator('[data-media-item]')
    await expect(items.first()).toBeVisible({ timeout: 20_000 })

    // Enough rows to prove a wrap, from this suite's own files only. Six is the
    // minimum that distinguishes five-per-row from four-per-row.
    const created = await seed(page, 6)
    try {
      const boxes = []
      for (let i = 0; i < 6; i++) {
        const box = await items.nth(i).boundingBox()
        if (!box) throw new Error(`item ${i + 1} not laid out`)
        boxes.push(box)
      }

      // Five per row means the first five share a baseline and the sixth wraps.
      for (let i = 1; i < 5; i++) {
        expect(
          Math.abs(boxes[i].y - boxes[0].y),
          `item ${i + 1} sits on the same row as item 1`
        ).toBeLessThan(2)
      }
      expect(boxes[5].y, 'item 6 wrapped to a second row').toBeGreaterThan(boxes[0].y + 10)

      // Having wrapped, it is back at the left edge rather than still beside
      // item 1 - the difference from a four-wide grid, where item 6 would be
      // the second item of the second row.
      expect(
        Math.abs(boxes[5].x - boxes[0].x),
        'item 6 wrapped back to the left edge'
      ).toBeLessThan(12)
      expect(
        Math.abs(boxes[1].x - boxes[0].x),
        'item 2 sits to the right of item 1'
      ).toBeGreaterThan(12)

      expect(created.length, 'six probe files were measured').toBe(6)
    } finally {
      await purgeProbes(page)
    }
  })
})

test.describe('media picker from a block editor', () => {
  testAuth('opening a block editor and uploading through the picker works', async ({ page }) => {
    await signIn(page)
    await page.goto('/admin/sider/home')
    const blockRow = page.locator('[data-block-row]').first()
    await expect(blockRow).toBeVisible({ timeout: 20_000 })

    await blockRow.locator('[role="button"]').first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 20_000 })

    const mediaPickerButton = page
      .getByRole('button', { name: /^Vælg (billede|baggrundsbillede|baggrundsvideo)$/ })
      .first()

    if ((await mediaPickerButton.count()) === 0) {
      test.skip(true, 'this block type has no media field')
    }

    await mediaPickerButton.click()

    // The picker is the modal whose upload handler dropped the auth header.
    const picker = page.getByRole('dialog').last()
    await expect(picker.getByText('Mediebibliotek')).toBeVisible({ timeout: 20_000 })

    const cards = picker.locator(`img[alt^="${PROBE_PREFIX}"]`)
    const before = await settledCount(cards)

    await picker.locator('input[type="file"]').setInputFiles({
      name: `${PROBE_PREFIX}picker.png`,
      mimeType: 'image/png',
      buffer: PNG,
    })

    await expect.poll(() => cards.count(), { timeout: 20_000 }).toBe(before + 1)
    await expectNoUploadError(picker)
  })

  /**
   * The picker's own probe file, removed on the library screen.
   *
   * Separate from the shared `purgeProbes` because the upload happened in the
   * picker's modal, not on the library page, so the library has to be loaded
   * fresh before its grid can be searched and cleaned.
   */
  testAuth('removes the probe file the picker uploaded', async ({ page }) => {
    await signIn(page)
    await page.goto(LIBRARY)
    await expect(page.getByText('Upload filer')).toBeVisible({ timeout: 20_000 })
    await purgeProbes(page)
  })
})
