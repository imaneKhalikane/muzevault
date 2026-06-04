'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X, Loader2 } from 'lucide-react'
import { uploadViaPresign } from '@/lib/uploadViaPresign'

interface Props {
  value: string
  onChange: (url: string) => void
}

export default function ImageUpload({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function uploadFile(file: File) {
    if (!file.type.startsWith('image/')) { setError('Please upload an image file.'); return }
    setError('')
    setUploading(true)
    try {
      const url = await uploadViaPresign(file)
      onChange(url)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      {value ? (
        <div className="relative h-48 rounded-xl overflow-hidden border border-[#edddd4] group">
          <Image src={value} alt="Uploaded" fill className="object-cover" />
          <div className="absolute inset-0 bg-[#3d2535]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button type="button" onClick={() => inputRef.current?.click()}
              className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
              Replace
            </button>
            <button type="button" onClick={() => onChange('')}
              className="bg-red-100/80 hover:bg-red-200/80 text-red-600 p-1.5 rounded-lg transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) uploadFile(f) }}
          onClick={() => inputRef.current?.click()}
          className={`h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
            dragging ? 'border-[#c9829e] bg-[#c9829e]/5' : 'border-[#edddd4] hover:border-[#e8b4c8] hover:bg-[#fff0eb]'
          }`}
        >
          {uploading ? (
            <><Loader2 className="h-8 w-8 text-[#c9829e] animate-spin mb-2" /><p className="text-sm text-[#7a5060]">Uploading…</p></>
          ) : (
            <><Upload className="h-8 w-8 text-[#c5adb8] mb-2" /><p className="text-sm font-medium text-[#7a5060]">Drop image here or click to browse</p><p className="text-xs text-[#c5adb8] mt-1">PNG, JPG, WEBP up to 10MB</p></>
          )}
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f) }} />
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  )
}
