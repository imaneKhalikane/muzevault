'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Copy, Check, ChevronDown } from 'lucide-react'
import { type Prompt } from '@/lib/types'
import clsx from 'clsx'

interface Props {
  prompts: Prompt[]
  initialIndex: number
  onClose: () => void
}

export default function PromptModal({ prompts, initialIndex, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex)
  const [tab, setTab] = useState<'image' | 'motion'>('image')
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const prompt = prompts[index]

  const prev = useCallback(() => { setIndex((i) => (i > 0 ? i - 1 : prompts.length - 1)); setTab('image'); setExpanded(false) }, [prompts.length])
  const next = useCallback(() => { setIndex((i) => (i < prompts.length - 1 ? i + 1 : 0)); setTab('image'); setExpanded(false) }, [prompts.length])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, prev, next])

  const activePromptText = tab === 'image' ? prompt.image_prompt : prompt.motion_prompt

  async function copyPrompt() {
    if (!activePromptText) return
    await navigator.clipboard.writeText(activePromptText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3d2535]/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-[90vw] max-h-[90vh] bg-[#fdf8f5] border border-[#edddd4] rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-xl">

        {/* ── LEFT: IMAGE (60%) ── */}
        <div className="relative md:w-[60%] bg-[#1a1014] flex-shrink-0 flex items-center justify-center">
          {/* Fixed height on mobile, full height on desktop */}
          <div className="relative w-full h-72 md:h-full md:min-h-[500px]">
            {prompt.image_url ? (
              <Image
                src={prompt.image_url}
                alt={prompt.title}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 90vw, 54vw"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                <span className="text-8xl">🎭</span>
              </div>
            )}
          </div>

          {/* Image / Motion toggle */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#fdf8f5]/80 backdrop-blur-sm rounded-[30px] p-1 border border-[#edddd4]">
            <button
              onClick={() => setTab('image')}
              className={clsx(
                'px-3 py-1.5 rounded-[30px] text-xs font-medium transition-all',
                tab === 'image' ? 'bg-[#3d2535] text-[#fdf8f5]' : 'text-[#7a5060] hover:text-[#3d2535]'
              )}
            >
              Image
            </button>
            {prompt.motion_prompt && (
              <button
                onClick={() => setTab('motion')}
                className={clsx(
                  'px-3 py-1.5 rounded-[30px] text-xs font-medium transition-all',
                  tab === 'motion' ? 'bg-[#c9829e] text-white' : 'text-[#7a5060] hover:text-[#3d2535]'
                )}
              >
                Motion
              </button>
            )}
          </div>

          {/* Prev / Next */}
          <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-[#fdf8f5]/80 hover:bg-[#fff0eb] border border-[#edddd4] flex items-center justify-center text-[#3d2535] transition-colors shadow-sm">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-[#fdf8f5]/80 hover:bg-[#fff0eb] border border-[#edddd4] flex items-center justify-center text-[#3d2535] transition-colors shadow-sm">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* ── RIGHT: INFO (40%) ── */}
        <div className="md:w-[40%] flex flex-col overflow-y-auto bg-[#fdf8f5]">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-[#edddd4]">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#c9829e] to-[#d4a574] flex items-center justify-center text-sm font-bold text-white">
                S
              </div>
              <div>
                <p className="text-sm font-semibold text-[#3d2535] font-heading">Studio LumAI</p>
                <p className="text-xs text-[#7a5060]">AI Creator | AI Founder</p>
              </div>
            </div>
            <button onClick={onClose} className="h-8 w-8 rounded-full hover:bg-[#fff0eb] flex items-center justify-center text-[#7a5060] hover:text-[#3d2535] transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 p-5 space-y-4">
            <h2 className="font-heading text-xl font-medium text-[#3d2535] leading-snug">{prompt.title}</h2>

            {/* Badges */}
            <div className="flex items-center flex-wrap gap-2">
              {prompt.category && (
                <span className="bg-[#e8b4c8]/30 text-[#c9829e] border border-[#e8b4c8] text-xs font-medium px-3 py-1 rounded-full">
                  {prompt.category.name}
                </span>
              )}
              {prompt.tags?.map((tag) => (
                <span key={tag} className="bg-[#fff0eb] border border-[#edddd4] text-[#7a5060] text-xs px-3 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>

            {/* Prompt tabs */}
            <div className="border border-[#edddd4] rounded-xl overflow-hidden">
              <div className="flex border-b border-[#edddd4]">
                <button
                  onClick={() => setTab('image')}
                  className={clsx('flex-1 py-2.5 text-xs font-medium transition-colors', tab === 'image' ? 'bg-[#c9829e]/10 text-[#c9829e]' : 'text-[#7a5060] hover:text-[#3d2535] bg-[#fff0eb]')}
                >
                  Image Prompt
                </button>
                {prompt.motion_prompt && (
                  <button
                    onClick={() => setTab('motion')}
                    className={clsx('flex-1 py-2.5 text-xs font-medium transition-colors border-l border-[#edddd4]', tab === 'motion' ? 'bg-[#c9829e]/10 text-[#c9829e]' : 'text-[#7a5060] hover:text-[#3d2535] bg-[#fff0eb]')}
                  >
                    Motion Prompt
                  </button>
                )}
              </div>
              <div className="p-4 bg-[#fdf8f5]">
                {activePromptText ? (
                  <>
                    <p className={clsx('text-sm text-[#3d2535] leading-relaxed font-light', !expanded && 'line-clamp-3')}>
                      {activePromptText}
                    </p>
                    {activePromptText.length > 200 && (
                      <button onClick={() => setExpanded((v) => !v)} className="mt-2 flex items-center gap-1 text-xs text-[#c9829e] hover:text-[#3d2535] transition-colors">
                        {expanded ? 'See less' : 'See more'}
                        <ChevronDown className={clsx('h-3 w-3 transition-transform', expanded && 'rotate-180')} />
                      </button>
                    )}
                    <button onClick={copyPrompt} className="mt-3 flex items-center gap-1.5 text-xs text-[#7a5060] hover:text-[#3d2535] transition-colors">
                      <Copy className="h-3 w-3" />Copy text
                    </button>
                  </>
                ) : (
                  <p className="text-sm text-[#c5adb8] italic">No prompt available.</p>
                )}
              </div>
            </div>
          </div>

          {/* Sticky footer CTA */}
          <div className="p-5 border-t border-[#edddd4] bg-[#fdf8f5]">
            <button
              onClick={copyPrompt}
              disabled={!activePromptText}
              className="w-full btn-gradient py-3.5 font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {copied ? <><Check className="h-4 w-4" />Copied!</> : <><Copy className="h-4 w-4" />Copy Prompt</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
