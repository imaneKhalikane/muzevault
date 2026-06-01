import Link from 'next/link'
import Image from 'next/image'
import { Copy, Sparkles, Zap, ImageIcon, Video, BookOpen, Tag, RefreshCw, Download } from 'lucide-react'

const AVATAR_IMAGES = [
  '/avatars/2026-04-29 Image OpenArt - 8b24ce84.png',
  '/avatars/2026-04-29 Image OpenArt - 9738ef80.png',
  '/avatars/2026-04-29 Image OpenArt - 9edc5f28 (v1).png',
  '/avatars/2026-04-29 Image OpenArt - a3c3b85b.png',
  '/avatars/2026-05-07 Image OpenArt - 25dcc78d.png',
  '/avatars/2026-05-07 Image OpenArt - 5f1e022a.png',
  '/avatars/2026-05-07 Image OpenArt - 938bebc3.png',
  '/avatars/2026-05-07 Image OpenArt - dc467a8a.png',
  '/avatars/openart-ec79c9ee424f4e329c536fef10967e04_raw_1777901070125_be642075 (1).png',
]

// Fill 12 slots by cycling through the 9 images
const HERO_GRID = Array.from({ length: 12 }, (_, i) => AVATAR_IMAGES[i % AVATAR_IMAGES.length])

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Copy an Image Prompt',
    description: 'Browse our curated library of AI avatar prompts and copy the one that fits your vision.',
    icon: Copy,
  },
  {
    step: '02',
    title: 'Generate Your AI Avatar',
    description: 'Paste the prompt into your preferred AI image generator and create your talking-head avatar.',
    icon: Sparkles,
  },
  {
    step: '03',
    title: 'Animate with a Motion Prompt',
    description: 'Use the paired motion prompt to bring your avatar to life with realistic movement.',
    icon: Zap,
  },
]

const FEATURES = [
  { icon: ImageIcon, title: '100+ Image Prompts', desc: 'Hand-crafted prompts for stunning AI avatars' },
  { icon: Video, title: 'Motion Prompts', desc: 'Paired animation prompts for every image' },
  { icon: Tag, title: 'Tagged & Categorised', desc: 'Filter by Ad campaign, UGC, Editorial & more' },
  { icon: BookOpen, title: 'New Prompts Weekly', desc: 'Fresh content added every week' },
  { icon: RefreshCw, title: 'Multi-Style Library', desc: 'Portraits, editorial, commercial & more' },
  { icon: Download, title: 'Lifetime Access', desc: 'One payment — yours forever' },
]

export default function LandingPage() {
  const stanUrl = process.env.NEXT_PUBLIC_STAN_STORE_URL || '#'

  return (
    <div className="min-h-screen bg-[#fdf8f5]">
      {/* ── NAV ── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-[#edddd4] bg-[#fdf8f5]/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div>
            <span className="font-heading text-xl font-semibold text-[#3d2535] tracking-wide">
              Solène
            </span>
            <div className="site-subtitle">AI Creator Vault</div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-[#7a5060] hover:text-[#3d2535] transition-colors font-medium">
              Sign In
            </Link>
            <Link href="https://www.studiolumai.com/muzevaultorder" className="btn-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-sm">
              Get Access
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Avatar image grid */}
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-3 gap-0.5">
          {HERO_GRID.map((src, i) => (
            <div key={i} className="relative overflow-hidden">
              <Image
                src={src}
                alt=""
                fill
                className="object-cover object-top"
                sizes="25vw"
                priority={i < 4}
              />
              {/* Per-cell brand gradient overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to bottom, rgba(201,130,158,0.5) 0%, rgba(61,37,53,0.7) 100%)',
                }}
              />
            </div>
          ))}
        </div>
        {/* Additional fade to background at very bottom so content blends in */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#fdf8f5]" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 backdrop-blur-sm px-4 py-1.5 text-sm text-white mb-8 font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            AI Creator Vault
          </div>

          <h1 className="font-heading text-6xl md:text-8xl font-light tracking-tight leading-[1.05] text-white mb-4 drop-shadow-md">
            Prompt like a director.
          </h1>
          <h1 className="font-heading text-6xl md:text-8xl font-light tracking-tight leading-[1.05] mb-8 drop-shadow-md">
            <span className="gradient-text">Create like a visionary.</span>
          </h1>

          <p className="text-base md:text-lg text-white/80 max-w-xl mx-auto mb-10 leading-relaxed font-light">
            Unlock a curated vault of AI avatar image prompts and motion prompts — everything you
            need to create professional talking-head videos without a camera.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="https://www.studiolumai.com/muzevaultorder"
              className="btn-gradient w-full sm:w-auto px-9 py-4 text-base font-semibold text-white shadow-md"
            >
              Get Access — $9 Lifetime Deal
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-9 py-4 rounded-[30px] text-base font-medium border border-[#edddd4] text-[#7a5060] hover:border-[#c9829e] hover:text-[#3d2535] hover:bg-[#fff0eb] transition-all"
            >
              I Already Purchased →
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-6 bg-[#fdf8f5]">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl md:text-5xl font-light text-[#3d2535] mb-3">
              How It Works
            </h2>
            <p className="text-[#7a5060] font-light">Three steps from prompt to video-ready avatar</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map(({ step, title, description, icon: Icon }) => (
              <div
                key={step}
                className="relative bg-[#fff0eb] border border-[#edddd4] rounded-2xl p-8 hover:border-[#e8b4c8] transition-colors"
              >
                <div className="absolute top-6 right-6 font-heading text-5xl font-light text-[#edddd4]">
                  {step}
                </div>
                <div className="h-11 w-11 rounded-xl bg-[#c9829e]/10 flex items-center justify-center mb-6">
                  <Icon className="h-5 w-5 text-[#c9829e]" />
                </div>
                <h3 className="font-heading text-xl font-medium text-[#3d2535] mb-3">{title}</h3>
                <p className="text-[#7a5060] leading-relaxed text-sm font-light">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT'S INSIDE ── */}
      <section className="py-24 px-6 bg-[#fff0eb]">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl md:text-5xl font-light text-[#3d2535] mb-3">
              What&apos;s Inside
            </h2>
            <p className="text-[#7a5060] font-light">Everything you need to create AI talking-head videos</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex items-start gap-4 bg-[#fdf8f5] border border-[#edddd4] rounded-xl p-6 hover:border-[#e8b4c8] transition-colors"
              >
                <div className="h-10 w-10 shrink-0 rounded-lg bg-[#c9829e]/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-[#c9829e]" />
                </div>
                <div>
                  <h3 className="font-medium text-[#3d2535] mb-1">{title}</h3>
                  <p className="text-sm text-[#7a5060] font-light">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-32 px-6 bg-[#fdf8f5]">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-5xl md:text-6xl font-light text-[#3d2535] mb-6 leading-tight">
            Ready to build your{' '}
            <span className="gradient-text">AI brand?</span>
          </h2>
          <p className="text-[#7a5060] text-lg mb-8 font-light">
            Join creators using Solène&apos;s vault to produce professional AI content — no camera, no
            studio, no limits.
          </p>
          <Link
            href="https://www.studiolumai.com/muzevaultorder"
            className="inline-block btn-gradient px-12 py-5 text-lg font-semibold text-white shadow-lg"
          >
            Get Access — $9 Lifetime Deal
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#edddd4] py-8 px-6 bg-[#fff0eb]">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-heading text-base font-semibold text-[#3d2535]">Solène</span>
            <div className="site-subtitle mt-0.5">AI Creator Vault</div>
          </div>
          <p className="text-sm text-[#7a5060]">
            © {new Date().getFullYear()} Solène. All rights reserved.
          </p>
          <Link href="/login" className="text-sm text-[#7a5060] hover:text-[#3d2535] transition-colors">
            Member Login
          </Link>
        </div>
      </footer>
    </div>
  )
}
