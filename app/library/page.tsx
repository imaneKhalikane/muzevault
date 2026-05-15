import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LibraryClient from '@/components/library/LibraryClient'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function LibraryPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: categories }, { data: prompts }] = await Promise.all([
    supabase.from('categories').select('*').order('name'),
    supabase.from('prompts').select('*, category:categories(*)').order('created_at', { ascending: false }),
  ])

  async function handleSignOut() {
    'use server'
    const sb = createClient()
    await sb.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-[#fdf8f5]">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-[#edddd4] bg-[#fdf8f5]/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/library">
            <span className="font-heading text-lg font-semibold text-[#3d2535]">Solène</span>
            <div className="site-subtitle">AI Creator Vault</div>
          </Link>
          <form action={handleSignOut}>
            <button type="submit" className="text-sm text-[#7a5060] hover:text-[#3d2535] transition-colors font-medium">
              Sign out
            </button>
          </form>
        </div>
      </nav>

      <LibraryClient categories={categories ?? []} prompts={prompts ?? []} />
    </div>
  )
}
