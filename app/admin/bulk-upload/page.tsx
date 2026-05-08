'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  Upload, X, Sparkles, Loader2, CheckCircle, AlertCircle,
  ChevronRight, ArrowLeft, Save,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { type Category } from '@/lib/types'

// ── Types ─────────────────────────────────────────────────────────────────
type Stage = 'upload' | 'generating' | 'review' | 'saved'
type ItemStatus = 'pending' | 'generating' | 'done' | 'error'

interface ImageEntry {
  id: string
  file: File
  preview: string        // object URL for display
  title: string          // editable, auto-filled from filename
  categoryId: string
  tags: string[]
  imagePrompt: string
  motionPrompt: string
  status: ItemStatus
  error?: string
}

// ── Helpers ────────────────────────────────────────────────────────────────
const TAG_OPTIONS = ['Ad campaign', 'UGC', 'Editorial', 'Portrait', 'Commercial', 'Lifestyle', 'Fashion', 'Beauty']

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1]) // strip "data:image/...;base64,"
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function titleFromFilename(name: string) {
  return name
    .replace(/\.[^/.]+$/, '')          // remove extension
    .replace(/[-_]+/g, ' ')            // dashes/underscores → spaces
    .replace(/\b\w/g, (c) => c.toUpperCase()) // Title Case
    .trim()
}

// ── Main component ─────────────────────────────────────────────────────────
export default function BulkUploadPage() {
  const router = useRouter()
  const dropRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [stage, setStage] = useState<Stage>('upload')
  const [items, setItems] = useState<ImageEntry[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [dragging, setDragging] = useState(false)

  // Global config (applied to all before generation)
  const [globalCategoryId, setGlobalCategoryId] = useState('')
  const [globalTags, setGlobalTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState('')

  // Generation progress
  const [genProgress, setGenProgress] = useState({ current: 0, total: 0 })

  // Save state
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [savedCount, setSavedCount] = useState(0)

  const inputClass = 'w-full bg-[#fdf8f5] border border-[#edddd4] rounded-xl px-4 py-3 text-[#3d2535] placeholder-[#c5adb8] focus:outline-none focus:border-[#c9829e] transition-colors text-sm'

  // Fetch categories on mount
  useEffect(() => {
    createClient()
      .from('categories')
      .select('*')
      .order('name')
      .then(({ data }) => { if (data) setCategories(data) })
  }, [])

  // Revoke object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => { items.forEach((item) => URL.revokeObjectURL(item.preview)) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── File handling ──────────────────────────────────────────────────────
  function addFiles(files: FileList | File[]) {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'))
    const newEntries: ImageEntry[] = imageFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      preview: URL.createObjectURL(file),
      title: titleFromFilename(file.name),
      categoryId: globalCategoryId,
      tags: [...globalTags],
      imagePrompt: '',
      motionPrompt: '',
      status: 'pending',
    }))
    setItems((prev) => [...prev, ...newEntries])
  }

  function removeItem(id: string) {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id)
      if (item) URL.revokeObjectURL(item.preview)
      return prev.filter((i) => i.id !== id)
    })
  }

  function updateItem(id: string, patch: Partial<ImageEntry>) {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, ...patch } : i))
  }

  // ── Drag & drop ────────────────────────────────────────────────────────
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }, [])
  const onDragLeave = useCallback(() => setDragging(false), [])
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Tags helpers ───────────────────────────────────────────────────────
  function toggleGlobalTag(tag: string) {
    setGlobalTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])
  }

  function addGlobalCustomTag() {
    const t = customTag.trim()
    if (t && !globalTags.includes(t)) setGlobalTags((prev) => [...prev, t])
    setCustomTag('')
  }

  function toggleItemTag(id: string, tag: string, currentTags: string[]) {
    const next = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag]
    updateItem(id, { tags: next })
  }

  // ── AI Generation ──────────────────────────────────────────────────────
  async function generateAll() {
    if (items.length === 0) return

    // Stamp global config onto every item before generating
    const prepped = items.map((item) => ({
      ...item,
      categoryId: item.categoryId || globalCategoryId,
      tags: item.tags.length > 0 ? item.tags : [...globalTags],
      status: 'pending' as ItemStatus,
    }))
    setItems(prepped)
    setGenProgress({ current: 0, total: prepped.length })
    setStage('generating')

    for (let i = 0; i < prepped.length; i++) {
      const item = prepped[i]
      setItems((prev) => prev.map((p) => p.id === item.id ? { ...p, status: 'generating' } : p))

      try {
        const base64 = await fileToBase64(item.file)
        const res = await fetch('/api/generate-prompts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageData: base64, mimeType: item.file.type }),
        })
        const data = await res.json()

        if (!res.ok || data.error) {
          setItems((prev) => prev.map((p) =>
            p.id === item.id ? { ...p, status: 'error', error: data.error ?? 'Generation failed' } : p
          ))
        } else {
          setItems((prev) => prev.map((p) =>
            p.id === item.id ? { ...p, status: 'done', imagePrompt: data.image_prompt, motionPrompt: data.motion_prompt } : p
          ))
        }
      } catch (err) {
        setItems((prev) => prev.map((p) =>
          p.id === item.id ? { ...p, status: 'error', error: String(err) } : p
        ))
      }

      setGenProgress({ current: i + 1, total: prepped.length })
    }

    setStage('review')
  }

  // ── Save all to Supabase ───────────────────────────────────────────────
  async function saveAll() {
    setSaving(true)
    setSaveError('')
    const supabase = createClient()
    let saved = 0

    for (const item of items) {
      try {
        // 1. Upload image to storage
        const ext = item.file.name.split('.').pop()
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { data: storageData, error: uploadError } = await supabase.storage
          .from('prompt-images')
          .upload(path, item.file, { cacheControl: '3600', upsert: false })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('prompt-images')
          .getPublicUrl(storageData.path)

        // 2. Insert prompt record
        const { error: insertError } = await supabase.from('prompts').insert({
          title: item.title,
          category_id: item.categoryId || null,
          tags: item.tags,
          image_url: publicUrl,
          image_prompt: item.imagePrompt,
          motion_prompt: item.motionPrompt,
        })

        if (insertError) throw insertError
        saved++
      } catch (err) {
        console.error(`[bulk-upload] Failed to save "${item.title}":`, err)
      }
    }

    setSavedCount(saved)
    setSaving(false)
    setStage('saved')
  }

  // ── Render ─────────────────────────────────────────────────────────────

  // ── STAGE: UPLOAD + CONFIGURE ──────────────────────────────────────────
  if (stage === 'upload') {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-light text-[#3d2535] mb-1">Bulk Upload</h1>
          <p className="text-sm text-[#7a5060]">Upload multiple images and generate AI prompts for all of them at once.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8 text-xs font-medium">
          {['Upload Images', 'Configure', 'Generate', 'Review & Save'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? 'bg-[#c9829e] text-white' : 'bg-[#edddd4] text-[#7a5060]'}`}>{i + 1}</span>
              <span className={i === 0 ? 'text-[#3d2535]' : 'text-[#c5adb8]'}>{s}</span>
              {i < 3 && <ChevronRight className="h-3 w-3 text-[#edddd4]" />}
            </div>
          ))}
        </div>

        {/* Drop zone */}
        <div
          ref={dropRef}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all py-14 mb-6 ${
            dragging
              ? 'border-[#c9829e] bg-[#c9829e]/5'
              : 'border-[#edddd4] hover:border-[#e8b4c8] hover:bg-[#fff0eb]'
          }`}
        >
          <Upload className="h-10 w-10 text-[#c5adb8] mb-3" />
          <p className="text-base font-medium text-[#7a5060]">Drop images here or click to browse</p>
          <p className="text-sm text-[#c5adb8] mt-1">PNG, JPG, WEBP — multiple files at once</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => { if (e.target.files) addFiles(e.target.files) }}
          />
        </div>

        {/* Image grid preview */}
        {items.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#3d2535]">{items.length} image{items.length !== 1 ? 's' : ''} selected</h2>
              <button
                onClick={() => { items.forEach((i) => URL.revokeObjectURL(i.preview)); setItems([]) }}
                className="text-xs text-[#7a5060] hover:text-red-500 transition-colors"
              >
                Remove all
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {items.map((item) => (
                <div key={item.id} className="relative group rounded-xl overflow-hidden border border-[#edddd4] aspect-square">
                  <Image src={item.preview} alt={item.title} fill className="object-cover" />
                  <div className="absolute inset-0 bg-[#3d2535]/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                    <p className="text-white text-[10px] font-medium text-center leading-tight line-clamp-2">
                      {item.file.name}
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeItem(item.id) }}
                      className="bg-red-500/80 hover:bg-red-500 text-white p-1 rounded-lg transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Global configuration */}
        {items.length > 0 && (
          <div className="bg-[#fff0eb] border border-[#edddd4] rounded-2xl p-6 mb-6 space-y-5">
            <h2 className="font-heading text-lg font-medium text-[#3d2535]">Configure for all images</h2>
            <p className="text-xs text-[#7a5060] -mt-3">These apply to all images. You can edit each one individually after generation.</p>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-[#7a5060] mb-2">Category</label>
              <select
                value={globalCategoryId}
                onChange={(e) => setGlobalCategoryId(e.target.value)}
                className={inputClass}
              >
                <option value="">No category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-[#7a5060] mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {TAG_OPTIONS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleGlobalTag(tag)}
                    className={`px-3 py-1.5 rounded-[30px] text-xs font-medium transition-colors ${
                      globalTags.includes(tag)
                        ? 'bg-[#3d2535] text-[#fdf8f5]'
                        : 'bg-[#fdf8f5] border border-[#edddd4] text-[#7a5060] hover:border-[#c9829e]'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGlobalCustomTag())}
                  placeholder="Add custom tag…"
                  className={`flex-1 ${inputClass}`}
                />
                <button
                  type="button"
                  onClick={addGlobalCustomTag}
                  className="px-4 py-2.5 rounded-xl bg-[#fdf8f5] border border-[#edddd4] text-sm text-[#7a5060] hover:text-[#3d2535] transition-colors"
                >
                  Add
                </button>
              </div>
              {globalTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {globalTags.map((t) => (
                    <span key={t} className="flex items-center gap-1 bg-[#c9829e]/10 text-[#c9829e] text-xs px-2 py-1 rounded-lg">
                      {t}
                      <button onClick={() => setGlobalTags((p) => p.filter((x) => x !== t))}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Generate button */}
        {items.length > 0 && (
          <button
            onClick={generateAll}
            className="btn-gradient w-full py-4 text-base font-semibold text-white flex items-center justify-center gap-3 shadow-md"
          >
            <Sparkles className="h-5 w-5" />
            Generate Prompts with AI for {items.length} image{items.length !== 1 ? 's' : ''}
          </button>
        )}
      </div>
    )
  }

  // ── STAGE: GENERATING ──────────────────────────────────────────────────
  if (stage === 'generating') {
    const pct = genProgress.total > 0
      ? Math.round((genProgress.current / genProgress.total) * 100)
      : 0

    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-light text-[#3d2535] mb-1">Generating Prompts</h1>
          <p className="text-sm text-[#7a5060]">Claude is analysing each image and writing prompts…</p>
        </div>

        {/* Progress bar */}
        <div className="bg-[#fff0eb] border border-[#edddd4] rounded-2xl p-8 mb-6 text-center">
          <Sparkles className="h-10 w-10 text-[#c9829e] mx-auto mb-4" />
          <p className="font-heading text-xl text-[#3d2535] mb-2">
            Generating {genProgress.current} / {genProgress.total}…
          </p>
          <div className="w-full bg-[#edddd4] rounded-full h-3 mb-2 overflow-hidden">
            <div
              className="h-3 rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #c9829e, #d4a574)' }}
            />
          </div>
          <p className="text-sm text-[#7a5060]">{pct}% complete</p>
        </div>

        {/* Mini status grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {items.map((item) => (
            <div key={item.id} className="relative rounded-xl overflow-hidden aspect-square border border-[#edddd4]">
              <Image src={item.preview} alt={item.title} fill className="object-cover" />
              <div className="absolute inset-0 flex items-center justify-center">
                {item.status === 'generating' && (
                  <div className="bg-[#3d2535]/70 rounded-full p-1.5">
                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                  </div>
                )}
                {item.status === 'done' && (
                  <div className="bg-emerald-500/80 rounded-full p-1.5">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                )}
                {item.status === 'error' && (
                  <div className="bg-red-500/80 rounded-full p-1.5">
                    <AlertCircle className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── STAGE: REVIEW & EDIT ───────────────────────────────────────────────
  if (stage === 'review') {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-light text-[#3d2535] mb-1">Review & Edit</h1>
            <p className="text-sm text-[#7a5060]">
              {items.filter((i) => i.status === 'done').length} of {items.length} generated successfully. Edit any field before saving.
            </p>
          </div>
          <button
            onClick={() => setStage('upload')}
            className="flex items-center gap-2 text-sm text-[#7a5060] hover:text-[#3d2535] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        <div className="space-y-6 mb-8">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-[#fff0eb] border border-[#edddd4] rounded-2xl overflow-hidden"
            >
              <div className="flex gap-0">
                {/* Thumbnail */}
                <div className="relative w-40 shrink-0 self-stretch min-h-[200px]">
                  <Image src={item.preview} alt={item.title} fill className="object-cover" />
                  {item.status === 'error' && (
                    <div className="absolute inset-0 bg-red-500/20 flex items-end p-2">
                      <span className="text-[10px] text-red-700 bg-red-100 rounded px-1">{item.error}</span>
                    </div>
                  )}
                </div>

                {/* Fields */}
                <div className="flex-1 p-5 grid grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-medium text-[#7a5060] mb-1">Title</label>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateItem(item.id, { title: e.target.value })}
                      className={inputClass}
                    />
                  </div>

                  {/* Category */}
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-medium text-[#7a5060] mb-1">Category</label>
                    <select
                      value={item.categoryId}
                      onChange={(e) => updateItem(item.id, { categoryId: e.target.value })}
                      className={inputClass}
                    >
                      <option value="">No category</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  {/* Tags */}
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-[#7a5060] mb-1">Tags</label>
                    <div className="flex flex-wrap gap-1.5">
                      {TAG_OPTIONS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleItemTag(item.id, tag, item.tags)}
                          className={`px-2.5 py-1 rounded-[30px] text-xs font-medium transition-colors ${
                            item.tags.includes(tag)
                              ? 'bg-[#3d2535] text-[#fdf8f5]'
                              : 'bg-[#fdf8f5] border border-[#edddd4] text-[#7a5060] hover:border-[#c9829e]'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Image prompt */}
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-medium text-[#7a5060] mb-1">Image Prompt</label>
                    <textarea
                      value={item.imagePrompt}
                      onChange={(e) => updateItem(item.id, { imagePrompt: e.target.value })}
                      rows={5}
                      placeholder={item.status === 'error' ? 'Generation failed — type manually' : ''}
                      className={`${inputClass} resize-y`}
                    />
                  </div>

                  {/* Motion prompt */}
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-medium text-[#7a5060] mb-1">Motion Prompt</label>
                    <textarea
                      value={item.motionPrompt}
                      onChange={(e) => updateItem(item.id, { motionPrompt: e.target.value })}
                      rows={5}
                      placeholder={item.status === 'error' ? 'Generation failed — type manually' : ''}
                      className={`${inputClass} resize-y`}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {saveError && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 mb-4">
            {saveError}
          </div>
        )}

        <button
          onClick={saveAll}
          disabled={saving}
          className="btn-gradient w-full py-4 text-base font-semibold text-white flex items-center justify-center gap-3 shadow-md disabled:opacity-60"
        >
          {saving
            ? <><Loader2 className="h-5 w-5 animate-spin" />Saving to library…</>
            : <><Save className="h-5 w-5" />Save All {items.length} Prompts to Library</>
          }
        </button>
      </div>
    )
  }

  // ── STAGE: SAVED ───────────────────────────────────────────────────────
  if (stage === 'saved') {
    return (
      <div className="p-8 max-w-xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="h-20 w-20 rounded-full bg-[#c9829e]/15 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-[#c9829e]" />
          </div>
          <h1 className="font-heading text-4xl font-light text-[#3d2535] mb-3">Done!</h1>
          <p className="text-[#7a5060] text-lg mb-8">
            {savedCount} prompt{savedCount !== 1 ? 's' : ''} added to your library.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/admin/prompts"
              className="btn-gradient px-8 py-3 font-semibold text-white text-sm inline-flex items-center justify-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              View in Prompts
            </Link>
            <button
              onClick={() => {
                setItems([])
                setGlobalCategoryId('')
                setGlobalTags([])
                setStage('upload')
              }}
              className="px-8 py-3 rounded-[30px] font-medium border border-[#edddd4] text-[#7a5060] hover:border-[#c9829e] hover:text-[#3d2535] transition-all text-sm"
            >
              Upload More
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
