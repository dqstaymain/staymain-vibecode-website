/**
 * How long a meta title and description are allowed to be.
 *
 * Shared by the SEO modal and the dashboard, because "good length" has to mean
 * the same thing in both places: a title the modal shows as fine and a title the
 * dashboard reports as short are the same title, and two rules for one thing
 * would drift apart the first time either was changed.
 *
 * The limits are pixel budgets, not hard rules: Google cuts a title at roughly
 * 580px and a description at roughly 920px, which lands near 60 and 160
 * characters for ordinary text. Characters are the approximation every CMS shows,
 * because a pixel measurement needs a rendered font and an actual SERP.
 *
 * Kept free of `'use client'` and of any component, so both the client
 * components and a server route can read it.
 */

export const META_TITLE_LIMIT = 60
export const META_DESCRIPTION_LIMIT = 160

export type BudgetState = 'empty' | 'short' | 'good' | 'near' | 'over'

/**
 * `short` is here because the question is not only "did it get cut off" but "is
 * it a good length". A five-character title fits comfortably and is still a bad
 * title, and on a two-state scale it looked exactly like a good one. `good` is a
 * state in its own right rather than the absence of a warning.
 */
export function budgetState(length: number, limit: number): BudgetState {
  if (length === 0) return 'empty'
  if (length > limit) return 'over'
  // The last tenth still fits, but Google is close to cutting it.
  if (length >= limit - Math.round(limit * 0.1)) return 'near'
  // Under half the budget leaves most of the space unused.
  if (length < Math.round(limit * 0.5)) return 'short'
  return 'good'
}

/** Text colour per state, so the modal and the dashboard never disagree. */
export const BUDGET_TONE: Record<BudgetState, string> = {
  empty: 'text-[var(--ink-3)]',
  short: 'text-[var(--warning)]',
  good: 'text-[var(--success)]',
  near: 'text-[var(--warning)]',
  over: 'text-[var(--danger)]',
}

/**
 * The state in words.
 *
 * Colour alone says nothing to anyone who cannot see it, so every state that
 * means something is also spelled out. Callers decide whether an empty field has
 * anything worth saying: the modal stays quiet, the dashboard calls it missing.
 */
export function budgetLabel(state: BudgetState, length: number, limit: number): string {
  switch (state) {
    case 'empty':
      return 'mangler'
    case 'short':
      return 'for kort'
    case 'good':
      return 'god'
    case 'near':
      return 'tæt på grænsen'
    case 'over':
      return `${length - limit} for meget`
  }
}

/** Worst state first, so the pages needing work sort above the finished ones. */
export const BUDGET_SEVERITY: Record<BudgetState, number> = {
  over: 0,
  empty: 1,
  short: 2,
  near: 3,
  good: 4,
}
