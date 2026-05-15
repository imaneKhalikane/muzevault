'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Pencil, Video, CheckCircle, Loader2, X,
  AlertCircle, Sparkles, Save,
} from 'lucide-react'
import DeletePromptButton from './DeletePromptButton'
import { createClient } from '@/lib/supabase/client'

// ── Types ─────────────────────────────────────────────────────────────────
export interface PromptRow {
  id: string
  title: string
  image_url: string | null
  image_prompt: string
  motion_prompt: string | null
  tags: string[] | null
  created_at: string
  category: { name: string } | null
}

interface GenerationResult {
  prompt: PromptRow
  motionText: string
  include: boolean
  error?: string
}

// ── Helpers ────────────────────────────────────────────────────────────────
// Fetch image URL → blob → canvas compress → base64 JPEG 0.7, max 1024px
async function imageUrlToBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(url)
  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)

  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => {
      const maxSize = 1024
      let { width, height } = img
      if (width > height && width > maxSize) {
        height = Math.round((height * maxSize) / width); width = maxSize
      } else if (height > maxSize) {
        width = Math.round((width * maxSize) / height); height = maxSize
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(objectUrl)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
      resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' })
    }
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Failed to load image')) }
    img.src = objectUrl
  })
}

// ── Component ──────────────────────────────────────────────────────────────
export default function PromptsTable({ prompts }: { prompts: PromptRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [modal, setModal] = useState<'idle' | 'generating' | 'review'>('idle')
  const [genProgress, setGenProgress] = useState({ current: 0, total: 0 })
  const [currentItem, setCurrentItem] = useState<PromptRow | null>(null)
  const [results, setResults] = useState<GenerationResult[]>([])
  const [saving, setSaving] = useState(false)

  const inputClass = 'w-full bg-[#fdf8f5] border border-[#edddd4] rounded-xl px-4 py-3 text-[#3d2535] placeholder-[#c5adb8] focus:outline-none focus:border-[#c9829e] transition-colors text-sm resize-y'

  // Only prompts missing a motion prompt can be selected
  const selectable = prompts.filter((p) => !p.motion_prompt)
  const allSelected = selectable.length > 0 && selectable.every((p) => selected.has(p.id))
  const someSelected = selectable.some((p) => selected.has(p.id))

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(selectable.map((p) => p.id)))
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Generation ─────────────────────────────────────────────────────────
  async function startGeneration() {
    const targets = prompts.filter((p) => selected.has(p.id))
    if (targets.length === 0) return

    setGenProgress({ current: 0, total: targets.length })
    setCurrentItem(null)
    setResults([])
    setModal('generating')

    const generated: GenerationResult[] = []

    for (let i = 0; i < targets.length; i++) {
      const prompt = targets[i]
      setCurrentItem(prompt)
      setGenProgress({ current: i, total: targets.length })

      try {
        if (!prompt.image_url) throw new Error('No image URL on this prompt')
        const { base64, mimeType } = await imageUrlToBase64(prompt.image_url)

        const res = await fetch('/api/generate-motion-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageData: base64,
            mimeType,
            imagePrompt: prompt.image_prompt ?? '',
          }),
        })
        const data = await res.json()

        if (!res.ok || data.error) {
          generated.push({ prompt, motionText: '', include: false, error: data.error ?? 'Generation failed' })
        } else {
          generated.push({ prompt, motionText: data.motion_prompt, include: true })
        }
      } catch (err) {
        generated.push({ prompt, motionText: '', include: false, error: String(err) })
      }

      setGenProgress({ current: i + 1, total: targets.length })
    }

    setResults(generated)
    setModal('review')
  }

  function updateResult(id: string, patch: Partial<GenerationResult>) {
    setResults((prev) => prev.map((r) => r.prompt.id === id ? { ...r, ...patch } : r))
  }

  // ── Save ───────────────────────────────────────────────────────────────
  async function saveSelected() {
    setSaving(true)
    const supabase = createClient()
    const toSave = results.filter((r) => r.include && r.motionText.trim())

    for (const result of toSave) {
      await supabase.from('prompts')
        .update({ motion_prompt: result.motionText.trim() })
        .eq('id', result.prompt.id)
    }

    setSaving(false)
    setModal('idle')
    setSelected(new Set())
    window.location.reload()
  }

  const pct = genProgress.total > 0
    ? Math.round((genProgress.current / genProgress.total) * 100)
    : 0

  // ── Table ──────────────────────────────────────────────────────────────
  return (
    <>
      <div className="bg-[#fff0eb] border border-[#edddd4] rounded-2xl overflow-hidden">
        {prompts.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#edddd4] text-[#7a5060]">
                {/* Select-all checkbox */}
                <th className="px-4 py-3 w-10">
                  <button
                    onClick={toggleAll}
                    disabled={selectable.length === 0}
                    className="disabled:opacity-30"
                    title="Select all without motion prompt"
                  >
                    <div className={`h-4 w-4 rounded border-2 flex items-center justify-center transition-colors ${
                      allSelected
                        ? 'bg-[#c9829e] border-[#c9829e]'
                        : someSelected
                          ? 'bg-[#c9829e]/30 border-[#c9829e]'
                          : 'border-[#edddd4] bg-[#fdf8f5]'
                    }`}>
                      {allSelected && (
                        <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {someSelected && !allSelected && (
                        <div className="h-1.5 w-1.5 bg-[#c9829e] rounded-sm" />
                      )}
                    </div>
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium">Prompt</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Tags</th>
                <th className="text-left px-4 py-3 font-medium">Motion</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Date</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {prompts.map((p, i) => {
                const hasMotion = !!p.motion_prompt
                const isSelectable = !hasMotion
                const isSelected = selected.has(p.id)

                return (
                  <tr
                    key={p.id}
                    className={`${i < prompts.length - 1 ? 'border-b border-[#edddd4]/60' : ''} ${isSelected ? 'bg-[#c9829e]/5' : ''} transition-colors`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3">
                      {isSelectable ? (
                        <button onClick={() => toggleOne(p.id)}>
                          <div className={`h-4 w-4 rounded border-2 flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-[#c9829e] border-[#c9829e]' : 'border-[#edddd4] bg-[#fdf8f5] hover:border-[#c9829e]'
                          }`}>
                            {isSelected && (
                              <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </button>
                      ) : (
                        <div className="h-4 w-4" />
                      )}
                    </td>

                    {/* Title + thumbnail */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-[#fde8de] flex-shrink-0">
                          {p.image_url ? (
                            <Image src={p.image_url} alt={p.title} fill className="object-cover" />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-xl">🎭</span>
                          )}
                        </div>
                        <span className="font-medium text-[#3d2535] truncate max-w-[150px]">{p.title}</span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 text-[#7a5060] hidden md:table-cell">
                      {(p.category as { name: string } | null)?.name ?? '—'}
                    </td>

                    {/* Tags */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {p.tags?.slice(0, 2).map((tag) => (
                          <span key={tag} className="bg-[#fdf8f5] border border-[#edddd4] text-[#7a5060] text-xs px-2 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                        {(p.tags?.length ?? 0) > 2 && (
                          <span className="text-xs text-[#c5adb8]">+{p.tags!.length - 2}</span>
                        )}
                      </div>
                    </td>

                    {/* Motion badge */}
                    <td className="px-4 py-3">
                      {hasMotion ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-medium px-2 py-1 rounded-full">
                          <CheckCircle className="h-3 w-3" />
                          Has motion
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-[#fff0eb] text-[#c9829e] border border-[#e8b4c8] text-xs font-medium px-2 py-1 rounded-full">
                          <Video className="h-3 w-3" />
                          No motion
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-[#7a5060] text-xs hidden sm:table-cell">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
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
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-16 text-[#7a5060]">
            <p className="font-heading text-xl font-light mb-4">No prompts yet.</p>
            <Link href="/admin/prompts/new" className="btn-gradient inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white">
              Add your first prompt
            </Link>
          </div>
        )}
      </div>

      {/* ── FLOATING ACTION BAR ─────────────────────────────────────────── */}
      {selected.size > 0 && modal === 'idle' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-4 bg-white border-2 border-[#c9829e] rounded-2xl shadow-xl px-6 py-3">
            <span className="text-sm font-medium text-[#3d2535]">
              {selected.size} prompt{selected.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => setSelected(new Set())}
              className="text-[#c5adb8] hover:text-[#7a5060] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              onClick={startGeneration}
              className="btn-gradient flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white"
            >
              <Sparkles className="h-4 w-4" />
              Generate Motion Prompts with AI
            </button>
          </div>
        </div>
      )}

      {/* ── PROGRESS MODAL ─────────────────────────────────────────────── */}
      {modal === 'generating' && (
        <div className="fixed inset-0 z-50 bg-[#3d2535]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
            <Sparkles className="h-10 w-10 text-[#c9829e] mx-auto mb-4" />
            <h2 className="font-heading text-2xl font-light text-[#3d2535] mb-1">
              Generating Motion Prompts
            </h2>
            <p className="text-sm text-[#7a5060] mb-6">
              {genProgress.current} / {genProgress.total} complete
            </p>

            {/* Progress bar */}
            <div className="w-full bg-[#edddd4] rounded-full h-3 mb-6 overflow-hidden">
              <div
                className="h-3 rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #c9829e, #d4a574)' }}
              />
            </div>

            {/* Current image being processed */}
            {currentItem && (
              <div className="flex items-center gap-4 bg-[#fff0eb] border border-[#edddd4] rounded-xl p-3 text-left">
                <div className="relative h-14 w-14 rounded-lg overflow-hidden flex-shrink-0 bg-[#fde8de]">
                  {currentItem.image_url && (
                    <Image src={currentItem.image_url} alt={currentItem.title} fill className="object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-[#7a5060] mb-0.5">Processing</p>
                  <p className="text-sm font-medium text-[#3d2535] truncate">{currentItem.title}</p>
                </div>
                <Loader2 className="h-5 w-5 text-[#c9829e] animate-spin flex-shrink-0 ml-auto" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── REVIEW MODAL ───────────────────────────────────────────────── */}
      {modal === 'review' && (
        <div className="fixed inset-0 z-50 bg-[#3d2535]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#edddd4]">
              <div>
                <h2 className="font-heading text-xl font-light text-[#3d2535]">Review Generated Motion Prompts</h2>
                <p className="text-xs text-[#7a5060] mt-0.5">
                  {results.filter((r) => !r.error).length} of {results.length} generated successfully. Uncheck any to skip.
                </p>
              </div>
              <button
                onClick={() => setModal('idle')}
                className="h-8 w-8 rounded-lg hover:bg-[#fff0eb] flex items-center justify-center text-[#7a5060] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Results list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {results.map((result) => (
                <div
                  key={result.prompt.id}
                  className={`border rounded-xl overflow-hidden transition-colors ${
                    result.include ? 'border-[#edddd4]' : 'border-[#edddd4]/40 opacity-50'
                  }`}
                >
                  <div className="flex gap-0">
                    {/* Thumbnail + include toggle */}
                    <div className="relative w-28 shrink-0 min-h-[120px] bg-[#fde8de]">
                      {result.prompt.image_url && (
                        <Image src={result.prompt.image_url} alt={result.prompt.title} fill className="object-cover" />
                      )}
                      {/* Include/exclude overlay checkbox */}
                      <button
                        onClick={() => !result.error && updateResult(result.prompt.id, { include: !result.include })}
                        disabled={!!result.error}
                        className="absolute top-2 left-2"
                      >
                        <div className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors shadow-sm ${
                          result.include && !result.error
                            ? 'bg-[#c9829e] border-[#c9829e]'
                            : 'bg-white/80 border-white'
                        }`}>
                          {result.include && !result.error && (
                            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4">
                      <p className="text-xs font-semibold text-[#3d2535] mb-2 truncate">{result.prompt.title}</p>
                      {result.error ? (
                        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-red-600">{result.error}</p>
                        </div>
                      ) : (
                        <textarea
                          value={result.motionText}
                          onChange={(e) => updateResult(result.prompt.id, { motionText: e.target.value })}
                          rows={4}
                          className={inputClass}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#edddd4] flex items-center justify-between gap-4">
              <p className="text-xs text-[#7a5060]">
                {results.filter((r) => r.include && !r.error).length} motion prompt{results.filter((r) => r.include && !r.error).length !== 1 ? 's' : ''} will be saved
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setModal('idle')}
                  className="px-5 py-2.5 rounded-[30px] text-sm font-medium border border-[#edddd4] text-[#7a5060] hover:border-[#c9829e] hover:text-[#3d2535] transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={saveSelected}
                  disabled={saving || results.filter((r) => r.include && !r.error).length === 0}
                  className="btn-gradient flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
                    : <><Save className="h-4 w-4" />Save Selected</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
