'use client'

import { type Category } from '@/lib/types'
import clsx from 'clsx'

interface Props {
  categories: Category[]
  active: string
  onChange: (slug: string) => void
}

export default function CategoryFilter({ categories, active, onChange }: Props) {
  const all = [{ id: 'all', name: 'All', slug: 'all' }, ...categories]

  return (
    <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
      {all.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.slug)}
          className={clsx(
            'flex-shrink-0 px-4 py-2 rounded-[30px] text-sm font-medium transition-all',
            active === cat.slug
              ? 'bg-[#3d2535] text-[#fdf8f5]'
              : 'bg-transparent border border-[#edddd4] text-[#7a5060] hover:border-[#c9829e] hover:text-[#3d2535]'
          )}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}
