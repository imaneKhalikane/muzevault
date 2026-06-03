import Link from 'next/link'
import Image from 'next/image'
import { Copy, Sparkles, Zap, ImageIcon, Video, BookOpen, Tag, RefreshCw, Download, Star, DollarSign, Users, TrendingUp } from 'lucide-react'

const HERO_GRID = [
  '/hero/2026-05-25 Editorial Higgsfield 008.png',
  '/hero/2026-05-25 Editorial Higgsfield 009.png',
  '/hero/2026-05-25 Editorial Higgsfield 012.png',
  '/hero/2026-05-25 Editorial Higgsfield 013.png',
  '/hero/2026-05-25 Editorial Higgsfield 016.png',
  '/hero/2026-05-25 Editorial Higgsfield 017.png',
  '/hero/2026-05-25 Portrait Higgsfield 012.png',
  '/hero/2026-05-25 Portrait Higgsfield 017.png',
]

const CAROUSEL_IMAGES = [
  '/hero/2026-05-25 Editorial Higgsfield 008.png',
  '/hero/2026-05-25 Editorial Higgsfield 009.png',
  '/hero/2026-05-25 Editorial Higgsfield 012.png',
  '/hero/2026-05-25 Editorial Higgsfield 013.png',
  '/hero/2026-05-25 Editorial Higgsfield 015.png',
  '/hero/2026-05-25 Editorial Higgsfield 016.png',
  '/hero/2026-05-25 Editorial Higgsfield 017.png',
  '/hero/2026-05-25 Editorial Higgsfield 018.png',
  '/hero/2026-05-25 Portrait Higgsfield 012.png',
  '/hero/2026-05-25 Portrait Higgsfield 017.png',
  '/hero/2026-05-25 Travel Higgsfield 025.png',
  '/hero/hf_20260602_092513_d48fbe36-bb9a-4df1-acbb-6bb1b99ac558.png',
]

const TESTIMONIALS = [
  {
    name: 'Camille R.',
    role: 'UGC Creator · 42k followers',
    avatar: 'C',
    text: "I was spending hours trying to write prompts from scratch. Solène's vault changed everything — I generated 3 avatars in 20 minutes and they all looked like proper editorial shoots.",
    stars: 5,
  },
  {
    name: 'Maya T.',
    role: 'Content Strategist',
    avatar: 'M',
    text: 'The motion prompts are what got me. My talking-head videos now look like they were directed by someone. No camera, no crew — just the vault and an AI tool.',
    stars: 5,
  },
  {
    name: 'Léa D.',
    role: 'AI Entrepreneur · 28k followers',
    avatar: 'L',
    text: "Worth every cent. I've tried other prompt packs but nothing comes close to the quality and variety here. The editorial category alone is gold.",
    stars: 5,
  },
  {
    name: 'Sophia K.',
    role: 'Brand Consultant',
    avatar: 'S',
    text: "Finally a product built by someone who actually creates content. You can tell every prompt was tested and refined. My AI brand looks cohesive and professional.",
    stars: 5,
  },
]

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
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-2 gap-0.5">
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
              Get Access — $39 Lifetime Deal
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

      {/* ── CAROUSEL ── */}
      <section className="py-16 bg-[#fdf8f5] overflow-hidden">
        <div className="text-center mb-10">
          <p className="site-subtitle mb-2">From the vault</p>
          <h2 className="font-heading text-3xl md:text-4xl font-light text-[#3d2535]">
            Latest AI Avatars
          </h2>
        </div>
        <div className="relative overflow-hidden">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none bg-gradient-to-r from-[#fdf8f5] to-transparent" />
          <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none bg-gradient-to-l from-[#fdf8f5] to-transparent" />
          <div className="flex animate-marquee gap-3" style={{ width: 'max-content' }}>
            {[...CAROUSEL_IMAGES, ...CAROUSEL_IMAGES].map((src, i) => (
              <div key={i} className="relative flex-shrink-0 w-[220px] h-[310px] rounded-2xl overflow-hidden shadow-sm">
                <Image src={src} alt="" fill className="object-cover object-top" sizes="220px" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#3d2535]/20 to-transparent" />
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

      {/* ── COMMISSION ── */}
      <section className="py-24 px-6 bg-[#3d2535] overflow-hidden relative">
        {/* Decorative blobs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #c9829e, transparent)' }} />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #d4a574, transparent)' }} />

        <div className="mx-auto max-w-5xl relative z-10">
          <div className="text-center mb-14">
            <p className="site-subtitle text-[#c9829e] mb-3">Affiliate Program</p>
            <h2 className="font-heading text-4xl md:text-5xl font-light text-white mb-4">
              Earn <span className="gradient-text">60% commission</span><br />on every sale you refer
            </h2>
            <p className="text-white/60 font-light max-w-xl mx-auto">
              Share your unique link. When someone buys through you, you keep 60% — automatically paid out. No cap, no minimum.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5 mb-12">
            {[
              { icon: DollarSign, value: '$23.40', label: 'Per sale you refer', sub: '60% of $39' },
              { icon: Users, value: 'Unlimited', label: 'Referrals allowed', sub: 'No cap, ever' },
              { icon: TrendingUp, value: 'Instant', label: 'Payout per conversion', sub: 'Automated payouts' },
            ].map(({ icon: Icon, value, label, sub }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-7 text-center hover:bg-white/10 transition-colors">
                <div className="h-11 w-11 rounded-xl bg-[#c9829e]/20 flex items-center justify-center mx-auto mb-4">
                  <Icon className="h-5 w-5 text-[#c9829e]" />
                </div>
                <p className="font-heading text-3xl font-light text-white mb-1">{value}</p>
                <p className="text-sm font-medium text-white/80">{label}</p>
                <p className="text-xs text-white/40 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="https://www.studiolumai.com/muzevaultorder"
              className="inline-flex items-center gap-2 btn-gradient px-8 py-4 text-base font-semibold text-white shadow-lg"
            >
              <Sparkles className="h-4 w-4" />
              Become an Affiliate
            </Link>
            <p className="text-white/40 text-sm mt-4 font-light">Free to join · Instant approval</p>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 px-6 bg-[#fff0eb]">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <p className="site-subtitle mb-2">What creators say</p>
            <h2 className="font-heading text-4xl md:text-5xl font-light text-[#3d2535]">
              Real results, real creators
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TESTIMONIALS.map(({ name, role, avatar, text, stars }) => (
              <div key={name} className="bg-[#fdf8f5] border border-[#edddd4] rounded-2xl p-6 flex flex-col gap-4 hover:border-[#e8b4c8] transition-colors">
                {/* Stars */}
                <div className="flex gap-0.5">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-[#c9829e] text-[#c9829e]" />
                  ))}
                </div>
                {/* Quote */}
                <p className="text-sm text-[#7a5060] leading-relaxed font-light flex-1">&ldquo;{text}&rdquo;</p>
                {/* Author */}
                <div className="flex items-center gap-3 pt-2 border-t border-[#edddd4]">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#c9829e] to-[#d4a574] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#3d2535]">{name}</p>
                    <p className="text-xs text-[#c5adb8]">{role}</p>
                  </div>
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
            Get Access — $39 Lifetime Deal
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
