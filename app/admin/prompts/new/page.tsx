import { createClient } from '@/lib/supabase/server'
import PromptForm from '@/components/admin/PromptForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function NewPromptPage() {
  const supabase = createClient()
  const { data: categories } = await supabase.from('categories').select('*').order('name')

  return (
    <div className="p-8">
      <Link href="/admin/prompts" className="inline-flex items-center gap-1.5 text-sm text-[#7a5060] hover:text-[#3d2535] transition-colors mb-6">
        <ChevronLeft className="h-4 w-4" />Back to Prompts
      </Link>
      <h1 className="font-heading text-3xl font-light text-[#3d2535] mb-8">Add New Prompt</h1>
      <PromptForm categories={categories ?? []} />
    </div>
  )
}
