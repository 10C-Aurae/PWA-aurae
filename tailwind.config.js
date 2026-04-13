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
          bg:            '#0D0B1C',   // deep indigo-dark — página principal
          surface:       '#141130',   // superficie elevada
          card:          '#1C1838',   // fondo de tarjeta

          /* ── Borders ── */
          border:        '#2A2650',   // borde sutil púrpura
          'border-dark': '#4A4485',   // hover/focus border

          /* ── Navigation ── */
          nav:           '#08071A',   // nav más oscuro
          'nav-hover':   '#141130',   // hover nav

          /* ── Accents ── */
          primary:       '#FF5C5C',   // coral cálido — CTA, social, energético
          'primary-dark':'#E03E3E',   // hover/pressed coral
          secondary:     '#9B5DE5',   // púrpura vibrante — creativo, divertido
          accent:        '#FF9F43',   // ámbar cálido — festivo, amigable

          /* ── Text ── */
          ink:           '#EEE9FF',   // blanco cálido con tinte púrpura
          muted:         '#8D88AF',   // gris-lavanda apagado
          faint:         '#4A4470',   // muy apagado
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'card':         '0 1px 4px rgba(0,0,0,0.45), 0 4px 16px rgba(0,0,0,0.35)',
        'card-md':      '0 2px 8px rgba(0,0,0,0.55), 0 8px 28px rgba(0,0,0,0.45)',
        'glow':         '0 0 28px rgba(255,92,92,0.45)',
        'glow-sm':      '0 0 14px rgba(255,92,92,0.30)',
        'glow-purple':  '0 0 28px rgba(155,93,229,0.45)',
        'glow-amber':   '0 0 20px rgba(255,159,67,0.40)',
        'nav':          '0 2px 20px rgba(0,0,0,0.65)',
      },
      backgroundImage: {
        'aura-gradient':      'linear-gradient(135deg, #FF5C5C 0%, #9B5DE5 100%)',
        'aura-gradient-r':    'linear-gradient(to right, #FF5C5C 0%, #9B5DE5 100%)',
        'aura-gradient-warm': 'linear-gradient(135deg, #FF9F43 0%, #FF5C5C 100%)',
        'aura-gradient-pan':  'linear-gradient(270deg, #FF5C5C, #9B5DE5, #FF9F43, #FF5C5C)',
        'nav-gradient':       'linear-gradient(180deg, #08071A 0%, #0D0B1C 100%)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(28px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.90)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'bounce-in': {
          '0%':   { opacity: '0', transform: 'scale(0.75)' },
          '55%':  { opacity: '1', transform: 'scale(1.06)' },
          '80%':  {               transform: 'scale(0.97)' },
          '100%': {               transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.6', boxShadow: '0 0 14px rgba(255,92,92,0.30)' },
          '50%':      { opacity: '1',   boxShadow: '0 0 32px rgba(255,92,92,0.55)' },
        },
        'gradient-pan': {
          '0%':   { backgroundPosition: '0% 50%' },
          '50%':  { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        shimmer: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
        'ping-slow': {
          '0%':   { transform: 'scale(1)',    opacity: '0.7' },
          '70%':  { transform: 'scale(1.6)', opacity: '0' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-once': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(99,102,241,0)' },
          '30%':      { boxShadow: '0 0 0 8px rgba(99,102,241,0.25)' },
          '60%':      { boxShadow: '0 0 0 4px rgba(99,102,241,0.10)' },
        },
      },
      animation: {
        'fade-in':        'fade-in 0.28s cubic-bezier(0.22,1,0.36,1) both',
        'slide-up':       'slide-up 0.38s cubic-bezier(0.22,1,0.36,1) both',
        'slide-in-right': 'slide-in-right 0.32s cubic-bezier(0.22,1,0.36,1) both',
        'scale-in':       'scale-in 0.32s cubic-bezier(0.34,1.56,0.64,1) both',
        'bounce-in':      'bounce-in 0.52s cubic-bezier(0.34,1.56,0.64,1) both',
        float:            'float 3.5s ease-in-out infinite',
        'glow-pulse':     'glow-pulse 2.4s ease-in-out infinite',
        'gradient-pan':   'gradient-pan 5s ease infinite',
        shimmer:          'shimmer 1.6s infinite',
        'spin-slow':      'spin-slow 14s linear infinite',
        'ping-slow':      'ping-slow 2.5s ease-out infinite',
        'pulse-once':     'pulse-once 1.8s ease-out forwards',
      },
    },
  },
  plugins: [],
}
