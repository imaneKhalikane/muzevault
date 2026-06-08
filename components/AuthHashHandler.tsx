'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Detects Supabase implicit-flow tokens in the URL hash and redirects
 * appropriately. Handles two cases:
 *   - type=invite  → /reset-password (user needs to set a password)
 *   - type=recovery → /reset-password (password reset flow)
 *
 * Supabase's JS client automatically picks up the session from the hash,
 * so by the time the user reaches /reset-password they are authenticated
 * and can call updateUser({ password }).
 */
export default function AuthHashHandler() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash
    if (!hash) return

    const params = new URLSearchParams(hash.replace('#', ''))
    const type = params.get('type')
    const accessToken = params.get('access_token')

    if (accessToken && (type === 'invite' || type === 'recovery')) {
      // Clear the hash so the token isn't visible in the URL
      window.history.replaceState(null, '', window.location.pathname)
      router.replace('/reset-password')
    }
  }, [router])

  return null
}
