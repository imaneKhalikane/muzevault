'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, FileText, Tag, Upload, LogOut } from 'lucide-react'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/prompts', label: 'Prompts', icon: FileText, exact: false },
  { href: '/admin/categories', label: 'Categories', icon: Tag, exact: false },
  { href: '/admin/bulk-upload', label: 'Bulk Upload', icon: Upload, exact: false },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-60 flex-shrink-0 bg-[#fff0eb] border-r border-[#edddd4] min-h-screen flex flex-col">
      <div className="p-6 border-b border-[#edddd4]">
        <Link href="/admin">
          <span className="font-heading text-lg font-semibold text-[#3d2535]">Studio LumAI</span>
          <div className="site-subtitle mt-0.5">AI Creator Vault</div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                active
                  ? 'bg-[#c9829e]/15 text-[#c9829e]'
                  : 'text-[#7a5060] hover:bg-[#fde8de] hover:text-[#3d2535]'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-[#edddd4]">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#7a5060] hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}
