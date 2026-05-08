'use client'

// Client component — only rendered after the server has already
// exchanged the code for a session and written it into cookies.
// All it needs to do is call updateUser({ password }).

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordForm() {
  const router = useRouter()
  const [stage, setStage] = useState<'form' | 'success'>('form')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  const inputClass =
    'w-full bg-[#fdf8f5] border border-[#edddd4] rounded-xl px-4 py-3 text-[#3d2535] placeholder-[#c5adb8] focus:outline-none focus:border-[#c9829e] transition-colors text-sm'

  useEffect(() => {
    if (stage === 'success') {
      const timer = setTimeout(() => router.push('/library'), 2000)
      return () => clearTimeout(timer)
    }
  }, [stage, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setFormError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setFormError(error.message)
        return
      }
      setStage('success')
    } catch {
      setFormError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (stage === 'success') {
    return (
      <div className="min-h-screen bg-[#fdf8f5] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <Link href="/" className="inline-block">
              <h1 className="font-heading text-3xl font-semibold text-[#3d2535]">Studio LumAI</h1>
              <div className="site-subtitle mt-1">AI Creator Vault</div>
            </Link>
          </div>
          <div className="bg-[#fff0eb] border border-[#edddd4] rounded-2xl p-8 text-center">
            <div className="h-14 w-14 rounded-full bg-[#c9829e]/15 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="h-7 w-7 text-[#c9829e]" />
            </div>
            <h2 className="font-heading text-2xl font-light text-[#3d2535] mb-2">
              Password updated!
            </h2>
            <p className="text-sm text-[#7a5060] font-light">
              Redirecting you to your vault…
            </p>
            <div className="mt-4 flex justify-center">
              <Loader2 className="h-4 w-4 text-[#c9829e] animate-spin" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fdf8f5] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <h1 className="font-heading text-3xl font-semibold text-[#3d2535]">Studio LumAI</h1>
            <div className="site-subtitle mt-1">AI Creator Vault</div>
          </Link>
        </div>

        <div className="text-center mb-8">
          <p className="font-heading text-2xl font-light text-[#3d2535]">Set a new password</p>
          <p className="text-[#7a5060] mt-1 text-sm font-light">
            Choose a strong password for your account
          </p>
        </div>

        <div className="bg-[#fff0eb] border border-[#edddd4] rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#7a5060] mb-2">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Minimum 8 characters"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#7a5060] mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="Repeat your password"
                className={inputClass}
              />
            </div>

            {formError && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gradient py-3.5 font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" />Updating…</>
                : 'Update Password'}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <Link href="/login" className="text-sm text-[#7a5060] hover:text-[#3d2535] transition-colors">
            ← Back to sign in
          </Link>
        </div>

      </div>
    </div>
  )
}
