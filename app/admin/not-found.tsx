'use client'

import Link from 'next/link'
import { FileQuestion } from 'lucide-react'

/**
 * Shown for an unknown /admin/... path.
 *
 * Without this, Next falls back to its built-in not-found page, which renders
 * as a bare centred 404 with no way back into the admin and a 200 status that
 * would make the URL look valid to anything watching for it.
 */
export default function AdminNotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--canvas)] text-[var(--ink)]">
      <header className="flex h-14 items-center border-b border-[var(--hairline)] bg-[var(--surface)] px-5">
        <div className="flex items-baseline gap-2.5">
          <span className="text-sm font-semibold tracking-tight">StayMain</span>
          <span className="admin-eyebrow">CMS</span>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-lg border border-[var(--hairline)] bg-[var(--surface)] px-6 py-10 text-center">
          <FileQuestion size={22} className="mx-auto mb-3 text-[var(--ink-3)]" />
          <h1 className="text-[15px] font-semibold text-[var(--ink)]">Siden findes ikke</h1>
          <p className="mt-1.5 text-[13px] leading-snug text-[var(--ink-2)]">
            Adressen findes ikke i CMS&apos;et. Den kan være slettet, eller have en
            stavefejl i stien.
          </p>
          <Link
            href="/admin/sider"
            className="mt-5 inline-flex h-8 items-center rounded-md bg-[var(--ink)] px-3.5 text-[13px] font-medium text-[var(--surface)] transition-opacity hover:opacity-90"
          >
            Tilbage til sider
          </Link>
        </div>
      </div>
    </div>
  )
}
