'use client'

import { useEffect, useState } from 'react'
import { X, Copy, Sparkles, Zap } from 'lucide-react'

const STEPS = [
  { icon: Copy, label: 'Copy Image Prompt', desc: 'Tap any card and copy the image prompt' },
  { icon: Sparkles, label: 'Generate Your Image', desc: 'Use Midjourney, Flux, or your favourite AI tool' },
  { icon: Zap, label: 'Animate It', desc: 'Switch to the Motion Prompt and bring it to life' },
]

export default function OnboardingTooltip() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('muzevault-onboarding-dismissed')) setVisible(true)
  }, [])

  function dismiss() {
    localStorage.setItem('muzevault-onboarding-dismissed', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="relative bg-[#fff0eb] border border-[#edddd4] rounded-2xl p-6 mb-8">
      <button onClick={dismiss} className="absolute top-4 right-4 text-[#7a5060] hover:text-[#3d2535] transition-colors">
        <X className="h-5 w-5" />
      </button>
      <h3 className="font-heading text-xl font-medium text-[#3d2535] mb-1">How to Use These Prompts</h3>
      <p className="text-sm text-[#7a5060] mb-6 font-light">Follow these 3 steps to create your AI talking-head video</p>
      <div className="grid sm:grid-cols-3 gap-4">
        {STEPS.map(({ icon: Icon, label, desc }, i) => (
          <div key={label} className="flex items-start gap-3">
            <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-[#c9829e]/10 flex items-center justify-center">
              <Icon className="h-4 w-4 text-[#c9829e]" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#c9829e] mb-1">Step {i + 1}</div>
              <p className="text-sm font-medium text-[#3d2535]">{label}</p>
              <p className="text-xs text-[#7a5060] mt-0.5 font-light">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
