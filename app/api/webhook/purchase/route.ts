import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  // ── 1. Verify webhook secret ──────────────────────────────────────────────
  // Systeme.io sends the secret as a custom header: x-webhook-secret
  // Set the same value in your Systeme.io webhook settings and in .env.local
  const secret = process.env.WEBHOOK_SECRET
  const incomingSecret = req.headers.get('x-webhook-secret')

  if (!secret || incomingSecret !== secret) {
    console.warn('[webhook] Unauthorized request — secret mismatch')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 2. Parse body ─────────────────────────────────────────────────────────
  let body: { email?: string; first_name?: string; last_name?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { email, first_name, last_name } = body

  if (!email) {
    return NextResponse.json({ error: 'Missing required field: email' }, { status: 400 })
  }

  const fullName = [first_name, last_name].filter(Boolean).join(' ').trim()

  // ── 3. Create Supabase Auth user ──────────────────────────────────────────
  const supabase = createAdminClient()

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,   // mark email as confirmed so they can log in immediately
    user_metadata: {
      full_name: fullName,
      first_name: first_name ?? '',
      last_name: last_name ?? '',
    },
  })

  if (authError) {
    // If the user already exists, that's fine — just continue to upsert their profile
    if (!authError.message.toLowerCase().includes('already registered')) {
      console.error('[webhook] Auth error:', authError.message)
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }
    console.info(`[webhook] User already exists: ${email}`)
  }

  // ── 4. Upsert profile ─────────────────────────────────────────────────────
  // Use the user id from the newly created user, or look it up if they exist
  let userId = authData?.user?.id

  if (!userId) {
    // Look up the existing user by email
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existing = existingUsers?.users?.find((u) => u.email === email)
    userId = existing?.id
  }

  if (userId) {
    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: userId,
        email,
        full_name: fullName || null,
        is_admin: false,
      },
      { onConflict: 'id' }
    )

    if (profileError) {
      console.error('[webhook] Profile upsert error:', profileError.message)
      // Non-fatal — user was created in auth, profile can be backfilled
    }
  }

  // ── 5. Send a magic link so they can set their password ───────────────────
  // Optional: comment this out if you prefer users set a password manually
  await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })

  console.info(`[webhook] ✓ Purchase processed for ${email}`)
  return NextResponse.json({ success: true }, { status: 200 })
}
