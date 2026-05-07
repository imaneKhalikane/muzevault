import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import { FileText, Tag, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const supabase = createClient()

  const [{ count: promptCount }, { count: categoryCount }, { data: recentPrompts }] = await Promise.all([
    supabase.from('prompts').select('*', { count: 'exact', head: true }),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
    supabase.from('prompts').select('*, category:categories(name)').order('created_at', { ascending: false }).limit(5),
  ])

  const latestDate = recentPrompts?.[0]
    ? new Date(recentPrompts[0].created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—'

  return (
    <div className="p-8">
      <h1 className="font-heading text-3xl font-light text-[#3d2535] mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {[
          { icon: FileText, label: 'Total Prompts', value: promptCount ?? 0, color: 'text-[#c9829e]', bg: 'bg-[#c9829e]/10' },
          { icon: Tag, label: 'Total Categories', value: categoryCount ?? 0, color: 'text-[#d4a574]', bg: 'bg-[#d4a574]/10' },
          { icon: Clock, label: 'Latest Upload', value: latestDate, color: 'text-[#e8b4c8]', bg: 'bg-[#e8b4c8]/20', small: true },
        ].map(({ icon: Icon, label, value, color, bg, small }) => (
          <div key={label} className="bg-[#fff0eb] border border-[#edddd4] rounded-2xl p-6 flex items-center gap-4">
            <div className={`h-12 w-12 rounded-xl ${bg} flex items-center justify-center`}>
              <Icon className={`h-6 w-6 ${color}`} />
            </div>
            <div>
              <p className={`font-heading ${small ? 'text-lg' : 'text-3xl'} font-light text-[#3d2535]`}>{value}</p>
              <p className="text-sm text-[#7a5060]">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent prompts */}
      <div>
        <h2 className="font-heading text-xl font-light text-[#3d2535] mb-4">Recent Prompts</h2>
        <div className="bg-[#fff0eb] border border-[#edddd4] rounded-2xl overflow-hidden">
          {recentPrompts && recentPrompts.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#edddd4] text-[#7a5060]">
                  <th className="text-left px-5 py-3 font-medium">Prompt</th>
                  <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Category</th>
                  <th className="text-left px-5 py-3 font-medium hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentPrompts.map((p, i) => (
                  <tr key={p.id} className={i < recentPrompts.length - 1 ? 'border-b border-[#edddd4]/60' : ''}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-[#fde8de] flex-shrink-0">
                          {p.image_url ? (
                            <Image src={p.image_url} alt={p.title} fill className="object-cover" />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-lg">🎭</span>
                          )}
                        </div>
                        <span className="font-medium text-[#3d2535] truncate max-w-[180px]">{p.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[#7a5060] hidden md:table-cell">
                      {(p.category as { name: string } | null)?.name ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-[#7a5060] hidden lg:table-cell">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 text-[#7a5060]">No prompts yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}
