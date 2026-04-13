'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Lock, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCMS } from '@/lib/cms'

export default function ResetPasswordPage() {
  const { generatePassword } = useCMS()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const type = searchParams.get('type')
  
  const [loading, setLoading] = useState(true)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [step, setStep] = useState<'loading' | 'new-password' | 'success' | 'error'>('loading')

  useEffect(() => {
    const handlePasswordReset = async () => {
      if (type === 'recovery' && token) {
        const { data, error } = await supabase.auth.setSession({
          access_token: token,
          refresh_token: '',
        })
        
        if (error || !data.session) {
          setStep('error')
          setError(error?.message || 'Ugyldigt eller udløbet link')
        } else {
          setStep('new-password')
        }
      } else {
        setStep('error')
        setError('Ugyldigt link')
      }
      setLoading(false)
    }

    handlePasswordReset()
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

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      setError(error.message)
      return
    }

    setSuccess(true)
    setStep('success')
  }

  const handleGeneratePassword = () => {
    const pwd = generatePassword()
    setNewPassword(pwd)
    setConfirmPassword('')
  }

  if (loading || step === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 px-4">
        <div className="text-slate-500">Loader...</div>
      </div>
    )
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Ugyldigt link</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {error || 'Dette link er ugyldigt eller er udløbet. Bed om et nyt link til nulstilling af adgangskode.'}
            </p>
            <button
              onClick={() => router.push('/admin/login')}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors"
            >
              Gå til login
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Adgangskode nulstillet!</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Din adgangskode er nu ændret. Du kan nu logge ind med din nye adgangskode.
            </p>
            <button
              onClick={() => router.push('/admin/login')}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors"
            >
              Gå til login
            </button>
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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Ny adgangskode</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Indtast din nye adgangskode
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Ny adgangskode
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                  placeholder="Min. 8 tegn"
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

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Bekræft adgangskode
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Gentag adgangskode"
                required
              />
            </div>

            <button
              type="button"
              onClick={handleGeneratePassword}
              className="w-full py-2 text-sm text-purple-500 hover:text-purple-600"
            >
              Generer tilfældig adgangskode
            </button>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors"
            >
              Gem ny adgangskode
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
