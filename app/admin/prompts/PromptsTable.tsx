'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Pencil, Video, CheckCircle, Loader2, X,
  AlertCircle, Sparkles, Save, LayoutGrid, List,
  Trash2, SlidersHorizontal,
} from 'lucide-react'
import DeletePromptButton from './DeletePromptButton'
import { createClient } from '@/lib/supabase/client'

// ── Types ─────────────────────────────────────────────────────────────────
export interface PromptRow {
  id: string
  title: string
  category_id: string | null
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

type ModalState = 'idle' | 'generating' | 'review' | 'delete' | 'bulkEdit'

const TAG_OPTIONS = [
  'Ad campaign', 'UGC', 'Editorial', 'Portrait',
  'Commercial', 'Lifestyle', 'Fashion', 'Beauty',
]

// ── Helpers ────────────────────────────────────────────────────────────────
async function imageUrlToBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(url)
  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => {
      const maxSize = 1024
      let { width, height } = img
      if (width > height && width > maxSize) { height = Math.round((height * maxSize) / width); width = maxSize }
      else if (height > maxSize) { width = Math.round((width * maxSize) / height); height = maxSize }
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

// Reusable checkbox box
function CheckBox({ checked, indeterminate = false, onChange }: {
  checked: boolean; indeterminate?: boolean; onChange: () => void
}) {
  return (
    <button onClick={onChange} type="button" className="flex-shrink-0">
      <div className={`h-4 w-4 rounded border-2 flex items-center justify-center transition-colors ${
        checked || indeterminate ? 'bg-[#c9829e] border-[#c9829e]' : 'border-[#edddd4] bg-[#fdf8f5] hover:border-[#c9829e]'
      }`}>
        {checked && (
          <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
        {!checked && indeterminate && <div className="h-1.5 w-1.5 bg-white rounded-sm" />}
      </div>
    </button>
  )
}

// Motion badge
function MotionBadge({ hasMotion, small = false }: { hasMotion: boolean; small?: boolean }) {
  const base = small
    ? 'inline-flex items-center gap-0.5 text-[10px] font-medium px-2 py-0.5 rounded-full'
    : 'inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full'
  return hasMotion ? (
    <span className={`${base} bg-emerald-50 text-emerald-600 border border-emerald-200`}>
      <CheckCircle className={small ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
      {small ? 'Motion' : 'Has motion'}
    </span>
  ) : (
    <span className={`${base} bg-[#fff0eb] text-[#c9829e] border border-[#e8b4c8]`}>
      <Video className={small ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
      {small ? 'No motion' : 'No motion'}
    </span>
  )
}

// ── Component ──────────────────────────────────────────────────────────────
export default function PromptsTable({ prompts }: { prompts: PromptRow[] }) {
  // ── View toggle ──────────────────────────────────────────────────────────
  const [view, setView] = useState<'list' | 'grid'>('list')

  useEffect(() => {
    const saved = localStorage.getItem('prompts-view')
    if (saved === 'grid' || saved === 'list') setView(saved)
  }, [])

  function switchView(v: 'list' | 'grid') {
    setView(v)
    localStorage.setItem('prompts-view', v)
  }

  // ── Selection (all prompts are selectable) ───────────────────────────────
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const allSelected = prompts.length > 0 && prompts.every((p) => selected.has(p.id))
  const someSelected = prompts.some((p) => selected.has(p.id))
  const selectedWithoutMotion = prompts.filter((p) => selected.has(p.id) && !p.motion_prompt)

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(prompts.map((p) => p.id)))
  }
  function toggleOne(id: string) {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  // ── Modal / panel state ──────────────────────────────────────────────────
  const [modal, setModal] = useState<ModalState>('idle')

  // ── Generation ───────────────────────────────────────────────────────────
  const [genProgress, setGenProgress] = useState({ current: 0, total: 0 })
  const [currentItem, setCurrentItem] = useState<PromptRow | null>(null)
  const [results, setResults] = useState<GenerationResult[]>([])
  const [saving, setSaving] = useState(false)

  const inputClass = 'w-full bg-[#fdf8f5] border border-[#edddd4] rounded-xl px-4 py-3 text-[#3d2535] placeholder-[#c5adb8] focus:outline-none focus:border-[#c9829e] transition-colors text-sm resize-y'

  async function startGeneration() {
    const targets = prompts.filter((p) => selected.has(p.id) && !p.motion_prompt)
    if (targets.length === 0) return
    setGenProgress({ current: 0, total: targets.length })
    setCurrentItem(null); setResults([]); setModal('generating')
    const generated: GenerationResult[] = []
    for (let i = 0; i < targets.length; i++) {
      const prompt = targets[i]
      setCurrentItem(prompt); setGenProgress({ current: i, total: targets.length })
      try {
        if (!prompt.image_url) throw new Error('No image URL')
        const { base64, mimeType } = await imageUrlToBase64(prompt.image_url)
        const res = await fetch('/api/generate-motion-prompt', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageData: base64, mimeType, imagePrompt: prompt.image_prompt ?? '' }),
        })
        const data = await res.json()
        if (!res.ok || data.error) generated.push({ prompt, motionText: '', include: false, error: data.error ?? 'Generation failed' })
        else generated.push({ prompt, motionText: data.motion_prompt, include: true })
      } catch (err) {
        generated.push({ prompt, motionText: '', include: false, error: String(err) })
      }
      setGenProgress({ current: i + 1, total: targets.length })
    }
    setResults(generated); setModal('review')
  }

  function updateResult(id: string, patch: Partial<GenerationResult>) {
    setResults((prev) => prev.map((r) => r.prompt.id === id ? { ...r, ...patch } : r))
  }

  async function saveMotionResults() {
    setSaving(true)
    const supabase = createClient()
    for (const r of results.filter((r) => r.include && r.motionText.trim())) {
      await supabase.from('prompts').update({ motion_prompt: r.motionText.trim() }).eq('id', r.prompt.id)
    }
    setSaving(false); setModal('idle'); setSelected(new Set()); window.location.reload()
  }

  // ── Delete ───────────────────────────────────────────────────────────────
  const [deleting, setDeleting] = useState(false)

  async function deleteSelected() {
    setDeleting(true)
    await createClient().from('prompts').delete().in('id', Array.from(selected))
    setDeleting(false); setModal('idle'); setSelected(new Set()); window.location.reload()
  }

  // ── Bulk edit ────────────────────────────────────────────────────────────
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [bulkCategoryId, setBulkCategoryId] = useState('')
  const [bulkApplyCategory, setBulkApplyCategory] = useState(false)
  const [bulkTags, setBulkTags] = useState<string[]>([])
  const [bulkTagMode, setBulkTagMode] = useState<'add' | 'replace'>('add')
  const [bulkTagInput, setBulkTagInput] = useState('')
  const [bulkSaving, setBulkSaving] = useState(false)

  useEffect(() => {
    createClient().from('categories').select('*').order('name')
      .then(({ data }) => { if (data) setCategories(data) })
  }, [])

  function addBulkTag(tag: string) {
    const t = tag.trim()
    if (t && !bulkTags.includes(t)) setBulkTags((prev) => [...prev, t])
    setBulkTagInput('')
  }

  async function applyBulkEdit() {
    setBulkSaving(true)
    const supabase = createClient()
    for (const p of prompts.filter((p) => selected.has(p.id))) {
      const patch: Record<string, unknown> = {}
      if (bulkApplyCategory) patch.category_id = bulkCategoryId || null
      if (bulkTags.length > 0) {
        patch.tags = bulkTagMode === 'replace'
          ? bulkTags
          : Array.from(new Set([...(p.tags ?? []), ...bulkTags]))
      }
      if (Object.keys(patch).length > 0) {
        await supabase.from('prompts').update(patch).eq('id', p.id)
      }
    }
    setBulkSaving(false); setModal('idle'); setSelected(new Set()); window.location.reload()
  }

  const pct = genProgress.total > 0 ? Math.round((genProgress.current / genProgress.total) * 100) : 0

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── VIEW TOGGLE + COUNT ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[#7a5060]">
          {prompts.length} prompt{prompts.length !== 1 ? 's' : ''}
          {selected.size > 0 && (
            <span className="ml-2 text-[#c9829e] font-medium">· {selected.size} selected</span>
          )}
        </p>
        <div className="flex items-center gap-1 bg-[#fff0eb] border border-[#edddd4] rounded-xl p-1">
          <button
            onClick={() => switchView('list')}
            title="List view"
            className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
              view === 'list' ? 'bg-[#c9829e] text-white shadow-sm' : 'text-[#7a5060] hover:text-[#3d2535]'
            }`}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => switchView('grid')}
            title="Grid view"
            className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
              view === 'grid' ? 'bg-[#c9829e] text-white shadow-sm' : 'text-[#7a5060] hover:text-[#3d2535]'
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── LIST VIEW ───────────────────────────────────────────────────── */}
      {view === 'list' && (
        <div className="bg-[#fff0eb] border border-[#edddd4] rounded-2xl overflow-hidden">
          {prompts.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#edddd4] text-[#7a5060]">
                  <th className="px-4 py-3 w-10">
                    <CheckBox
                      checked={allSelected}
                      indeterminate={someSelected && !allSelected}
                      onChange={toggleAll}
                    />
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
                  const isSelected = selected.has(p.id)
                  return (
                    <tr
                      key={p.id}
                      className={`transition-colors ${i < prompts.length - 1 ? 'border-b border-[#edddd4]/60' : ''} ${isSelected ? 'bg-[#c9829e]/5' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <CheckBox checked={isSelected} onChange={() => toggleOne(p.id)} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-[#fde8de] flex-shrink-0">
                            {p.image_url
                              ? <Image src={p.image_url} alt={p.title} fill className="object-cover" />
                              : <span className="flex h-full w-full items-center justify-center text-xl">🎭</span>}
                          </div>
                          <span className="font-medium text-[#3d2535] truncate max-w-[150px]">{p.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#7a5060] hidden md:table-cell">
                        {p.category?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {p.tags?.slice(0, 2).map((tag) => (
                            <span key={tag} className="bg-[#fdf8f5] border border-[#edddd4] text-[#7a5060] text-xs px-2 py-0.5 rounded-full">{tag}</span>
                          ))}
                          {(p.tags?.length ?? 0) > 2 && (
                            <span className="text-xs text-[#c5adb8]">+{p.tags!.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <MotionBadge hasMotion={!!p.motion_prompt} />
                      </td>
                      <td className="px-4 py-3 text-[#7a5060] text-xs hidden sm:table-cell">
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/prompts/${p.id}/edit`}
                            className="h-8 w-8 rounded-lg bg-[#fdf8f5] border border-[#edddd4] flex items-center justify-center text-[#7a5060] hover:text-[#c9829e] hover:border-[#e8b4c8] transition-colors">
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
      )}

      {/* ── GRID VIEW ───────────────────────────────────────────────────── */}
      {view === 'grid' && (
        <>
          {prompts.length > 0 ? (
            <>
              {/* Select all bar */}
              <div className="flex items-center gap-3 mb-3 px-1">
                <CheckBox
                  checked={allSelected}
                  indeterminate={someSelected && !allSelected}
                  onChange={toggleAll}
                />
                <span className="text-xs text-[#7a5060]">
                  {allSelected ? 'Deselect all' : 'Select all'}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {prompts.map((p) => {
                  const isSelected = selected.has(p.id)
                  return (
                    <div
                      key={p.id}
                      className={`group bg-[#fff0eb] border-2 rounded-2xl overflow-hidden transition-all ${
                        isSelected ? 'border-[#c9829e] shadow-md shadow-[#c9829e]/10' : 'border-[#edddd4] hover:border-[#e8b4c8]'
                      }`}
                    >
                      {/* Image */}
                      <div className="relative aspect-square bg-[#fde8de]">
                        {p.image_url
                          ? <Image src={p.image_url} alt={p.title} fill className="object-cover" />
                          : <span className="flex h-full w-full items-center justify-center text-4xl">🎭</span>}

                        {/* Checkbox overlay — top left */}
                        <div className="absolute top-2 left-2">
                          <button onClick={() => toggleOne(p.id)} type="button">
                            <div className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors shadow-sm ${
                              isSelected ? 'bg-[#c9829e] border-[#c9829e]' : 'bg-white/80 border-white/60 hover:border-[#c9829e]'
                            }`}>
                              {isSelected && (
                                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Card body */}
                      <div className="p-3 space-y-2">
                        <p className="font-medium text-[#3d2535] text-sm truncate leading-tight">{p.title}</p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {p.category?.name && (
                            <span className="bg-[#e8b4c8]/30 text-[#c9829e] border border-[#e8b4c8] text-[10px] font-medium px-2 py-0.5 rounded-full">
                              {p.category.name}
                            </span>
                          )}
                          <MotionBadge hasMotion={!!p.motion_prompt} small />
                        </div>

                        {/* Action row */}
                        <div className="flex items-center gap-1 pt-1.5 border-t border-[#edddd4]">
                          <Link
                            href={`/admin/prompts/${p.id}/edit`}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-[#7a5060] hover:text-[#c9829e] hover:bg-[#fde8de] transition-colors"
                          >
                            <Pencil className="h-3 w-3" />Edit
                          </Link>
                          <div className="flex-shrink-0">
                            <DeletePromptButton id={p.id} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-[#7a5060] bg-[#fff0eb] border border-[#edddd4] rounded-2xl">
              <p className="font-heading text-xl font-light mb-4">No prompts yet.</p>
              <Link href="/admin/prompts/new" className="btn-gradient inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white">
                Add your first prompt
              </Link>
            </div>
          )}
        </>
      )}

      {/* ── FLOATING ACTION BAR ─────────────────────────────────────────── */}
      {selected.size > 0 && modal === 'idle' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <div className="flex items-center gap-3 bg-white border-2 border-[#c9829e] rounded-2xl shadow-xl shadow-[#c9829e]/15 px-5 py-3">
            <span className="text-sm font-medium text-[#3d2535] whitespace-nowrap">
              {selected.size} prompt{selected.size !== 1 ? 's' : ''} selected
            </span>
            <button onClick={() => setSelected(new Set())} className="text-[#c5adb8] hover:text-[#7a5060] transition-colors flex-shrink-0">
              <X className="h-4 w-4" />
            </button>
            <div className="w-px h-5 bg-[#edddd4] flex-shrink-0" />

            {/* Generate Motion — only shown if any selected prompt lacks motion */}
            {selectedWithoutMotion.length > 0 && (
              <button
                onClick={startGeneration}
                className="btn-gradient flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white whitespace-nowrap"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Generate Motion
                {selectedWithoutMotion.length < selected.size && (
                  <span className="opacity-80">({selectedWithoutMotion.length})</span>
                )}
              </button>
            )}

            {/* Bulk Edit */}
            <button
              onClick={() => { setBulkApplyCategory(false); setBulkCategoryId(''); setBulkTags([]); setBulkTagInput(''); setBulkTagMode('add'); setModal('bulkEdit') }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-[30px] text-xs font-semibold border border-[#edddd4] text-[#7a5060] hover:border-[#c9829e] hover:text-[#3d2535] transition-colors whitespace-nowrap"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />Bulk Edit
            </button>

            {/* Delete */}
            <button
              onClick={() => setModal('delete')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-[30px] text-xs font-semibold border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-400 transition-colors whitespace-nowrap"
            >
              <Trash2 className="h-3.5 w-3.5" />Delete
            </button>
          </div>
        </div>
      )}

      {/* ── PROGRESS MODAL ─────────────────────────────────────────────── */}
      {modal === 'generating' && (
        <div className="fixed inset-0 z-50 bg-[#3d2535]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
            <Sparkles className="h-10 w-10 text-[#c9829e] mx-auto mb-4" />
            <h2 className="font-heading text-2xl font-light text-[#3d2535] mb-1">Generating Motion Prompts</h2>
            <p className="text-sm text-[#7a5060] mb-6">{genProgress.current} / {genProgress.total} complete</p>
            <div className="w-full bg-[#edddd4] rounded-full h-3 mb-6 overflow-hidden">
              <div className="h-3 rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #c9829e, #d4a574)' }} />
            </div>
            {currentItem && (
              <div className="flex items-center gap-4 bg-[#fff0eb] border border-[#edddd4] rounded-xl p-3 text-left">
                <div className="relative h-14 w-14 rounded-lg overflow-hidden flex-shrink-0 bg-[#fde8de]">
                  {currentItem.image_url && <Image src={currentItem.image_url} alt={currentItem.title} fill className="object-cover" />}
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
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#edddd4]">
              <div>
                <h2 className="font-heading text-xl font-light text-[#3d2535]">Review Generated Motion Prompts</h2>
                <p className="text-xs text-[#7a5060] mt-0.5">
                  {results.filter((r) => !r.error).length} of {results.length} generated. Uncheck any to skip.
                </p>
              </div>
              <button onClick={() => setModal('idle')} className="h-8 w-8 rounded-lg hover:bg-[#fff0eb] flex items-center justify-center text-[#7a5060] transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {results.map((result) => (
                <div key={result.prompt.id}
                  className={`border rounded-xl overflow-hidden transition-opacity ${result.include ? 'border-[#edddd4]' : 'border-[#edddd4]/40 opacity-50'}`}>
                  <div className="flex gap-0">
                    <div className="relative w-28 shrink-0 min-h-[120px] bg-[#fde8de]">
                      {result.prompt.image_url && <Image src={result.prompt.image_url} alt={result.prompt.title} fill className="object-cover" />}
                      <button
                        onClick={() => !result.error && updateResult(result.prompt.id, { include: !result.include })}
                        disabled={!!result.error}
                        className="absolute top-2 left-2"
                      >
                        <div className={`h-5 w-5 rounded border-2 flex items-center justify-center shadow-sm ${result.include && !result.error ? 'bg-[#c9829e] border-[#c9829e]' : 'bg-white/80 border-white'}`}>
                          {result.include && !result.error && (
                            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </button>
                    </div>
                    <div className="flex-1 p-4">
                      <p className="text-xs font-semibold text-[#3d2535] mb-2 truncate">{result.prompt.title}</p>
                      {result.error ? (
                        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-red-600">{result.error}</p>
                        </div>
                      ) : (
                        <textarea value={result.motionText}
                          onChange={(e) => updateResult(result.prompt.id, { motionText: e.target.value })}
                          rows={4} className={inputClass} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-[#edddd4] flex items-center justify-between gap-4">
              <p className="text-xs text-[#7a5060]">
                {results.filter((r) => r.include && !r.error).length} motion prompt{results.filter((r) => r.include && !r.error).length !== 1 ? 's' : ''} will be saved
              </p>
              <div className="flex gap-3">
                <button onClick={() => setModal('idle')}
                  className="px-5 py-2.5 rounded-[30px] text-sm font-medium border border-[#edddd4] text-[#7a5060] hover:border-[#c9829e] hover:text-[#3d2535] transition-colors">
                  Discard
                </button>
                <button onClick={saveMotionResults}
                  disabled={saving || results.filter((r) => r.include && !r.error).length === 0}
                  className="btn-gradient flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> : <><Save className="h-4 w-4" />Save Selected</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ───────────────────────────────────── */}
      {modal === 'delete' && (
        <div className="fixed inset-0 z-50 bg-[#3d2535]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7">
            <div className="h-12 w-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-5">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <h2 className="font-heading text-xl font-light text-[#3d2535] text-center mb-2">
              Delete {selected.size} Prompt{selected.size !== 1 ? 's' : ''}?
            </h2>
            <p className="text-sm text-[#7a5060] text-center leading-relaxed mb-6">
              Are you sure you want to delete {selected.size} prompt{selected.size !== 1 ? 's' : ''}?
              <br />This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setModal('idle')}
                className="flex-1 px-4 py-2.5 rounded-[30px] text-sm font-medium border border-[#edddd4] text-[#7a5060] hover:border-[#c9829e] hover:text-[#3d2535] transition-colors">
                Cancel
              </button>
              <button onClick={deleteSelected} disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[30px] text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-60">
                {deleting
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Deleting…</>
                  : `Delete ${selected.size} Prompt${selected.size !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BULK EDIT PANEL ────────────────────────────────────────────── */}
      {modal === 'bulkEdit' && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-[#3d2535]/20 backdrop-blur-[2px]"
            onClick={() => setModal('idle')}
          />
          {/* Slide-in panel */}
          <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[420px] bg-white shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#edddd4]">
              <div>
                <h2 className="font-heading text-xl font-light text-[#3d2535]">Bulk Edit</h2>
                <p className="text-xs text-[#7a5060] mt-0.5">
                  {selected.size} prompt{selected.size !== 1 ? 's' : ''} selected
                </p>
              </div>
              <button onClick={() => setModal('idle')}
                className="h-8 w-8 rounded-lg hover:bg-[#fff0eb] flex items-center justify-center text-[#7a5060] transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-7">

              {/* ── Category ── */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <button onClick={() => setBulkApplyCategory((v) => !v)} type="button">
                    <div className={`h-4 w-4 rounded border-2 flex items-center justify-center transition-colors ${
                      bulkApplyCategory ? 'bg-[#c9829e] border-[#c9829e]' : 'border-[#edddd4] bg-[#fdf8f5] hover:border-[#c9829e]'
                    }`}>
                      {bulkApplyCategory && (
                        <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                  <label className="text-sm font-medium text-[#3d2535]">Update Category</label>
                  <span className="text-xs text-[#c5adb8]">Apply to all</span>
                </div>
                {bulkApplyCategory && (
                  <select
                    value={bulkCategoryId}
                    onChange={(e) => setBulkCategoryId(e.target.value)}
                    className="w-full bg-[#fdf8f5] border border-[#edddd4] rounded-xl px-4 py-3 text-[#3d2535] focus:outline-none focus:border-[#c9829e] transition-colors text-sm"
                  >
                    <option value="">No category</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </div>

              {/* ── Tags ── */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-[#3d2535]">Update Tags</label>

                {/* Mode toggle */}
                <div className="flex gap-2">
                  {(['add', 'replace'] as const).map((mode) => (
                    <button key={mode} onClick={() => setBulkTagMode(mode)} type="button"
                      className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all border-2 ${
                        bulkTagMode === mode
                          ? 'bg-[#c9829e] border-[#c9829e] text-white'
                          : 'bg-[#fdf8f5] border-[#edddd4] text-[#7a5060] hover:border-[#c9829e]'
                      }`}>
                      {mode === 'add' ? 'Add to existing' : 'Replace all tags'}
                    </button>
                  ))}
                </div>

                {/* Preset tag chips */}
                <div className="flex flex-wrap gap-1.5">
                  {TAG_OPTIONS.map((tag) => (
                    <button key={tag} type="button"
                      onClick={() => !bulkTags.includes(tag) && setBulkTags((prev) => [...prev, tag])}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                        bulkTags.includes(tag)
                          ? 'bg-[#3d2535] text-white border-[#3d2535]'
                          : 'bg-[#fdf8f5] border-[#edddd4] text-[#7a5060] hover:border-[#c9829e]'
                      }`}>
                      {tag}
                    </button>
                  ))}
                </div>

                {/* Custom tag input */}
                <div className="flex gap-2">
                  <input type="text" value={bulkTagInput}
                    onChange={(e) => setBulkTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBulkTag(bulkTagInput))}
                    placeholder="Add custom tag…"
                    className="flex-1 bg-[#fdf8f5] border border-[#edddd4] rounded-xl px-4 py-2.5 text-[#3d2535] placeholder-[#c5adb8] focus:outline-none focus:border-[#c9829e] transition-colors text-sm"
                  />
                  <button type="button" onClick={() => addBulkTag(bulkTagInput)}
                    className="px-4 py-2.5 rounded-xl bg-[#fff0eb] border border-[#edddd4] text-sm text-[#7a5060] hover:text-[#3d2535] transition-colors">
                    Add
                  </button>
                </div>

                {/* Selected tags */}
                {bulkTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {bulkTags.map((t) => (
                      <span key={t} className="flex items-center gap-1 bg-[#c9829e]/10 text-[#c9829e] text-xs px-2 py-1 rounded-lg">
                        {t}
                        <button type="button" onClick={() => setBulkTags((prev) => prev.filter((x) => x !== t))}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Info note */}
              <div className="bg-[#fff0eb] border border-[#edddd4] rounded-xl p-4 text-xs text-[#7a5060]">
                <p className="font-medium text-[#3d2535] mb-1">Only checked fields will be updated</p>
                <p>Image prompts and motion prompts can only be edited individually from each prompt&apos;s edit page.</p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#edddd4] flex gap-3">
              <button onClick={() => setModal('idle')}
                className="flex-1 px-4 py-2.5 rounded-[30px] text-sm font-medium border border-[#edddd4] text-[#7a5060] hover:border-[#c9829e] hover:text-[#3d2535] transition-colors">
                Cancel
              </button>
              <button
                onClick={applyBulkEdit}
                disabled={bulkSaving || (!bulkApplyCategory && bulkTags.length === 0)}
                className="flex-1 btn-gradient flex items-center justify-center gap-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {bulkSaving
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Applying…</>
                  : 'Apply Changes'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
