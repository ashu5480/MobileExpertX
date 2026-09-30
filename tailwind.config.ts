import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1.25rem', sm: '1.5rem', lg: '2rem' },
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0B1220',
          900: '#0B1220',
          800: '#16203A',
          700: '#1F2B4A',
          600: '#33415C',
          500: '#52627F',
        },
        // Fresh green. 500 is the accent, 600 carries white button text, and
        // 700/800 are the text-safe steps on a white background.
        brand: {
          green: '#10B981',
          teal: '#0D9488',
          lime: '#84CC16',
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        accent: {
          green: '#10B981',
          teal: '#0D9488',
          lime: '#84CC16',
          mint: '#5EEAD4',
        },
        surface: {
          50: '#F5FBF8',
          100: '#ECF7F2',
          200: '#DDEFE7',
          300: '#C6E3D6',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['clamp(2.75rem, 7vw, 5.25rem)', { lineHeight: '0.98', letterSpacing: '-0.04em' }],
        'display-md': ['clamp(2.25rem, 5vw, 3.75rem)', { lineHeight: '1.02', letterSpacing: '-0.035em' }],
        'display-sm': ['clamp(1.75rem, 3.2vw, 2.5rem)', { lineHeight: '1.08', letterSpacing: '-0.03em' }],
        'title-lg': ['clamp(1.375rem, 2.2vw, 1.75rem)', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(11,18,32,0.04), 0 8px 24px -8px rgba(6,95,70,0.10)',
        card: '0 2px 8px rgba(11,18,32,0.05), 0 18px 40px -18px rgba(6,95,70,0.20)',
        lift: '0 10px 24px -8px rgba(11,18,32,0.12), 0 32px 64px -28px rgba(5,150,105,0.38)',
        glow: '0 0 0 1px rgba(16,185,129,0.22), 0 18px 48px -12px rgba(5,150,105,0.45)',
        inset: 'inset 0 1px 0 0 rgba(255,255,255,0.6)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #10B981, #047857)',
        'brand-gradient-r': 'linear-gradient(90deg, #10B981, #047857)',
        // Soft green/teal wash used behind the light sections.
        aurora:
          'radial-gradient(58% 58% at 50% 0%, rgba(16,185,129,0.14) 0%, transparent 70%), radial-gradient(50% 50% at 85% 22%, rgba(13,148,136,0.12) 0%, transparent 70%), radial-gradient(45% 45% at 15% 38%, rgba(132,204,22,0.10) 0%, transparent 70%)',
        'grid-dark':
          'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
        'grid-light':
          'linear-gradient(rgba(6,95,70,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(6,95,70,0.06) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '44px 44px',
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.22, 1, 0.36, 1)',
        swift: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.85)', opacity: '0.65' },
          '80%, 100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        // Slow drift for the light-section colour wash. Two stops, so the
        // browser interpolates a handful of gradients rather than re-painting
        // dozens every frame.
        'aurora-drift': {
          '0%': { transform: 'translate3d(-1.5%, -1%, 0) scale(1.04)' },
          '100%': { transform: 'translate3d(1.5%, 1.5%, 0) scale(1.09)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 2.2s infinite',
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.24, 0, 0.38, 1) infinite',
        marquee: 'marquee 32s linear infinite',
        'spin-slow': 'spin-slow 18s linear infinite',
        'gradient-x': 'gradient-x 6s ease infinite',
        'aurora-drift': 'aurora-drift 22s cubic-bezier(0.22, 1, 0.36, 1) infinite alternate',
      },
    },
  },
  plugins: [],
};

export default config;
