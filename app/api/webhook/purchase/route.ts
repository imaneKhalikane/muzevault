import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface SystemePayload {
  contact?: {
    email?: string
    first_name?: string
    last_name?: string
  }
  email?: string
  first_name?: string
  last_name?: string
  secret?: string
  [key: string]: unknown // allow logging of any extra fields
}

export async function POST(req: NextRequest) {
  // ── LOG ALL HEADERS ───────────────────────────────────────────────────────
  const headers: Record<string, string> = {}
  req.headers.forEach((value, key) => { headers[key] = value })
  console.log('[webhook] ===== INCOMING REQUEST =====')
  console.log('[webhook] Headers:', JSON.stringify(headers, null, 2))

  // ── PARSE & LOG BODY ──────────────────────────────────────────────────────
  let body: SystemePayload = {}
  try {
    body = await req.json()
    console.log('[webhook] Body:', JSON.stringify(body, null, 2))
  } catch (err) {
    console.log('[webhook] Failed to parse JSON body:', err)
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // ── SECRET CHECK DISABLED ─────────────────────────────────────────────────
  // TODO: re-enable once we confirm what Systeme.io sends
  console.log('[webhook] Secret check DISABLED — skipping auth')

  // ── EXTRACT CONTACT FIELDS ────────────────────────────────────────────────
  const email = body.contact?.email ?? body.email
  const firstName = body.contact?.first_name ?? body.first_name
  const lastName = body.contact?.last_name ?? body.last_name
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()

  console.log('[webhook] Extracted — email:', email, '| name:', fullName)

  if (!email) {
    console.warn('[webhook] No email found in payload — skipping user creation')
    return NextResponse.json({ received: true, warning: 'No email in payload' }, { status: 200 })
  }

  // ── CREATE SUPABASE USER ──────────────────────────────────────────────────
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
    if (!authError.message.toLowerCase().includes('already registered')) {
      console.error('[webhook] Auth createUser error:', authError.message)
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }
    console.info(`[webhook] User already exists: ${email}`)
  } else {
    console.info(`[webhook] ✓ Auth user created for: ${email}`)
  }

  // ── UPSERT PROFILE ────────────────────────────────────────────────────────
  let userId = authData?.user?.id
  if (!userId) {
    const { data: listData } = await supabase.auth.admin.listUsers()
    userId = listData?.users?.find((u) => u.email === email)?.id
  }

  if (userId) {
    const { error: profileError } = await supabase.from('profiles').upsert(
      { id: userId, email, full_name: fullName || null, is_admin: false },
      { onConflict: 'id' }
    )
    if (profileError) {
      console.error('[webhook] Profile upsert error:', profileError.message)
    } else {
      console.info(`[webhook] ✓ Profile upserted for: ${email}`)
    }
  }

  console.log('[webhook] ===== DONE =====')
  return NextResponse.json({ success: true }, { status: 200 })
}
