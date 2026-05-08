'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loader2, ArrowLeft } from 'lucide-react'

type View = 'login' | 'forgot' | 'forgot-sent'

export default function LoginPage() {
  const router = useRouter()
  const [view, setView] = useState<View>('login')

  // Login state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // Forgot password state
  const [resetEmail, setResetEmail] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetLoading, setResetLoading] = useState(false)

  const inputClass =
    'w-full bg-[#fdf8f5] border border-[#edddd4] rounded-xl px-4 py-3 text-[#3d2535] placeholder-[#c5adb8] focus:outline-none focus:border-[#c9829e] transition-colors text-sm'

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) { setLoginError(authError.message); return }
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles').select('is_admin').eq('id', data.user.id).single()
        router.push(profile?.is_admin ? '/admin' : '/library')
        router.refresh()
      }
    } catch {
      setLoginError('An unexpected error occurred. Please try again.')
    } finally {
      setLoginLoading(false)
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setResetError('')
    setResetLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: 'https://muzevault.studiolumai.com/reset-password',
      })
      if (error) { setResetError(error.message); return }
      setView('forgot-sent')
    } catch {
      setResetError('Something went wrong. Please try again.')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fdf8f5] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <h1 className="font-heading text-3xl font-semibold text-[#3d2535]">Studio LumAI</h1>
            <div className="site-subtitle mt-1">AI Creator Vault</div>
          </Link>
        </div>

        {/* ── LOGIN VIEW ── */}
        {view === 'login' && (
          <>
            <div className="text-center mb-8">
              <p className="font-heading text-2xl font-light text-[#3d2535]">Welcome back</p>
              <p className="text-[#7a5060] mt-1 text-sm font-light">Sign in to access your prompt library</p>
            </div>

            <div className="bg-[#fff0eb] border border-[#edddd4] rounded-2xl p-8">
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#7a5060] mb-2">Email address</label>
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    required placeholder="you@example.com" className={inputClass}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-[#7a5060]">Password</label>
                    <button
                      type="button"
                      onClick={() => { setResetEmail(email); setView('forgot') }}
                      className="text-xs text-[#c9829e] hover:text-[#3d2535] transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <input
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    required placeholder="••••••••" className={inputClass}
                  />
                </div>

                {loginError && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                    {loginError}
                  </div>
                )}

                <button
                  type="submit" disabled={loginLoading}
                  className="w-full btn-gradient py-3.5 font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loginLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Signing in…</> : 'Sign In'}
                </button>
              </form>
            </div>

            <p className="text-center text-sm text-[#7a5060] mt-6">
              Having trouble?{' '}
              <a href="mailto:contact@studiolumai.com" className="text-[#c9829e] hover:text-[#3d2535] transition-colors">
                Contact support
              </a>
            </p>
            <div className="text-center mt-4">
              <Link href="/" className="text-sm text-[#7a5060] hover:text-[#3d2535] transition-colors">
                ← Back to home
              </Link>
            </div>
          </>
        )}

        {/* ── FORGOT PASSWORD VIEW ── */}
        {view === 'forgot' && (
          <>
            <div className="text-center mb-8">
              <p className="font-heading text-2xl font-light text-[#3d2535]">Reset your password</p>
              <p className="text-[#7a5060] mt-1 text-sm font-light">
                Enter your email and we&apos;ll send you a reset link
              </p>
            </div>

            <div className="bg-[#fff0eb] border border-[#edddd4] rounded-2xl p-8">
              <form onSubmit={handleReset} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#7a5060] mb-2">Email address</label>
                  <input
                    type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)}
                    required placeholder="you@example.com" className={inputClass}
                  />
                </div>

                {resetError && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                    {resetError}
                  </div>
                )}

                <button
                  type="submit" disabled={resetLoading}
                  className="w-full btn-gradient py-3.5 font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {resetLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Sending…</> : 'Send Reset Link'}
                </button>
              </form>
            </div>

            <button
              onClick={() => setView('login')}
              className="flex items-center gap-1.5 mx-auto mt-6 text-sm text-[#7a5060] hover:text-[#3d2535] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to sign in
            </button>
          </>
        )}

        {/* ── CONFIRMATION VIEW ── */}
        {view === 'forgot-sent' && (
          <>
            <div className="bg-[#fff0eb] border border-[#edddd4] rounded-2xl p-8 text-center">
              <div className="h-14 w-14 rounded-full bg-[#c9829e]/15 flex items-center justify-center mx-auto mb-5">
                <span className="text-2xl">✉️</span>
              </div>
              <h2 className="font-heading text-2xl font-light text-[#3d2535] mb-3">Check your inbox!</h2>
              <p className="text-sm text-[#7a5060] font-light leading-relaxed">
                We&apos;ve sent a password reset link to{' '}
                <span className="font-medium text-[#3d2535]">{resetEmail}</span>.
                <br />
                Check your spam folder if you don&apos;t see it.
              </p>
            </div>

            <button
              onClick={() => setView('login')}
              className="flex items-center gap-1.5 mx-auto mt-6 text-sm text-[#7a5060] hover:text-[#3d2535] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to sign in
            </button>
          </>
        )}

      </div>
    </div>
  )
}
