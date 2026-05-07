'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) { setError(authError.message); return }
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles').select('is_admin').eq('id', data.user.id).single()
        router.push(profile?.is_admin ? '/admin' : '/library')
        router.refresh()
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
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
          <p className="mt-6 font-heading text-2xl font-light text-[#3d2535]">Welcome back</p>
          <p className="text-[#7a5060] mt-1 text-sm font-light">Sign in to access your prompt library</p>
        </div>

        {/* Card */}
        <div className="bg-[#fff0eb] border border-[#edddd4] rounded-2xl p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#7a5060] mb-2">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-[#fdf8f5] border border-[#edddd4] rounded-xl px-4 py-3 text-[#3d2535] placeholder-[#c5adb8] focus:outline-none focus:border-[#c9829e] transition-colors text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#7a5060] mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-[#fdf8f5] border border-[#edddd4] rounded-xl px-4 py-3 text-[#3d2535] placeholder-[#c5adb8] focus:outline-none focus:border-[#c9829e] transition-colors text-sm"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gradient py-3.5 font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Signing in…</> : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#7a5060] mt-6">
          Having trouble?{' '}
          <a href="mailto:hello@studiolumai.com" className="text-[#c9829e] hover:text-[#3d2535] transition-colors">
            Contact support
          </a>
        </p>
        <div className="text-center mt-4">
          <Link href="/" className="text-sm text-[#7a5060] hover:text-[#3d2535] transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
