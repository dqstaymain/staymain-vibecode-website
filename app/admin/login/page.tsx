'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, ArrowLeft, Mail } from 'lucide-react'
import { useCMS } from '@/lib/cms'

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
    }
    setLoading(false)
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await requestPasswordReset(resetEmail)
    if (result.success) {
      setResetSent(true)
    } else {
      setError(result.error || 'Der opstod en fejl')
    }
    setLoading(false)
  }

  if (!supabaseReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Supabase ikke konfigureret</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Databaseforbindelsen er ikke opsat endnu. Følg instruktionerne i README for at konfigurere Supabase.
            </p>
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 text-left">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">1. Opret en gratis Supabase konto på supabase.com</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">2. Opret et nyt projekt</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">3. Kopier Project URL og anon key fra Settings → API</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">4. Opret en .env.local fil med credentialsne</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
            <button
              onClick={() => { setShowForgotPassword(false); setResetSent(false); setResetEmail(''); setError('') }}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6"
            >
              <ArrowLeft size={18} />
              Tilbage til login
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Nulstil adgangskode</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                {resetSent 
                  ? 'Tjek din mail for at nulstille adgangskoden'
                  : 'Indtast din email og vi sender dig et link til at nulstille din adgangskode'}
              </p>
            </div>

            {resetSent ? (
              <div className="text-center">
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Vi har sendt et link til <strong>{resetEmail}</strong>. 
                  Linket er gyldigt i 1 time.
                </p>
                <button
                  onClick={() => { setShowForgotPassword(false); setResetSent(false); setResetEmail('') }}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors"
                >
                  Tilbage til login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="din@email.dk"
                    required
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  {loading ? 'Sender...' : 'Send nulstillingslink'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">StayMain CMS</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Log ind for at redigere indhold</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="admin@staymain.dk"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Adgangskode
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Logger ind...' : 'Log ind'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                Glemt adgangskode?
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
