'use client'

import Image from 'next/image'
import { type Prompt } from '@/lib/types'

interface Props {
  prompt: Prompt
  onClick: () => void
}

export default function PromptCard({ prompt, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-[#fff0eb] border border-[#edddd4] hover:border-[#e8b4c8] hover:shadow-md transition-all hover:scale-[1.02] duration-200 text-left w-full"
    >
      {/* Image */}
      {prompt.image_url ? (
        <Image
          src={prompt.image_url}
          alt={prompt.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
          <span className="text-4xl">🎭</span>
        </div>
      )}

      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#3d2535]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Motion badge */}
      {prompt.motion_prompt && (
        <div className="absolute top-2 left-2 bg-[#c9829e] text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide shadow-sm">
          Motion
        </div>
      )}

      {/* Title on hover */}
      <div className="absolute bottom-0 inset-x-0 p-3 translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
        <p className="text-xs font-semibold text-white line-clamp-2">{prompt.title}</p>
      </div>
    </button>
  )
}
