'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Video, CheckCircle, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { type Category, type Prompt } from '@/lib/types'
import { uploadViaPresign } from '@/lib/uploadViaPresign'
import ImageUpload from './ImageUpload'

const TAG_OPTIONS = ['Ad campaign', 'UGC', 'Editorial', 'Portrait', 'Commercial', 'Lifestyle', 'Fashion', 'Beauty']

interface Props {
  categories: Category[]
  prompt?: Prompt
}

export default function PromptForm({ categories, prompt }: Props) {
  const router = useRouter()
  const isEdit = !!prompt

  const [title, setTitle] = useState(prompt?.title ?? '')
  const [categoryId, setCategoryId] = useState(prompt?.category_id ?? '')
  const [tags, setTags] = useState<string[]>(prompt?.tags ?? [])
  const [imageUrl, setImageUrl] = useState(prompt?.image_url ?? '')
  const [imagePrompt, setImagePrompt] = useState(prompt?.image_prompt ?? '')
  const [motionPrompt, setMotionPrompt] = useState(prompt?.motion_prompt ?? '')
  const [videoUrl, setVideoUrl] = useState(prompt?.video_url ?? '')
  const [videoUploading, setVideoUploading] = useState(false)
  const [customTag, setCustomTag] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function toggleTag(tag: string) {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])
  }

  function addCustomTag() {
    const t = customTag.trim()
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t])
    setCustomTag('')
  }

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setVideoUploading(true)
    try {
      const url = await uploadViaPresign(file)
      setVideoUrl(url)
    } catch (err) {
      console.error('[video-upload]', err)
      setError('Video upload failed. Please try again.')
    } finally {
      setVideoUploading(false)
      e.target.value = ''
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const supabase = createClient()
      const payload = {
        title,
        category_id: categoryId || null,
        tags,
        image_url: imageUrl,
        image_prompt: imagePrompt,
        motion_prompt: motionPrompt || null,
        video_url: videoUrl || null,
      }
      if (isEdit) {
        const { error: err } = await supabase.from('prompts').update(payload).eq('id', prompt.id)
        if (err) throw err
      } else {
        const { error: err } = await supabase.from('prompts').insert(payload)
        if (err) throw err
      }
      router.push('/admin/prompts')
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "w-full bg-[#fdf8f5] border border-[#edddd4] rounded-xl px-4 py-3 text-[#3d2535] placeholder-[#c5adb8] focus:outline-none focus:border-[#c9829e] transition-colors text-sm"

  return (
    <form onSubmit={handleSave} className="max-w-2xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-[#7a5060] mb-2">Title *</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Cinematic Female Portrait" className={inputClass} />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-[#7a5060] mb-2">Category</label>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
          <option value="">Select a category</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-[#7a5060] mb-2">Tags</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {TAG_OPTIONS.map((tag) => (
            <button key={tag} type="button" onClick={() => toggleTag(tag)}
              className={`px-3 py-1.5 rounded-[30px] text-xs font-medium transition-colors ${tags.includes(tag) ? 'bg-[#3d2535] text-[#fdf8f5]' : 'bg-[#fdf8f5] border border-[#edddd4] text-[#7a5060] hover:border-[#c9829e]'}`}>
              {tag}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={customTag} onChange={(e) => setCustomTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
            placeholder="Add custom tag…" className={`flex-1 ${inputClass}`} />
          <button type="button" onClick={addCustomTag} className="px-4 py-2.5 rounded-xl bg-[#fff0eb] border border-[#edddd4] text-sm text-[#7a5060] hover:text-[#3d2535] transition-colors">
            Add
          </button>
        </div>
        {tags.filter((t) => !TAG_OPTIONS.includes(t)).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.filter((t) => !TAG_OPTIONS.includes(t)).map((t) => (
              <span key={t} className="flex items-center gap-1 bg-[#c9829e]/10 text-[#c9829e] text-xs px-2 py-1 rounded-lg">
                {t}
                <button type="button" onClick={() => setTags((prev) => prev.filter((x) => x !== t))} className="hover:text-[#3d2535]">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Image */}
      <div>
        <label className="block text-sm font-medium text-[#7a5060] mb-2">Image</label>
        <ImageUpload value={imageUrl} onChange={setImageUrl} />
      </div>

      {/* Image prompt */}
      <div>
        <label className="block text-sm font-medium text-[#7a5060] mb-2">Image Prompt</label>
        <textarea value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} rows={6}
          placeholder="Paste the full image generation prompt here…" className={`${inputClass} resize-y`} />
      </div>

      {/* Motion prompt */}
      <div>
        <label className="block text-sm font-medium text-[#7a5060] mb-2">
          Motion Prompt <span className="text-[#c5adb8] font-normal">(optional)</span>
        </label>
        <textarea value={motionPrompt} onChange={(e) => setMotionPrompt(e.target.value)} rows={6}
          placeholder="Paste the motion / animation prompt here…" className={`${inputClass} resize-y`} />
      </div>

      {/* Video upload — only shown when motion prompt exists */}
      {motionPrompt.trim() && (
        <div>
          <label className="block text-sm font-medium text-[#7a5060] mb-2 flex items-center gap-1.5">
            <Video className="h-4 w-4 text-[#c9829e]" />
            Motion Video <span className="text-[#c5adb8] font-normal">(optional)</span>
          </label>

          {videoUrl ? (
            <div className="space-y-3">
              {/* Preview player */}
              <div className="rounded-xl overflow-hidden bg-black aspect-video border border-[#edddd4]">
                <video src={videoUrl} controls className="w-full h-full object-contain" />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-emerald-600 flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" />Video ready
                </span>
                <label className="text-xs text-[#c9829e] cursor-pointer hover:text-[#3d2535] transition-colors font-medium">
                  Replace video
                  <input type="file" accept=".mp4,.mov,.webm,video/*" className="hidden"
                    onChange={handleVideoUpload} disabled={videoUploading} />
                </label>
                <button type="button" onClick={() => setVideoUrl('')}
                  className="text-xs text-[#7a5060] hover:text-red-500 transition-colors flex items-center gap-1">
                  <X className="h-3 w-3" />Remove
                </button>
              </div>
            </div>
          ) : (
            <label className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer transition-all py-10 ${
              videoUploading
                ? 'border-[#c9829e] bg-[#c9829e]/5 cursor-not-allowed'
                : 'border-[#edddd4] hover:border-[#e8b4c8] hover:bg-[#fff0eb]'
            }`}>
              {videoUploading ? (
                <>
                  <Loader2 className="h-8 w-8 text-[#c9829e] animate-spin" />
                  <span className="text-sm text-[#7a5060]">Uploading video…</span>
                </>
              ) : (
                <>
                  <Video className="h-8 w-8 text-[#c5adb8]" />
                  <span className="text-sm font-medium text-[#7a5060]">Upload Motion Video</span>
                  <span className="text-xs text-[#c5adb8]">MP4, MOV, WEBM · drag & drop or click</span>
                </>
              )}
              <input type="file" accept=".mp4,.mov,.webm,video/*" className="hidden"
                onChange={handleVideoUpload} disabled={videoUploading} />
            </label>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={saving || videoUploading} className="btn-gradient px-6 py-3 font-semibold text-white flex items-center gap-2 disabled:opacity-60">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? 'Save Changes' : 'Create Prompt'}
        </button>
        <button type="button" onClick={() => router.push('/admin/prompts')}
          className="px-6 py-3 rounded-[30px] font-medium border border-[#edddd4] text-[#7a5060] hover:text-[#3d2535] hover:border-[#c9829e] transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}
