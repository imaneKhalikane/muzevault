import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#fdf8f5',
        card: '#fff0eb',
        'card-hover': '#fde8de',
        accent: '#c9829e',
        blush: '#e8b4c8',
        gold: '#d4a574',
        primary: '#3d2535',
        muted: '#7a5060',
        border: '#edddd4',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        heading: ['Cormorant Garamond', 'serif'],
      },
      backgroundImage: {
        'gradient-cta': 'linear-gradient(to right, #c9829e, #d4a574)',
      },
      borderRadius: {
        cta: '30px',
      },
    },
  },
  plugins: [],
}
export default config
