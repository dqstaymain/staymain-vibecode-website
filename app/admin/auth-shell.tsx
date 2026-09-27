'use client'

/**
 * Shared frame for every unauthenticated screen (login, password reset).
 *
 * Deliberately narrow and centred — a login has one job. The wordmark keeps the
 * same voice as the admin top bar so the two read as one product.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--canvas)] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-5 flex items-baseline justify-center gap-2.5">
          <span className="text-sm font-semibold tracking-tight text-[var(--ink)]">StayMain</span>
          <span className="admin-eyebrow">CMS</span>
        </div>
        {children}
      </div>
    </div>
  )
}
