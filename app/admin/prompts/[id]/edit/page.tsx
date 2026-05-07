import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PromptForm from '@/components/admin/PromptForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface Props { params: { id: string } }

export default async function EditPromptPage({ params }: Props) {
  const supabase = createClient()
  const [{ data: prompt }, { data: categories }] = await Promise.all([
    supabase.from('prompts').select('*').eq('id', params.id).single(),
    supabase.from('categories').select('*').order('name'),
  ])
  if (!prompt) notFound()

  return (
    <div className="p-8">
      <Link href="/admin/prompts" className="inline-flex items-center gap-1.5 text-sm text-[#7a5060] hover:text-[#3d2535] transition-colors mb-6">
        <ChevronLeft className="h-4 w-4" />Back to Prompts
      </Link>
      <h1 className="font-heading text-3xl font-light text-[#3d2535] mb-8">Edit Prompt</h1>
      <PromptForm categories={categories ?? []} prompt={prompt} />
    </div>
  )
}
