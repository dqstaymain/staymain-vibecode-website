'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import {
  FileText,
  Briefcase,
  Quote,
  Users,
  Menu as MenuIcon,
  LayoutTemplate,
  ArrowRight,
  TriangleAlert,
  CircleCheck,
  Clock,
  Link2Off,
  FileWarning,
  Unlink,
} from 'lucide-react'
import { useCMS, type CMSPage, type NavItem } from '@/lib/cms'
import { flattenNav } from '@/lib/nav-tree'
import { Panel, PanelHeader, EmptyState, SectionShell } from './ui'
import {
  budgetState,
  budgetLabel,
  BUDGET_TONE,
  BUDGET_SEVERITY,
  META_TITLE_LIMIT,
  META_DESCRIPTION_LIMIT,
  type BudgetState,
} from './seo-budget'

/**
 * The screen `/admin` opens on.
 *
 * An overview rather than a section: there is no URL segment behind it, because
 * the address that reaches it is `/admin` itself. Everything it shows is counted
 * from data the workspace has already loaded - it fetches nothing of its own, so
 * arriving here costs the same round trips as arriving on any other section.
 *
 * Three questions, in the order they get asked: how much of each kind of content
 * is there, what was worked on last, and what is broken.
 */

const when = new Intl.DateTimeFormat('da-DK', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

/** Milliseconds, or null for an absent or unparseable stamp. */
function editedMs(iso?: string): number | null {
  if (!iso) return null
  const t = new Date(iso).getTime()
  return Number.isNaN(t) ? null : t
}

const pageHref = (slug: string) => `/admin/sider/${encodeURIComponent(slug)}`

/** One row of the recent-activity list, already sorted into place. */
interface RecentEdit {
  key: string
  kind: string
  title: string
  href: string
  editedAt: number
}

/** A content type to count. `href` is absent where there is nowhere to go. */
interface Count {
  label: string
  value: number
  detail?: string
  href?: string
  icon: React.ReactNode
}

/** Something wrong, with the rows that prove it and a way into each one. */
interface Finding {
  key: string
  icon: React.ReactNode
  label: string
  detail: string
  items: { key: string; title: string; href: string }[]
}

/** One page's meta title and description, judged against the length budget. */
interface SeoRow {
  slug: string
  title: string
  titleState: BudgetState
  titleLength: number
  descriptionState: BudgetState
  descriptionLength: number
  /** Worst of the two states; lower is worse. */
  rank: number
}

/**
 * One meta field's standing, as a chip.
 *
 * Reads the same in colour and in words: the count is in the admin's mono face
 * because it is a number, the verdict beside it is prose, and the border picks up
 * the verdict's colour so the row can be scanned without reading any of it.
 */
function SeoChip({
  field,
  state,
  length,
  limit,
}: {
  field: string
  state: BudgetState
  length: number
  limit: number
}) {
  return (
    <span
      className={`flex shrink-0 items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] ${
        state === 'empty' ? 'border-[var(--hairline)]' : 'border-current'
      } ${BUDGET_TONE[state]}`}
    >
      <span className="text-[var(--ink-3)]">{field}</span>
      <span className="admin-num font-medium">
        {length}/{limit}
      </span>
      <span className="font-medium">{budgetLabel(state, length, limit)}</span>
    </span>
  )
}

export function Dashboard() {
  const { pages, navigation, cases, testimonials, companyLogos, users } = useCMS()

  const { counts, recent, findings, seo, seoComplete, timestampsAvailable } = useMemo(() => {
    /* ------------------------------------------------------------ Counts -- */

    const flatNav = flattenNav(navigation)
    const subPages = pages.filter(p => p.parentSlug).length

    const counts: Count[] = [
      {
        label: 'Sider',
        value: pages.length,
        detail: subPages > 0 ? `${subPages} undersider` : undefined,
        href: '/admin/sider',
        icon: <FileText size={16} />,
      },
      { label: 'Cases', value: cases.length, href: '/admin/cases', icon: <Briefcase size={16} /> },
      {
        label: 'Kundeudtalelser',
        value: testimonials.length,
        href: '/admin/anmeldelser',
        icon: <Quote size={16} />,
      },
      {
        label: 'Firmalogoer',
        value: companyLogos.length,
        href: '/admin/logoer',
        icon: <Users size={16} />,
      },
      {
        label: 'Menupunkter',
        // Counted flattened, so a dropdown and the children inside it are all
        // rows somebody has to edit.
        value: flatNav.length,
        detail: navigation.length > 0 ? `${navigation.length} i topmenuen` : undefined,
        href: '/admin/menu',
        icon: <MenuIcon size={16} />,
      },
      // No route of its own: users are managed from the rail, where each one
      // opens its own editor. So this tile counts without pretending to link.
      { label: 'Brugere', value: users.length, icon: <Users size={16} /> },
    ]

    /* --------------------------------------------------- Recent activity -- */

    const edits: RecentEdit[] = []

    const push = (
      key: string,
      kind: string,
      title: string,
      href: string,
      editedAt: number | null
    ) => {
      if (editedAt === null) return
      edits.push({ key, kind, title, href, editedAt })
    }

    pages.forEach((p: CMSPage) =>
      push(`page:${p.slug}`, 'Side', p.title, pageHref(p.slug), editedMs(p.updatedAt))
    )
    cases.forEach(c => push(`case:${c.id}`, 'Case', c.title, '/admin/cases', editedMs(c.updatedAt)))
    testimonials.forEach(t =>
      push(`testimonial:${t.id}`, 'Udtalelse', t.name, '/admin/anmeldelser', editedMs(t.updatedAt))
    )
    companyLogos.forEach(l =>
      push(`logo:${l.id}`, 'Logo', l.name, '/admin/logoer', editedMs(l.updatedAt))
    )
    navigation.forEach((n: NavItem) =>
      push(`nav:${n.id}`, 'Menupunkt', n.label, '/admin/menu', editedMs(n.updatedAt))
    )

    edits.sort((a, b) => b.editedAt - a.editedAt)

    // Every content row loaded without a stamp, which is what the admin looks
    // like before the migration that adds them has been run.
    const anyContent = pages.length + cases.length + testimonials.length + companyLogos.length > 0

    /* --------------------------------------------------------------- SEO -- */

    // Judged with the same rules the SEO modal applies, so a page cannot be
    // "god" in the editor and "for kort" here. Every page is listed rather than
    // only the broken ones: the question is which pages are done, and a list of
    // just the problems cannot answer that.
    const seo: SeoRow[] = pages.map(p => {
      const titleLength = p.meta?.title?.trim().length ?? 0
      const descriptionLength = p.meta?.description?.trim().length ?? 0
      const title = budgetState(titleLength, META_TITLE_LIMIT)
      const description = budgetState(descriptionLength, META_DESCRIPTION_LIMIT)
      return {
        slug: p.slug,
        title: p.title,
        titleState: title,
        titleLength,
        descriptionState: description,
        descriptionLength,
        // Worst of the two, so the pages needing work sort to the top.
        rank: Math.min(BUDGET_SEVERITY[title], BUDGET_SEVERITY[description]),
      }
    })

    seo.sort((a, b) => a.rank - b.rank || a.title.localeCompare(b.title))

    const seoComplete = seo.filter(r => r.rank === BUDGET_SEVERITY.good).length

    /* ---------------------------------------------------- Needs attention -- */

    const slugs = new Set(pages.map(p => p.slug))
    const findings: Finding[] = []

    // Missing meta descriptions are not listed here: the SEO panel below says
    // which pages have one and which do not, so repeating them as a finding
    // would report the same thing twice in two places.

    // Counted without the hero: every page has one, so counting it would mean
    // no page could ever be reported as having no sections at all.
    const empty = pages.filter(p => p.blocks.filter(b => b.type !== 'hero').length === 0)
    if (empty.length) {
      findings.push({
        key: 'empty',
        icon: <FileWarning size={15} />,
        label: 'Sider uden sektioner',
        detail: 'En side uden sektioner vises tom på sitet.',
        items: empty.map(p => ({ key: p.slug, title: p.title, href: pageHref(p.slug) })),
      })
    }

    const orphans = pages.filter(p => p.parentSlug && !slugs.has(p.parentSlug))
    if (orphans.length) {
      findings.push({
        key: 'orphans',
        icon: <Unlink size={15} />,
        label: 'Sider med en forælderside, der ikke findes',
        detail: 'De kan ikke nås fra siderne, de hænger under.',
        items: orphans.map(p => ({ key: p.slug, title: p.title, href: pageHref(p.slug) })),
      })
    }

    const deadNav = flattenNav(navigation)
      .map(f => f.item)
      .filter(n => n.pageSlug && !slugs.has(n.pageSlug))
    if (deadNav.length) {
      findings.push({
        key: 'dead-nav',
        icon: <Link2Off size={15} />,
        label: 'Menupunkter, der peger på en slettet side',
        detail: 'Linket fører til en 404 på sitet.',
        items: deadNav.map(n => ({ key: n.id, title: n.label, href: '/admin/menu' })),
      })
    }

    return {
      counts,
      recent: edits.slice(0, 8),
      findings,
      seo,
      seoComplete,
      timestampsAvailable: anyContent && edits.length > 0,
    }
  }, [pages, navigation, cases, testimonials, companyLogos, users])

  const totalFindings = findings.reduce((sum, f) => sum + f.items.length, 0)
  const isEmpty = counts.every(c => c.value === 0)

  return (
    <SectionShell eyebrow="CMS" title="Oversigt" width="max-w-5xl">
      {isEmpty ? (
        <EmptyState
          icon={<FileText size={22} />}
          title="Der er ikke oprettet noget endnu"
          description="Opret din første side, så er der noget at redigere herfra."
          action={
            <Link
              href="/admin/sider/ny"
              className="inline-flex h-8 items-center rounded-md bg-[var(--ink)] px-3.5 text-[13px] font-medium text-[var(--surface)] transition-opacity hover:opacity-90"
            >
              Opret en side
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* How much of each kind there is. Where the type has a screen, the
              tile is the way into it, so the number and the navigation are the
              same click. */}
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {counts.map(c => {
              const body = (
                <>
                  <span className="flex items-center gap-2 text-[var(--ink-3)]">
                    {c.icon}
                    <span className="truncate text-[13px] font-medium">{c.label}</span>
                  </span>
                  <span className="flex items-baseline gap-2">
                    <span className="admin-num text-2xl font-semibold leading-none text-[var(--ink)]">
                      {c.value}
                    </span>
                    {c.detail && (
                      <span className="truncate text-[11px] text-[var(--ink-3)]">{c.detail}</span>
                    )}
                  </span>
                </>
              )
              return (
                <li key={c.label}>
                  {c.href ? (
                    <Link
                      href={c.href}
                      className="flex h-full flex-col justify-between gap-3 rounded-lg border border-[var(--hairline)] bg-[var(--surface)] px-4 py-3.5 transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className="flex h-full flex-col justify-between gap-3 rounded-lg border border-[var(--hairline)] bg-[var(--surface)] px-4 py-3.5">
                      {body}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* What was worked on last. */}
            <Panel>
              <PanelHeader title="Senest redigeret" />
              {timestampsAvailable ? (
                <ul className="divide-y divide-[var(--hairline)]">
                  {recent.map(edit => (
                    <li key={edit.key}>
                      <Link
                        href={edit.href}
                        className="group flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-[var(--surface-hover)]"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium text-[var(--ink)]">
                            {edit.title}
                          </span>
                          <span className="admin-num mt-0.5 block text-[11px] text-[var(--ink-3)]">
                            {edit.kind}
                          </span>
                        </span>
                        <span className="admin-num flex shrink-0 items-center gap-1.5 text-[11px] text-[var(--ink-3)]">
                          <Clock size={12} />
                          {when.format(new Date(edit.editedAt))}
                        </span>
                        <ArrowRight
                          size={14}
                          className="shrink-0 text-[var(--ink-3)] transition-transform group-hover:translate-x-0.5"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-5 py-6">
                  <p className="flex items-start gap-2 text-[13px] leading-snug text-[var(--ink-2)]">
                    <Clock size={15} className="mt-0.5 shrink-0 text-[var(--ink-3)]" />
                    <span>
                      Indholdet har ingen tidsstempler endnu. De bliver registreret, når
                      <span className="admin-num"> supabase/migrations/002_add_updated_at.sql</span>
                      er kørt i Supabase.
                    </span>
                  </p>
                </div>
              )}
            </Panel>

            {/* What is worth fixing. */}
            <Panel>
              <PanelHeader
                title="Kræver opmærksomhed"
                description={
                  totalFindings > 0
                    ? `${totalFindings} ${totalFindings === 1 ? 'ting' : 'tinger'} at se på`
                    : undefined
                }
              />
              {totalFindings === 0 ? (
                <div className="px-5 py-6">
                  <p className="flex items-start gap-2 text-[13px] leading-snug text-[var(--ink-2)]">
                    <CircleCheck size={15} className="mt-0.5 shrink-0 text-[var(--success)]" />
                    <span>Ingen tomme sider, forældresider der mangler, eller links til slettede sider.</span>
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-[var(--hairline)]">
                  {findings.map(f => (
                    <li key={f.key} className="px-5 py-3.5">
                      <p className="flex items-center gap-2 text-[13px] font-medium text-[var(--ink)]">
                        <span className="shrink-0 text-[var(--danger)]">{f.icon}</span>
                        <span>
                          {f.label}
                          <span className="admin-num ml-1.5 text-[var(--ink-3)]">{f.items.length}</span>
                        </span>
                      </p>
                      <p className="mt-1 text-[12px] leading-snug text-[var(--ink-3)]">{f.detail}</p>
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {f.items.slice(0, 6).map(item => (
                          <li key={item.key}>
                            <Link
                              href={item.href}
                              className="inline-flex max-w-[16rem] items-center gap-1 truncate rounded border border-[var(--hairline)] px-2 py-0.5 text-[12px] text-[var(--ink-2)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                            >
                              <TriangleAlert size={11} className="shrink-0" />
                              <span className="truncate">{item.title}</span>
                            </Link>
                          </li>
                        ))}
                        {f.items.length > 6 && (
                          <li className="admin-num self-center px-1 text-[11px] text-[var(--ink-3)]">
                            +{f.items.length - 6} mere
                          </li>
                        )}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          {/* Meta titles and descriptions, page by page. */}
          {seo.length > 0 && (
            <Panel>
              <PanelHeader
                title="SEO"
                description={`${seoComplete} af ${seo.length} sider har både titel og beskrivelse i en længde, Google viser hele. Sorteret efter den, der trænger mest.`}
              />
              <ul className="divide-y divide-[var(--hairline)]">
                {seo.map(row => (
                  <li key={row.slug}>
                    <Link
                      href={pageHref(row.slug)}
                      className="group flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3 transition-colors hover:bg-[var(--surface-hover)]"
                    >
                      <span className="min-w-0 flex-1 basis-40">
                        <span className="block truncate text-[13px] font-medium text-[var(--ink)]">
                          {row.title}
                        </span>
                        <span className="admin-num block truncate text-[11px] text-[var(--ink-3)]">
                          /{row.slug}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-wrap items-center gap-2">
                        <SeoChip
                          field="Titel"
                          state={row.titleState}
                          length={row.titleLength}
                          limit={META_TITLE_LIMIT}
                        />
                        <SeoChip
                          field="Beskrivelse"
                          state={row.descriptionState}
                          length={row.descriptionLength}
                          limit={META_DESCRIPTION_LIMIT}
                        />
                        <ArrowRight
                          size={14}
                          className="shrink-0 text-[var(--ink-3)] transition-transform group-hover:translate-x-0.5"
                        />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          <p className="flex items-center gap-2 text-[13px] text-[var(--ink-3)]">
            <LayoutTemplate size={14} />
            {pages.reduce(
              (sum, p) => sum + p.blocks.filter(b => b.type !== 'hero').length,
              0
            )}{' '}
            sektioner under heroen, fordelt på {pages.length} sider.
          </p>
        </div>
      )}
    </SectionShell>
  )
}
