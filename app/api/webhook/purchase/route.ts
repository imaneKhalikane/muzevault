import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Systeme.io New Sale event payload shape
interface SystemePayload {
  // Nested contact object (New Sale event)
  contact?: {
    email?: string
    first_name?: string
    last_name?: string
  }
  // Flat fields (fallback / other event types)
  email?: string
  first_name?: string
  last_name?: string
  // Optional secret sent in body
  secret?: string
}

export async function POST(req: NextRequest) {
  // ── 1. Parse body first (needed for body-based secret check) ─────────────
  let body: SystemePayload
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // ── 2. Verify secret — check three locations in priority order ────────────
  //   1. x-systeme-signature header  (Systeme.io standard)
  //   2. x-secret header             (alternative header)
  //   3. secret field in body        (fallback)
  const expectedSecret = process.env.WEBHOOK_SECRET
  const incomingSecret =
    req.headers.get('x-systeme-signature') ??
    req.headers.get('x-secret') ??
    body.secret ??
    null

  if (!expectedSecret || incomingSecret !== expectedSecret) {
    console.warn('[webhook] Unauthorized — secret mismatch')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 3. Extract contact fields ─────────────────────────────────────────────
  // Systeme.io New Sale event nests contact info under `contact`
  // Fall back to flat fields for other integrations
  const email = body.contact?.email ?? body.email
  const firstName = body.contact?.first_name ?? body.first_name
  const lastName = body.contact?.last_name ?? body.last_name

  if (!email) {
    console.warn('[webhook] Missing email in payload:', JSON.stringify(body))
    return NextResponse.json({ error: 'Missing required field: email' }, { status: 400 })
  }

  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()

  console.info(`[webhook] New Sale received for: ${email}`)

  // ── 4. Create Supabase Auth user ──────────────────────────────────────────
  const supabase = createAdminClient()

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      first_name: firstName ?? '',
      last_name: lastName ?? '',
    },
  })

  if (authError) {
    // User already exists — non-fatal, continue to upsert profile
    if (!authError.message.toLowerCase().includes('already registered')) {
      console.error('[webhook] Auth createUser error:', authError.message)
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }
    console.info(`[webhook] User already exists, upserting profile: ${email}`)
  }

  // ── 5. Resolve user ID ────────────────────────────────────────────────────
  let userId = authData?.user?.id

  if (!userId) {
    const { data: listData } = await supabase.auth.admin.listUsers()
    const existing = listData?.users?.find((u) => u.email === email)
    userId = existing?.id
  }

  // ── 6. Upsert profile ─────────────────────────────────────────────────────
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
      // Non-fatal — auth user exists, profile can be backfilled
      console.error('[webhook] Profile upsert error:', profileError.message)
    }
  }

  console.info(`[webhook] ✓ Purchase processed for ${email}`)
  return NextResponse.json({ success: true }, { status: 200 })
}
