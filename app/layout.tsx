import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Studio LumAI — AI Creator Vault',
  description: 'Prompt like a director. Create like a visionary.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#fdf8f5] text-[#3d2535] antialiased">{children}</body>
    </html>
  )
}
