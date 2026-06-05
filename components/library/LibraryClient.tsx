'use client'

import { useState, useMemo } from 'react'
import { Instagram, Video } from 'lucide-react'
import { type Category, type Prompt } from '@/lib/types'
import CategoryFilter from './CategoryFilter'
import PromptCard from './PromptCard'
import PromptModal from './PromptModal'
import OnboardingTooltip from './OnboardingTooltip'

interface Props {
  categories: Category[]
  prompts: Prompt[]
}

const BANNER_GRADIENTS = [
  'from-rose-100 to-pink-100',
  'from-pink-100 to-fuchsia-100',
  'from-amber-100 to-rose-100',
  'from-fuchsia-50 to-pink-100',
  'from-rose-50 to-amber-100',
  'from-pink-100 to-rose-100',
  'from-amber-50 to-pink-100',
  'from-rose-100 to-fuchsia-50',
]

export default function LibraryClient({ categories, prompts }: Props) {
  const [activeCategory, setActiveCategory] = useState('all')
  const [filterMotion, setFilterMotion] = useState(false)
  const [modalIndex, setModalIndex] = useState<number | null>(null)

  const filtered = useMemo(() => {
    let result = activeCategory === 'all'
      ? prompts
      : prompts.filter((p) => p.category?.slug === activeCategory)
    if (filterMotion) result = result.filter((p) => !!p.motion_prompt)
    return result
  }, [activeCategory, filterMotion, prompts])

  const FIXED_BANNER = [
    '/hero/2026-05-25 Editorial Higgsfield 015.png',
    '/hero/2026-05-25 Editorial Higgsfield 018.png',
    '/hero/2026-05-25 Travel Higgsfield 025.png',
    '/hero/hf_20260602_092513_d48fbe36-bb9a-4df1-acbb-6bb1b99ac558.png',
  ]

  return (
    <>
      {/* ── BANNER ── */}
      <div className="relative h-[420px] overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-4 gap-0.5">
          {FIXED_BANNER.map((src, i) => (
            <div key={i} className="relative overflow-hidden">
              <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover object-top" />
            </div>
          ))}
        </div>

        {/* Fade to background */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#fdf8f5]/20 to-[#fdf8f5]" />

        {/* Profile card — bottom left */}
        <div className="absolute bottom-4 left-6 flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#c9829e] to-[#d4a574] border-2 border-white/60 flex items-center justify-center text-lg font-bold text-white shadow-md">
            S
          </div>
          <div>
            <p className="font-heading font-semibold text-[#3d2535] text-sm drop-shadow">Solène</p>
            <p className="text-xs text-[#7a5060]">AI Creator | AI Founder</p>
          </div>
        </div>

        {/* Instagram — top right */}
        <a
          href="https://www.instagram.com/iamsolene.ai/"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-4 right-6 flex items-center gap-1.5 text-xs text-[#c9829e] bg-[#fdf8f5]/70 backdrop-blur-sm rounded-full px-3 py-1.5 border border-[#e8b4c8] hover:bg-[#fff0eb] transition-colors"
        >
          <Instagram className="h-3.5 w-3.5" />
          @iamsolene.ai
        </a>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <OnboardingTooltip />

        <div className="mb-8 space-y-3">
          <CategoryFilter categories={categories} active={activeCategory} onChange={(slug) => { setActiveCategory(slug); setModalIndex(null) }} />
          <div>
            <button
              type="button"
              onClick={() => { setFilterMotion((v) => !v); setModalIndex(null) }}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-[30px] text-sm font-medium transition-all border ${
                filterMotion
                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                  : 'bg-transparent border-[#edddd4] text-[#7a5060] hover:border-emerald-400 hover:text-emerald-600'
              }`}
            >
              <Video className="h-3.5 w-3.5" />
              Motion only
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-24 text-[#7a5060]">
            <p className="font-heading text-2xl font-light">No prompts in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((prompt, i) => (
              <PromptCard key={prompt.id} prompt={prompt} onClick={() => setModalIndex(i)} />
            ))}
          </div>
        )}
      </div>

      {modalIndex !== null && (
        <PromptModal prompts={filtered} initialIndex={modalIndex} onClose={() => setModalIndex(null)} />
      )}
    </>
  )
}
