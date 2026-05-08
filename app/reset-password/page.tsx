// Server component — runs on the server where both the ?code= param
// and the PKCE code_verifier cookie are available in the same request.
// This is the only way to reliably exchange the code: the verifier
// was stored in cookies by createBrowserClient (@supabase/ssr) when
// resetPasswordForEmail() was called, and the server reads both at once.

import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import Link from 'next/link'
import ResetPasswordForm from './ResetPasswordForm'

function Logo() {
  return (
    <div className="text-center mb-10">
      <Link href="/" className="inline-block">
        <h1 className="font-heading text-3xl font-semibold text-[#3d2535]">Studio LumAI</h1>
        <div className="site-subtitle mt-1">AI Creator Vault</div>
      </Link>
    </div>
  )
}

function InvalidLink() {
  return (
    <div className="min-h-screen bg-[#fdf8f5] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Logo />
        <div className="bg-[#fff0eb] border border-[#edddd4] rounded-2xl p-8 text-center">
          <p className="text-sm text-red-500 mb-6">
            This reset link has expired or already been used. Please request a new one.
          </p>
          <Link
            href="/login"
            className="btn-gradient inline-block px-6 py-3 text-sm font-semibold text-white"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { code?: string }
}) {
  const code = searchParams.code
  console.log('[reset-password] code from URL:', code ?? 'NOT FOUND')

  if (!code) {
    console.log('[reset-password] No code in URL — showing invalid link')
    return <InvalidLink />
  }

  // Build a server-side Supabase client that reads & writes cookies.
  // The PKCE code_verifier was stored in cookies by createBrowserClient
  // when the user submitted the forgot-password form — it's available here.
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cookieStore.set(name, value, options as any)
          )
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.log('[reset-password] exchangeCodeForSession failed:', error.message)
    return <InvalidLink />
  }

  console.log('[reset-password] exchangeCodeForSession succeeded — rendering form')
  return <ResetPasswordForm />
}
