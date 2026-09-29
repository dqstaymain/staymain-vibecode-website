'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileText, Plus, AlertTriangle, LayoutTemplate, ChevronRight, ArrowLeft } from 'lucide-react'
import { useCMS } from '@/lib/cms'
import { Button, EmptyState, IconButton, SectionShell } from '@/app/admin/ui'

/**
 * The page library.
 *
 * Pages used to live in a collapsible tree in the rail, which meant the editor
 * was one click away but every page shared a single screen's worth of rail
 * space and there was nowhere to stand back and see the whole set. They now get
 * their own route, and each one opens the editor at `/admin/sider/[slug]`.
 */
export default function SiderPage() {
  const { pages, isAuthenticated, supabaseReady } = useCMS()
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // `isAuthenticated` is derived from the signed-in user, so it is false on
    // the first render of a hard load. Redirecting before the session check has
    // finished bounced visitors to /admin/login, which then sent them to
    // /admin and threw away the route they asked for.
    if (!supabaseReady) return
    if (!isAuthenticated) {
      router.push('/admin/login')
      return
    }
    setIsReady(true)
  }, [supabaseReady, isAuthenticated, router])

  if (!isAuthenticated || !isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-[var(--ink-2)]">Indlæser...</div>
      </div>
    )
  }

  const childrenOf = (parentSlug?: string) =>
    pages
      .filter(p => p.parentSlug === parentSlug)
      .sort((a, b) => a.title.localeCompare(b.title))

  // Home leads, then alphabetical. The old rail hard-coded 'ydelser' second,
  // which quietly put a page above the ones people actually edit.
  const roots = pages
    .filter(p => !p.parentSlug)
    .sort((a, b) => {
      if (a.slug === 'home') return -1
      if (b.slug === 'home') return 1
      return a.title.localeCompare(b.title)
    })

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
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <header className="flex h-14 items-center justify-between gap-4 border-b border-[var(--hairline)] bg-[var(--surface)] px-6">
        <div className="flex items-baseline gap-2.5">
          <span className="text-sm font-semibold tracking-tight">StayMain</span>
          <span className="admin-eyebrow">CMS</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Not "back to content": /admin now redirects here, so that link
              would land on this page again. The site itself is the useful
              way out. */}
          <Link
            href="/"
            className="inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium text-[var(--ink-2)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
          >
            <ArrowLeft size={14} />
            Tilbage til sitet
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl px-6 py-10">
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
          ) : (
            <ul className="space-y-1.5">
              {roots.map(page => row(page.slug, page.title, 0))}
            </ul>
          )}

          <p className="mt-6 flex items-center gap-2 text-[13px] text-[var(--ink-3)]">
            <LayoutTemplate size={14} />
            Klik på en side for at åbne dens sektioner.
          </p>
        </SectionShell>
      </div>
    </div>
  )
}
