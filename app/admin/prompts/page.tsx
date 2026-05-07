import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Pencil } from 'lucide-react'
import DeletePromptButton from './DeletePromptButton'

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

      <div className="bg-[#fff0eb] border border-[#edddd4] rounded-2xl overflow-hidden">
        {prompts && prompts.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#edddd4] text-[#7a5060]">
                <th className="text-left px-5 py-3 font-medium">Prompt</th>
                <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Category</th>
                <th className="text-left px-5 py-3 font-medium hidden lg:table-cell">Tags</th>
                <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Date</th>
                <th className="text-right px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {prompts.map((p, i) => (
                <tr key={p.id} className={i < prompts.length - 1 ? 'border-b border-[#edddd4]/60' : ''}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-[#fde8de] flex-shrink-0">
                        {p.image_url ? (
                          <Image src={p.image_url} alt={p.title} fill className="object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-xl">🎭</span>
                        )}
                      </div>
                      <span className="font-medium text-[#3d2535] truncate max-w-[160px]">{p.title}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[#7a5060] hidden md:table-cell">
                    {(p.category as { name: string } | null)?.name ?? '—'}
                  </td>
                  <td className="px-5 py-3 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {p.tags?.slice(0, 2).map((tag: string) => (
                        <span key={tag} className="bg-[#fdf8f5] border border-[#edddd4] text-[#7a5060] text-xs px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                      {(p.tags?.length ?? 0) > 2 && (
                        <span className="text-xs text-[#c5adb8]">+{p.tags.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[#7a5060] text-xs hidden sm:table-cell">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/prompts/${p.id}/edit`}
                        className="h-8 w-8 rounded-lg bg-[#fdf8f5] border border-[#edddd4] flex items-center justify-center text-[#7a5060] hover:text-[#c9829e] hover:border-[#e8b4c8] transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                      <DeletePromptButton id={p.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-16 text-[#7a5060]">
            <p className="font-heading text-xl font-light mb-4">No prompts yet.</p>
            <Link href="/admin/prompts/new" className="btn-gradient inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white">
              <Plus className="h-4 w-4" />Add your first prompt
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
