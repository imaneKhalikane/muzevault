import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import PromptsTable from './PromptsTable'

export const dynamic = 'force-dynamic'

export default async function AdminPrompts() {
  const supabase = createClient()
  const { data: prompts } = await supabase
    .from('prompts')
    .select('*, category:categories(name)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl font-light text-[#3d2535]">Prompts</h1>
        <Link href="/admin/prompts/new" className="btn-gradient flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white">
          <Plus className="h-4 w-4" />
          Add New Prompt
        </Link>
      </div>

      <PromptsTable prompts={prompts ?? []} />
    </div>
  )
}
