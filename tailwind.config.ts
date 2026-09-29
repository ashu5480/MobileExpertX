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
          DEFAULT: '#08090D',
          900: '#08090D',
          800: '#0B1020',
          700: '#12172B',
          600: '#1B2138',
        },
        brand: {
          blue: '#2563FF',
          cyan: '#00D9FF',
          purple: '#7C3AED',
          50: '#EEF3FF',
          100: '#DCE5FF',
          200: '#B9CBFF',
          300: '#8FA9FF',
          400: '#5B82FF',
          500: '#2563FF',
          600: '#1D4FE0',
          700: '#183CB0',
          800: '#143089',
        },
        accent: {
          cyan: '#00D9FF',
          purple: '#7C3AED',
        },
        surface: {
          50: '#F7F8FC',
          100: '#F1F3F9',
          200: '#E6E9F2',
          300: '#D6DAE8',
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
        soft: '0 1px 2px rgba(8,9,13,0.04), 0 8px 24px -8px rgba(8,9,13,0.08)',
        card: '0 2px 8px rgba(8,9,13,0.05), 0 18px 40px -18px rgba(11,16,32,0.18)',
        lift: '0 10px 24px -8px rgba(8,9,13,0.12), 0 32px 64px -28px rgba(37,99,255,0.35)',
        glow: '0 0 0 1px rgba(37,99,255,0.18), 0 18px 48px -12px rgba(37,99,255,0.45)',
        inset: 'inset 0 1px 0 0 rgba(255,255,255,0.6)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #2563FF, #7C3AED)',
        'brand-gradient-r': 'linear-gradient(90deg, #2563FF, #7C3AED)',
        'aurora':
          'radial-gradient(60% 60% at 50% 0%, rgba(37,99,255,0.18) 0%, transparent 70%), radial-gradient(50% 50% at 85% 20%, rgba(124,58,237,0.16) 0%, transparent 70%), radial-gradient(45% 45% at 15% 35%, rgba(0,217,255,0.14) 0%, transparent 70%)',
        'grid-dark':
          'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
        'grid-light':
          'linear-gradient(rgba(11,16,32,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(11,16,32,0.045) 1px, transparent 1px)',
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
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 2.2s infinite',
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.24, 0, 0.38, 1) infinite',
        marquee: 'marquee 32s linear infinite',
        'spin-slow': 'spin-slow 18s linear infinite',
        'gradient-x': 'gradient-x 6s ease infinite',
      },
    },
  },
  plugins: [],
};

export default config;
