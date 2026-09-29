'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  FileText,
  Plus,
  AlertTriangle,
  LayoutTemplate,
  ChevronRight,
  Search,
  ChevronLeft,
} from 'lucide-react'
import { useCMS, type CMSPage } from '@/lib/cms'
import { Button, EmptyState, Input, Select, SectionShell } from '@/app/admin/ui'
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  matchesPage,
  paginate,
  pageWindow,
} from './page-list'

/**
 * The page library: every page in the CMS, and the way into each one.
 *
 * Pages used to live in a collapsible tree in the rail, which meant the editor
 * was one click away but every page shared a single screen's worth of rail
 * space and there was nowhere to stand back and see the whole set. They now get
 * their own route, and each one opens the editor at `/admin/sider/[slug]`.
 *
 * The list lives here rather than in its route because it is shown twice: on
 * `/admin`, which is the workspace opening on its first screen, and on
 * `/admin/sider`, which is the same list reached directly. Neither host owns it.
 *
 * Searching and paging are in ./page-list, which is plain logic and asserted by
 * scripts/test-page-list.ts.
 */

export function PageLibrary() {
  const { pages } = useCMS()
  const router = useRouter()
  const [term, setTerm] = useState('')
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [pageIndex, setPageIndex] = useState(1)

  const childrenOf = (parentSlug?: string) =>
    pages
      .filter(p => p.parentSlug === parentSlug)
      .sort((a, b) => a.title.localeCompare(b.title))

  // Home leads, then alphabetical. The old rail hard-coded 'ydelser' second,
  // which quietly put a page above the ones people actually edit.
  const roots = useMemo(
    () =>
      pages
        .filter(p => !p.parentSlug)
        .sort((a, b) => {
          if (a.slug === 'home') return -1
          if (b.slug === 'home') return 1
          return a.title.localeCompare(b.title)
        }),
    [pages]
  )

  /**
   * Pagination counts top-level pages, and each one brings its whole subtree.
   *
   * The alternative - flattening the tree and cutting the list into equal rows -
   * puts a child on a page with its parent on the previous one, at every
   * boundary. That reads as a bug, and the library's whole job is to show the
   * shape of the site. The cost is the one case this gets wrong: a single root
   * with more children than a page holds is still one entry on one page.
   */
  const filtered = useMemo(
    () => roots.filter(p => matchesPage(p, term)),
    [roots, term]
  )

  // Clamped inside paginate, so the window is valid even on the render before
  // the reset below lands.
  const { current, pageCount, visible } = paginate(filtered, pageIndex, pageSize)

  /** A page and everything under it, so the counts can be honest. */
  const rowsShown = (root: CMSPage): number =>
    1 + childrenOf(root.slug).reduce((sum, child) => sum + rowsShown(child), 0)

  const shownRows = visible.reduce((sum, root) => sum + rowsShown(root), 0)
  const childCount = pages.length - roots.length
  const filtering = term.trim().length > 0
  const numbers = pageWindow(current, pageCount)

  const blocksOf = (slug: string) =>
    pages.find(p => p.slug === slug)?.blocks.length ?? 0

  const row = (slug: string, title: string, depth: number) => {
    const parentExists = depth > 0 && !pages.some(p => p.slug === pages.find(x => x.slug === slug)?.parentSlug)
    return (
      <li key={slug}>
        <Link
          href={`/admin/sider/${encodeURIComponent(slug)}`}
          className="group flex items-center gap-3 rounded-lg border border-[var(--hairline)] bg-[var(--surface)] px-3.5 py-3 transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
          style={{ marginLeft: depth * 20 }}
        >
          <FileText size={15} className="shrink-0 text-[var(--ink-3)]" />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="truncate text-[13px] font-medium text-[var(--ink)]">
                {title}
              </span>
              {parentExists && (
                <span
                  className="shrink-0 text-[var(--danger)]"
                  title="Forældreside mangler"
                  aria-label="Forældreside mangler"
                >
                  <AlertTriangle size={12} />
                </span>
              )}
            </span>
            <span className="admin-num mt-0.5 block truncate text-[11px] text-[var(--ink-3)]">
              /{slug} · {blocksOf(slug)} sektioner
            </span>
          </span>
          <ChevronRight
            size={15}
            className="shrink-0 text-[var(--ink-3)] transition-transform group-hover:translate-x-0.5"
          />
        </Link>

        {childrenOf(slug).map(child => row(child.slug, child.title, depth + 1))}
      </li>
    )
  }

  return (
    <SectionShell
      eyebrow="Indhold"
      title="Sider"
      width="max-w-none"
      actions={
        <Button variant="primary" onClick={() => router.push('/admin/sider/ny')}>
          <Plus size={15} />
          Ny side
        </Button>
      }
    >
      {/* Search and page size sit above the list, in the same frame, so the
          controls that shape the list are part of it rather than floating. */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <label
            htmlFor="page-search"
            className="mb-1.5 block text-[13px] font-medium leading-none text-[var(--ink-2)]"
          >
            Søg
          </label>
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-3)]"
            />
            <Input
              id="page-search"
              type="search"
              value={term}
              onChange={e => {
                setTerm(e.target.value)
                // The list just changed shape under the reader; staying on page
                // 3 of a list that now has one page shows them nothing at all.
                setPageIndex(1)
              }}
              placeholder="Titel eller sti"
              // Not `pl-8`: the base class wins that and the icon ends up on top
              // of the text. See .admin-input[data-leading-icon].
              data-leading-icon="search"
            />
          </div>
        </div>
        <div className="w-[9.5rem]">
          <label
            htmlFor="page-size"
            className="mb-1.5 block text-[13px] font-medium leading-none text-[var(--ink-2)]"
          >
            Sider pr. side
          </label>
          <Select
            id="page-size"
            value={pageSize}
            onChange={e => {
              setPageSize(Number(e.target.value))
              setPageIndex(1)
            }}
          >
            {PAGE_SIZE_OPTIONS.map(size => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {roots.length === 0 ? (
        <EmptyState
          icon={<FileText size={22} />}
          title="Ingen sider endnu"
          description="Opret den første side for at komme i gang."
          action={
            <Button variant="secondary" onClick={() => router.push('/admin/sider/ny')}>
              <Plus size={15} />
              Ny side
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search size={22} />}
          title="Ingen sider matcher"
          description={`Der er ingen sider med "${term.trim()}". Søg på titel eller sti.`}
          action={
            <Button variant="secondary" onClick={() => setTerm('')}>
              Ryd søgning
            </Button>
          }
        />
      ) : (
        <ul className="space-y-1.5">
          {visible.map(p => row(p.slug, p.title, 0))}
        </ul>
      )}

      {roots.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[13px] text-[var(--ink-3)]">
          {/* Says what is on screen rather than only how many exist, because
              with a search running those are different numbers. */}
          <p className="flex items-center gap-2">
            <LayoutTemplate size={14} />
            {filtering ? (
              <>
                Viser {shownRows} af {pages.length} sider
                {filtered.length !== visible.length && ` · ${filtered.length} i søgeresultatet`}
              </>
            ) : (
              <>
                {pages.length} sider
                {childCount > 0 && `, heraf ${childCount} undersider`}
              </>
            )}
          </p>
          <p>Klik på en side for at åbne dens sektioner.</p>
        </div>
      )}

      {/* Paging controls. Hidden entirely when there is nothing to page through,
          rather than shown disabled: a row of dead buttons is noise. */}
      {pageCount > 1 && (
        <nav
          aria-label="Sidesider"
          className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--hairline)] pt-4"
        >
          <p className="admin-num text-[11px] text-[var(--ink-3)]">
            Side {current} af {pageCount}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPageIndex(Math.max(1, current - 1))}
              disabled={current === 1}
            >
              <ChevronLeft size={15} />
              Forrige
            </Button>
            {numbers.map((n, i) =>
              n === 'gap' ? (
                // Not a button: it jumps nowhere, and a control that does nothing
                // is worse than no control.
                <span key={`gap-${i}`} className="admin-num px-1 text-[12px] text-[var(--ink-3)]">
                  …
                </span>
              ) : (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPageIndex(n)}
                  aria-current={n === current ? 'page' : undefined}
                  aria-label={`Gå til side ${n}`}
                  className={`admin-num h-8 min-w-8 rounded-md px-2 text-[12px] font-medium transition-colors ${
                    n === current
                      ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                      : 'text-[var(--ink-2)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  {n}
                </button>
              )
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPageIndex(Math.min(pageCount, current + 1))}
              disabled={current === pageCount}
            >
              Næste
              <ChevronRight size={15} />
            </Button>
          </div>
        </nav>
      )}
    </SectionShell>
  )
}
