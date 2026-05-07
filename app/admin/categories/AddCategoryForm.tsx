'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function slugify(str: string) {
  return str.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
}

export default function AddCategoryForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error: err } = await createClient().from('categories').insert({ name: name.trim(), slug: slugify(name) })
      if (err) throw err
      setName('')
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add category.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleAdd} className="bg-[#fff0eb] border border-[#edddd4] rounded-2xl p-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#7a5060] mb-2">Category Name</label>
          <input
            type="text" value={name} onChange={(e) => setName(e.target.value)} required
            placeholder="e.g. Editorial"
            className="w-full bg-[#fdf8f5] border border-[#edddd4] rounded-xl px-4 py-3 text-[#3d2535] placeholder-[#c5adb8] focus:outline-none focus:border-[#c9829e] transition-colors text-sm"
          />
        </div>
        {name && (
          <p className="text-xs text-[#7a5060]">Slug: <span className="text-[#c9829e]">/{slugify(name)}</span></p>
        )}
        {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</div>}
        <button type="submit" disabled={loading || !name.trim()} className="w-full btn-gradient py-3 font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add Category
        </button>
      </div>
    </form>
  )
}
