import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

interface SystemePayload {
  customer?: {
    email?: string
    fields?: {
      first_name?: string
      surname?: string
      [key: string]: unknown
    }
    [key: string]: unknown
  }
  [key: string]: unknown
}

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')

  // timingSafeEqual requires same-length buffers — guard against length mismatch
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  if (a.length !== b.length) return false

  return crypto.timingSafeEqual(a, b)
}

export async function POST(req: NextRequest) {
  // ── 1. Read raw body first (required for HMAC) ────────────────────────────
  const rawBody = await req.text()

  // ── 2. Verify HMAC SHA256 signature ──────────────────────────────────────
  const secret = process.env.WEBHOOK_SECRET

  if (!secret) {
    // Fallback: skip check if secret is not configured (for testing)
    console.warn('[webhook] ⚠️  WEBHOOK_SECRET not set — skipping signature check')
  } else {
    const signature = req.headers.get('x-webhook-signature') ?? ''

    if (!signature) {
      console.warn('[webhook] Missing x-webhook-signature header')
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }

    if (!verifySignature(rawBody, signature, secret)) {
      console.warn('[webhook] Signature mismatch — unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.info('[webhook] ✓ Signature verified')
  }

  // ── 3. Parse body ─────────────────────────────────────────────────────────
  let body: SystemePayload
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // ── 4. Extract customer fields ────────────────────────────────────────────
  const email = body.customer?.email
  const firstName = body.customer?.fields?.first_name
  const lastName = body.customer?.fields?.surname
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()

  console.info(`[webhook] New Sale — email: ${email} | name: ${fullName}`)

  if (!email) {
    console.warn('[webhook] No email found in payload')
    return NextResponse.json({ error: 'Missing email in payload' }, { status: 400 })
  }

  // ── 5. Create Supabase Auth user (uses SUPABASE_SERVICE_ROLE_KEY) ─────────
  let supabase
  try {
    supabase = createAdminClient()
  } catch (err) {
    console.error('[webhook] Failed to init Supabase admin client:', err)
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

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
    console.info(`[webhook] ✓ Auth user created: ${email}`)
  }

  // ── 6. Upsert profile ─────────────────────────────────────────────────────
  let userId = authData?.user?.id
  if (!userId) {
    const { data: listData } = await supabase.auth.admin.listUsers()
    userId = listData?.users?.find((u) => u.email === email)?.id
  }

  if (userId) {
    const { error: profileError } = await supabase.from('profiles').upsert(
      { id: userId, email, is_admin: false },
      { onConflict: 'id' }
    )
    if (profileError) {
      console.error('[webhook] Profile upsert error:', profileError.message)
    } else {
      console.info(`[webhook] ✓ Profile upserted: ${email}`)
    }
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
