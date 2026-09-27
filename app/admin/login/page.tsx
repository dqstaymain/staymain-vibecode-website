'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ArrowLeft, Mail, TriangleAlert, Check } from 'lucide-react'
import { useCMS } from '@/lib/cms'
import { Button, Field, Input, Panel, ErrorNote } from '../ui'
import { AuthShell } from '../auth-shell'

export default function LoginPage() {
  const { login, isAuthenticated, requestPasswordReset, supabaseReady } = useCMS()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/admin')
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(email, password)
    if (result.success) {
      router.push('/admin')
    } else {
      setError(result.error || 'Der opstod en fejl')
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await requestPasswordReset(resetEmail)
    setLoading(false)
    if (result.success) {
      setResetSent(true)
    } else {
      setError(result.error || 'Der opstod en fejl')
    }
  }

  const backToLogin = () => {
    setShowForgotPassword(false)
    setResetSent(false)
    setResetEmail('')
    setError('')
  }

  /* ---------------------------------------------------------------- Setup -- */

  if (!supabaseReady) {
    return (
      <AuthShell>
        <Panel>
          <div className="flex items-start gap-3 border-b border-[var(--hairline)] px-5 py-4">
            <TriangleAlert size={17} className="mt-0.5 shrink-0 text-[var(--danger)]" />
            <div>
              <h1 className="text-sm font-semibold text-[var(--ink)]">Database ikke forbundet</h1>
              <p className="mt-1 text-[13px] leading-snug text-[var(--ink-3)]">
                CMS&apos;t kan ikke nå Supabase. Sæt credentialsne op for at fortsætte.
              </p>
            </div>
          </div>
          <ol className="space-y-2.5 px-5 py-5">
            {[
              'Opret en gratis konto på supabase.com',
              'Opret et nyt projekt',
              'Kopiér Project URL og anon key fra Settings → API',
              'Opret en .env.local med credentialsne',
            ].map((step, i) => (
              <li key={step} className="flex gap-3 text-[13px] leading-snug text-[var(--ink-2)]">
                {/* The numbers are the point here: these steps are ordered. */}
                <span className="admin-num w-4 shrink-0 text-[var(--ink-3)]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </Panel>
      </AuthShell>
    )
  }

  /* --------------------------------------------------------- Reset flow -- */

  if (showForgotPassword) {
    return (
      <AuthShell>
        <Panel>
          <div className="border-b border-[var(--hairline)] px-5 py-4">
            <button
              onClick={backToLogin}
              className="-ml-1 mb-3 inline-flex items-center gap-1.5 rounded px-1 py-0.5 text-[13px] font-medium text-[var(--ink-3)] transition-colors hover:text-[var(--ink)]"
            >
              <ArrowLeft size={14} />
              Tilbage til login
            </button>
            <p className="admin-eyebrow mb-1.5">Adgangskode</p>
            <h1 className="text-sm font-semibold text-[var(--ink)]">Nulstil din adgangskode</h1>
            <p className="mt-1 text-[13px] leading-snug text-[var(--ink-3)]">
              {resetSent
                ? 'Tjek din mail for linket.'
                : 'Vi sender dig et link, du kan bruge til at vælge en ny adgangskode.'}
            </p>
          </div>

          <div className="px-5 py-5">
            {resetSent ? (
              <div className="space-y-4">
                <div className="flex items-start gap-2.5 rounded-md border border-[var(--hairline)] bg-[var(--surface-sunken)] px-3 py-2.5">
                  <Check size={15} className="mt-0.5 shrink-0 text-[var(--success)]" />
                  <p className="text-[13px] leading-snug text-[var(--ink-2)]">
                    Vi har sendt et link til <span className="font-medium">{resetEmail}</span>. Det
                    er gyldigt i en time.
                  </p>
                </div>
                <Button variant="primary" className="w-full" onClick={backToLogin}>
                  Tilbage til login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <Field label="Email" htmlFor="reset-email">
                  <Input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    placeholder="din@email.dk"
                    required
                  />
                </Field>

                {error && <ErrorNote>{error}</ErrorNote>}

                <Button type="submit" variant="primary" disabled={loading} className="w-full">
                  <Mail size={15} />
                  {loading ? 'Sender…' : 'Send nulstillingslink'}
                </Button>
              </form>
            )}
          </div>
        </Panel>
      </AuthShell>
    )
  }

  /* --------------------------------------------------------------- Login -- */

  return (
    <AuthShell>
      <Panel>
        <div className="border-b border-[var(--hairline)] px-5 py-5">
          <p className="admin-eyebrow mb-2">StayMain CMS</p>
          <h1 className="text-[15px] font-semibold leading-tight text-[var(--ink)]">Log ind</h1>
          <p className="mt-1 text-[13px] leading-snug text-[var(--ink-3)]">
            Indholdet på dit site redigeres her.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5" aria-busy={loading}>
          <Field label="Email" htmlFor="login-email">
            <Input
              id="login-email"
              type="email"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@staymain.dk"
              required
            />
          </Field>

          <div className="space-y-1.5">
            {/* The recovery link sits with the field it belongs to, which is
                where people look for it. */}
            <div className="flex items-baseline justify-between gap-3">
              <label
                htmlFor="login-password"
                className="block text-[13px] font-medium leading-none text-[var(--ink-2)]"
              >
                Adgangskode
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="rounded text-[13px] font-medium text-[var(--accent)] transition-opacity hover:opacity-75"
              >
                Glemt adgangskode?
              </button>
            </div>
            <div className="relative">
              <Input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Skjul adgangskode' : 'Vis adgangskode'}
                aria-pressed={showPassword}
                className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[var(--ink-3)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Errors are announced, not just shown. */}
          <div aria-live="polite">{error && <ErrorNote>{error}</ErrorNote>}</div>

          <Button type="submit" variant="primary" disabled={loading} className="w-full">
            {loading ? 'Logger ind…' : 'Log ind'}
          </Button>
        </form>
      </Panel>

      <p className="mt-5 text-center text-[13px] text-[var(--ink-3)]">
        <a
          href="/"
          className="rounded font-medium transition-colors hover:text-[var(--ink-2)]"
        >
          Tilbage til sitet
        </a>
      </p>
    </AuthShell>
  )
}
