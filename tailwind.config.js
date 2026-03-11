/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aura: {
          /* ── Backgrounds ── */
          bg:           '#E7DFD9',   // warm parchment — page background
          surface:      '#F0EAE3',   // slightly elevated surfaces
          card:         '#FDFAF7',   // card background (near-white warm)

          /* ── Borders ── */
          border:       '#D9CFC6',   // default border
          'border-dark':'#C0B0A3',   // hover / focus border

          /* ── Navigation (dark) ── */
          nav:          '#1D1C1B',   // navbar / sidebar background
          'nav-hover':  '#2E2C2A',   // nav item hover

          /* ── Accents ── */
          primary:      '#E6670A',   // burnt orange — main CTA
          'primary-dark':'#C85500',  // hover/pressed
          secondary:    '#F88903',   // amber — secondary accent

          /* ── Text ── */
          ink:          '#1D1C1B',   // primary text (dark)
          muted:        '#78716C',   // secondary text (stone-500)
          faint:        '#A8998F',   // placeholder / disabled
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'card':     '0 1px 4px rgba(29,28,27,0.08), 0 4px 16px rgba(29,28,27,0.06)',
        'card-md':  '0 2px 8px rgba(29,28,27,0.10), 0 8px 24px rgba(29,28,27,0.08)',
        'glow':     '0 0 28px rgba(230,103,10,0.25)',
        'glow-sm':  '0 0 12px rgba(230,103,10,0.18)',
        'nav':      '0 2px 12px rgba(29,28,27,0.30)',
      },
      backgroundImage: {
        'aura-gradient':   'linear-gradient(135deg,#E6670A,#F88903)',
        'aura-gradient-r': 'linear-gradient(to right,#E6670A,#F88903)',
        'nav-gradient':    'linear-gradient(180deg,#1D1C1B,#2A2826)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.22s ease-out both',
        shimmer:   'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
}
