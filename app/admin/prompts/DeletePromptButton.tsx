'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function DeletePromptButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('Delete this prompt? This cannot be undone.')) return
    setLoading(true)
    await createClient().from('prompts').delete().eq('id', id)
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="h-8 w-8 rounded-lg bg-[#fdf8f5] border border-[#edddd4] flex items-center justify-center text-[#7a5060] hover:text-red-500 hover:border-red-300 hover:bg-red-50 transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
    </button>
  )
}
