/**
 * Searching and paging the page library.
 *
 * Split out from the component so it can be asserted without a browser. Neither
 * of these is hard to write and easy to get quietly wrong: a filter that folds
 * accents the wrong way round silently fails to find a Danish page, and paging
 * maths that does not clamp leaves the reader staring at an empty screen after a
 * search narrows the list under them.
 *
 * No React and no Next imports, so this stays plain logic.
 */

/** Two pages in twenty is a long scroll; a hundred is a page of noise. */
export const DEFAULT_PAGE_SIZE = 20
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

/** The minimum a page can be titled. Enough to separate what the UI shows. */
export interface SearchablePage {
  title: string
  slug: string
}

/**
 * Letters that survive NFD intact, and have to be mapped by hand.
 *
 * NFD splits an accented letter into a base letter and a combining mark, so å
 * becomes a + U+030A and the mark-strip below deals with it. ø and æ are not
 * written that way: they are single letters in their own right, not a base plus
 * a mark, so nothing splits them and stripping marks cannot help. On a Danish
 * site that is two of the three letters people type - "spørgsmål" was unfindable
 * by "spor", and no amount of Unicode normalisation would have fixed it.
 *
 * Short on purpose: only the ones that actually survive normalisation. Adding
 * ö or ü here would be dead code, because those two do decompose.
 */
const UNDECOMPOSABLE: Record<string, string> = {
  ø: 'o',
  æ: 'ae',
  ß: 'ss',
}

/**
 * Lower-cases and strips accents, so a search matches the way the site is written.
 *
 * Both sides go through the same folding, so "spor" finds "spørgsmål", "maler"
 * finds "Måler", and "maalerudstyr" is found by either spelling.
 */
function fold(value: string): string {
  const stripped = value
    .toLowerCase()
    .normalize('NFD')
    // The combining marks NFD leaves behind. Nothing else is touched, so letters
    // outside Latin-1 survive as themselves.
    .replace(/[\u0300-\u036f]/g, '')

  return stripped.replace(/[øæß]/g, c => UNDECOMPOSABLE[c] ?? c)
}

/** Matches a term against a page's title or its path. */
export function matchesPage(page: SearchablePage, term: string): boolean {
  const needle = fold(term.trim())
  if (!needle) return true
  return fold(page.title).includes(needle) || fold(page.slug).includes(needle)
}

export interface PageWindow<T> {
  /** 1-based, always within 1..pageCount. */
  current: number
  pageCount: number
  visible: T[]
}

/**
 * One page of `items`, with the requested page clamped into range.
 *
 * Clamping happens here rather than in an effect that corrects the state after
 * the fact: an effect renders the out-of-range page first, so the reader sees an
 * empty list flash before it recovers. The result is still a valid window on
 * every call, whatever the caller passes in.
 */
export function paginate<T>(items: T[], pageIndex: number, pageSize: number): PageWindow<T> {
  const size = Math.max(1, Math.floor(pageSize) || 1)
  const pageCount = Math.max(1, Math.ceil(items.length / size))
  const current = Math.min(Math.max(1, Math.floor(pageIndex) || 1), pageCount)
  return {
    current,
    pageCount,
    visible: items.slice((current - 1) * size, current * size),
  }
}

/**
 * The page numbers to offer, as a window around where the reader is.
 *
 * Always includes the first and last page so the ends stay reachable, with the
 * middle collapsed to ellipses once there are more pages than are worth showing.
 */
export function pageWindow(current: number, pageCount: number): (number | 'gap')[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1)

  const out: (number | 'gap')[] = [1]
  const from = Math.max(2, current - 1)
  const to = Math.min(pageCount - 1, current + 1)

  if (from > 2) out.push('gap')
  for (let n = from; n <= to; n++) out.push(n)
  if (to < pageCount - 1) out.push('gap')
  out.push(pageCount)

  return out
}
