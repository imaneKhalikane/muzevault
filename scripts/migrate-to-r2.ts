// @ts-nocheck
/**
 * One-time migration: Supabase Storage → Cloudflare R2
 *
 * Run with:  npm run migrate-to-r2
 *
 * What it does:
 *  1. Fetches all prompts whose image_url or video_url still point to Supabase
 *  2. Downloads each file from Supabase, uploads it to R2
 *  3. Updates the database record with the new R2 URL
 *  4. Prints a progress line for every prompt and a summary at the end
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import ws from 'ws'

// ── Env vars ──────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const R2_ENDPOINT = process.env.R2_ENDPOINT!
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!
const R2_BUCKET = process.env.R2_BUCKET_NAME ?? 'solene-vault'

for (const [name, val] of Object.entries({ SUPABASE_URL, SUPABASE_SERVICE_KEY, R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_URL })) {
  if (!val) { console.error(`❌ Missing env var: ${name}`); process.exit(1) }
}

// ── Clients ───────────────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  realtime: { transport: ws },
})

const r2 = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function isSupabaseUrl(url: string | null | undefined): boolean {
  return !!url && url.includes('supabase')
}

/** Download a URL and return its bytes + content-type */
async function downloadFile(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} when downloading ${url}`)
  const contentType = res.headers.get('content-type') ?? 'application/octet-stream'
  const buffer = Buffer.from(await res.arrayBuffer())
  return { buffer, contentType }
}

/** Upload a buffer to R2 and return the public URL */
async function uploadToR2(buffer: Buffer, fileName: string, contentType: string): Promise<string> {
  const key = `migrated-${Date.now()}-${Math.random().toString(36).slice(2)}-${fileName}`

  await r2.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }))

  console.log('  └─ Uploaded to R2 with key:', key)
  return `${R2_PUBLIC_URL}/${key}`
}

/** Guess a file extension from a URL or content-type */
function guessExtension(url: string, contentType: string): string {
  const fromUrl = url.split('?')[0].split('.').pop()?.slice(0, 5)
  if (fromUrl && /^[a-z0-9]+$/.test(fromUrl)) return fromUrl
  const map: Record<string, string> = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
    'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm',
  }
  return map[contentType] ?? 'bin'
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface Prompt {
  id: string
  title: string
  image_url: string | null
  video_url: string | null
}

interface FailedPrompt {
  id: string
  title: string
  reason: string
}

async function main() {
  console.log('🔍 Fetching prompts with Supabase storage URLs…\n')

  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('id, title, image_url, video_url')
    .order('created_at', { ascending: true })

  if (error) { console.error('❌ Failed to fetch prompts:', error.message); process.exit(1) }
  if (!prompts || prompts.length === 0) { console.log('✅ No prompts found.'); return }

  // Filter to only prompts that still have Supabase URLs
  const toMigrate = (prompts as Prompt[]).filter(
    (p) => isSupabaseUrl(p.image_url) || isSupabaseUrl(p.video_url)
  )

  if (toMigrate.length === 0) {
    console.log('✅ All prompts already migrated to R2. Nothing to do.')
    return
  }

  console.log(`Found ${toMigrate.length} prompt(s) to migrate out of ${prompts.length} total.\n`)
  console.log('─'.repeat(60))

  let success = 0
  const failed: FailedPrompt[] = []

  for (let i = 0; i < toMigrate.length; i++) {
    const p = toMigrate[i]
    const num = `${i + 1}/${toMigrate.length}`
    console.log(`\n[${num}] "${p.title}" (${p.id})`)

    const updates: { image_url?: string; video_url?: string } = {}

    // ── Migrate image ──────────────────────────────────────────────────
    if (isSupabaseUrl(p.image_url)) {
      try {
        console.log('  ├─ Downloading image from Supabase…')
        const { buffer, contentType } = await downloadFile(p.image_url!)
        const ext = guessExtension(p.image_url!, contentType)
        const r2Url = await uploadToR2(buffer, `image.${ext}`, contentType)
        updates.image_url = r2Url
        console.log('  ├─ image_url ✅')
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err)
        console.error(`  ├─ image FAILED: ${reason}`)
        failed.push({ id: p.id, title: p.title, reason: `image: ${reason}` })
        continue // skip to next prompt — don't update DB with partial data
      }
    }

    // ── Migrate video (optional) ───────────────────────────────────────
    if (isSupabaseUrl(p.video_url)) {
      try {
        console.log('  ├─ Downloading video from Supabase…')
        const { buffer, contentType } = await downloadFile(p.video_url!)
        const ext = guessExtension(p.video_url!, contentType)
        const r2Url = await uploadToR2(buffer, `video.${ext}`, contentType)
        updates.video_url = r2Url
        console.log('  ├─ video_url ✅')
      } catch (err) {
        // Video failure is non-fatal — still update image_url if that succeeded
        const reason = err instanceof Error ? err.message : String(err)
        console.warn(`  ├─ video FAILED (non-fatal): ${reason}`)
      }
    }

    // ── Update DB ──────────────────────────────────────────────────────
    if (Object.keys(updates).length > 0) {
      const { error: updateErr } = await supabase
        .from('prompts')
        .update(updates)
        .eq('id', p.id)

      if (updateErr) {
        console.error(`  └─ DB update FAILED: ${updateErr.message}`)
        failed.push({ id: p.id, title: p.title, reason: `db: ${updateErr.message}` })
      } else {
        success++
        console.log(`  └─ ✅ Migrated ${num}: "${p.title}"`)
      }
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60))
  console.log(`Migration complete: ${success} success, ${failed.length} failed`)

  if (failed.length > 0) {
    console.log('\nFailed prompts (retry manually):')
    for (const f of failed) {
      console.log(`  • [${f.id}] "${f.title}" — ${f.reason}`)
    }
  }

  console.log('═'.repeat(60) + '\n')
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
