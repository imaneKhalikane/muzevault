// @ts-nocheck
/**
 * One-time migration: Old Supabase → New Supabase
 *
 * PRE-REQUISITE: Run the schema SQL in the new project's SQL editor first.
 *
 * Run with:  npm run migrate-supabase
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

// ── Old project ───────────────────────────────────────────────────────────
const OLD_URL = 'https://jsgfwirdjfvatulansif.supabase.co'
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzZ2Z3aXJkamZ2YXR1bGFuc2lmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE0ODI3NywiZXhwIjoyMDkzNzI0Mjc3fQ.dXUGwoN2snY9SKdpcpVdg44Ybs8pDV5j1ktU293t5Cc'

// ── New project ───────────────────────────────────────────────────────────
const NEW_URL = 'https://gmzsytvifstquaidwczi.supabase.co'
const NEW_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtenN5dHZpZnN0cXVhaWR3Y3ppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDg5NjI2MSwiZXhwIjoyMDk2NDcyMjYxfQ.OjytQAoPhvNEg7AjBAhgMwcqsb4dfwXf0qTZy4i414M'

const oldDb = createClient(OLD_URL, OLD_KEY, { realtime: { transport: ws } })
const newDb = createClient(NEW_URL, NEW_KEY, { realtime: { transport: ws } })

async function main() {
  console.log('🚀 Starting Supabase data migration\n')

  // ── 1. Verify new project has tables ─────────────────────────────────────
  const { error: checkErr } = await newDb.from('categories').select('id').limit(1)
  if (checkErr) {
    console.error('❌ New project tables not found. Did you run the schema SQL first?')
    console.error('   Error:', checkErr.message)
    process.exit(1)
  }

  // ── 2. Migrate categories (preserve IDs) ─────────────────────────────────
  console.log('📂 Migrating categories...')
  const { data: categories, error: catErr } = await oldDb.from('categories').select('*').order('name')
  if (catErr) { console.error('❌ Failed to read categories:', catErr.message); process.exit(1) }

  const { error: catInsertErr } = await newDb.from('categories').upsert(categories!, { onConflict: 'id' })
  if (catInsertErr) { console.error('❌ Failed to insert categories:', catInsertErr.message); process.exit(1) }
  console.log(`  ✅ ${categories!.length} categories migrated\n`)

  // ── 3. Migrate prompts in batches ─────────────────────────────────────────
  console.log('📋 Reading prompts from old project...')
  const { data: prompts, error: promptErr } = await oldDb
    .from('prompts')
    .select('*')
    .order('created_at', { ascending: true })

  if (promptErr) { console.error('❌ Failed to read prompts:', promptErr.message); process.exit(1) }
  console.log(`  Found ${prompts!.length} prompts — inserting in batches of 50...\n`)

  const BATCH = 50
  let success = 0
  let failed = 0

  for (let i = 0; i < prompts!.length; i += BATCH) {
    const batch = prompts!.slice(i, i + BATCH)
    const { error: batchErr } = await newDb.from('prompts').upsert(batch, { onConflict: 'id' })

    if (batchErr) {
      console.error(`  ❌ Batch ${Math.floor(i / BATCH) + 1} failed: ${batchErr.message}`)
      failed += batch.length
    } else {
      success += batch.length
      console.log(`  ✅ ${success} / ${prompts!.length} prompts migrated`)
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60))
  console.log(`Done: ${success} prompts migrated, ${failed} failed`)
  console.log(`      ${categories!.length} categories migrated`)
  console.log('═'.repeat(60) + '\n')
}

main().catch((err) => { console.error('Unexpected error:', err); process.exit(1) })
