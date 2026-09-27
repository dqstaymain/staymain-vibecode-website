'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, TriangleAlert, Check, Dices, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCMS } from '@/lib/cms'
import { Button, Field, Input, Panel, ErrorNote } from '../ui'
import { AuthShell } from '../auth-shell'

type Step = 'loading' | 'new-password' | 'success' | 'error'

export default function ResetPasswordPage() {
  const { generatePassword } = useCMS()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const type = searchParams.get('type')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<Step>('loading')

  useEffect(() => {
    let cancelled = false

    const establishSession = async () => {
      if (type !== 'recovery' || !token) {
        if (!cancelled) {
          setError('Ugyldigt link')
          setStep('error')
        }
        return
      }
      const { data, error: sessionError } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: '',
      })
      if (cancelled) return
      if (sessionError || !data.session) {
        setError('Ugyldigt eller udløbet link')
        setStep('error')
      } else {
        setStep('new-password')
      }
    }

    establishSession()
    return () => {
      cancelled = true
    }
  }, [token, type])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 8) {
      setError('Adgangskoden skal være mindst 8 tegn')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Adgangskoderne matcher ikke')
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    if (updateError) {
      setError(updateError.message)
      return
    }
    setStep('success')
  }

  const handleGeneratePassword = () => {
    setNewPassword(generatePassword())
    // Confirmation is cleared because it can no longer match; leaving a stale
    // value behind would submit a mismatched pair.
    setConfirmPassword('')
    setShowPassword(true)
    setError('')
  }

  /* -------------------------------------------------------------- Loading -- */

  if (step === 'loading') {
    return (
      <AuthShell>
        <div className="flex items-center justify-center gap-2 py-8 text-[13px] text-[var(--ink-3)]">
          <Loader2 size={15} className="animate-spin" />
          Indlæser…
        </div>
      </AuthShell>
    )
  }

  /* ---------------------------------------------------------------- Error -- */

  if (step === 'error') {
    return (
      <AuthShell>
        <Panel>
          <div className="flex items-start gap-3 border-b border-[var(--hairline)] px-5 py-4">
            <TriangleAlert size={17} className="mt-0.5 shrink-0 text-[var(--danger)]" />
            <div>
              <h1 className="text-sm font-semibold text-[var(--ink)]">Linket virker ikke</h1>
              <p className="mt-1 text-[13px] leading-snug text-[var(--ink-3)]">
                {error || 'Linket er ugyldigt eller udløbet.'}
              </p>
            </div>
          </div>
          <div className="px-5 py-5">
            <p className="text-[13px] leading-relaxed text-[var(--ink-2)]">
              Bed om et nyt link fra login-siden. Linket er kun gyldigt i en time.
            </p>
            <Button variant="primary" className="mt-4 w-full" onClick={() => router.push('/admin/login')}>
              Gå til login
            </Button>
          </div>
        </Panel>
      </AuthShell>
    )
  }

  /* -------------------------------------------------------------- Success -- */

  if (step === 'success') {
    return (
      <AuthShell>
        <Panel>
          <div className="flex items-start gap-3 border-b border-[var(--hairline)] px-5 py-4">
            <Check size={17} className="mt-0.5 shrink-0 text-[var(--success)]" />
            <div>
              <h1 className="text-sm font-semibold text-[var(--ink)]">Adgangskoden er ændret</h1>
              <p className="mt-1 text-[13px] leading-snug text-[var(--ink-3)]">
                Du kan logge ind med din nye adgangskode.
              </p>
            </div>
          </div>
          <div className="px-5 py-5">
            <Button variant="primary" className="w-full" onClick={() => router.push('/admin/login')}>
              Gå til login
            </Button>
          </div>
        </Panel>
      </AuthShell>
    )
  }

  /* -------------------------------------------------------- New password -- */

  return (
    <AuthShell>
      <Panel>
        <div className="border-b border-[var(--hairline)] px-5 py-5">
          <p className="admin-eyebrow mb-2">Adgangskode</p>
          <h1 className="text-[15px] font-semibold leading-tight text-[var(--ink)]">Vælg en ny adgangskode</h1>
          <p className="mt-1 text-[13px] leading-snug text-[var(--ink-3)]">
            Mindst 8 tegn. Brug den også næste gang du logger ind.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          <Field label="Ny adgangskode" htmlFor="new-password">
            <div className="relative">
              <Input
                id="new-password"
                name="new-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Mindst 8 tegn"
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
          </Field>

          <Field
            label="Bekræft adgangskode"
            htmlFor="confirm-password"
            hint={confirmPassword && confirmPassword !== newPassword ? 'Matcher ikke' : undefined}
          >
            <Input
              id="confirm-password"
              name="confirm-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Gentag adgangskoden"
              required
            />
          </Field>

          <button
            type="button"
            onClick={handleGeneratePassword}
            className="inline-flex items-center gap-1.5 rounded text-[13px] font-medium text-[var(--accent)] transition-opacity hover:opacity-75"
          >
            <Dices size={14} />
           Generer en tilfældig adgangskode
          </button>

          <div aria-live="polite">{error && <ErrorNote>{error}</ErrorNote>}</div>

          <Button type="submit" variant="primary" className="w-full">
            Gem ny adgangskode
          </Button>
        </form>
      </Panel>
    </AuthShell>
  )
}
