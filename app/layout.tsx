import type { Metadata } from 'next'
import './globals.css'
import AuthHashHandler from '@/components/AuthHashHandler'

export const metadata: Metadata = {
  title: 'Solène — AI Creator Vault',
  description: 'Curated AI avatar prompts by Solène. Prompt like a director. Create like a visionary.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#fdf8f5] text-[#3d2535] antialiased">
        <AuthHashHandler />
        {children}
      </body>
    </html>
  )
}
