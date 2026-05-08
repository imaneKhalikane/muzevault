import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  console.log('[auth/confirm] code from URL:', code ?? 'NOT FOUND')

  if (!code) {
    console.log('[auth/confirm] No code — redirecting to /login?error=expired')
    return NextResponse.redirect(`${origin}/login?error=expired`)
  }

  // Route Handlers CAN write cookies — this is the only place in
  // Next.js 14 App Router where modifying cookies is allowed outside
  // of Server Actions.
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
    console.log('[auth/confirm] exchangeCodeForSession failed:', error.message)
    return NextResponse.redirect(`${origin}/login?error=expired`)
  }

  console.log('[auth/confirm] exchangeCodeForSession succeeded — redirecting to /reset-password')
  return NextResponse.redirect(`${origin}/reset-password`)
}
