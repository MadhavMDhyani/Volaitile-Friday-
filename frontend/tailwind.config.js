import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
        title: ['Anton', 'Impact', 'sans-serif'],
      },
      colors: {
        slate: colors.neutral,
        stone: colors.neutral,
        violet: colors.neutral,
        indigo: colors.neutral,
        cyan: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#e5e5e5',
          500: '#fafafa',
          600: '#d4d4d4',
          700: '#a3a3a3',
          800: '#525252',
          900: '#262626',
          950: '#171717',
        },
        page: '#000000',
        surface: '#0a0a0a',
        raised: '#121212',
        border: '#1c1c1c',
        'border-strong': '#333333',
        'text-primary': '#fafafa',
        'text-muted': '#a3a3a3',
        'text-faint': '#737373',
        'brand-black': '#000000',
        'brand-yellow': '#FFD60A',
        'brand-amber': '#FFB800',
        'brand-pale': '#FFF3B0',
        'aurora-cyan': '#00f0ff',
        'aurora-violet': '#a855f7',
        'aurora-rose': '#f43f5e',
        'aurora-amber': '#fbbf24',
        'glass-border': 'rgba(255, 255, 255, 0.14)',
        'glass-border-strong': 'rgba(255, 255, 255, 0.24)',
        'glass-fill': 'rgba(255, 255, 255, 0.03)',
        'glass-strong': 'rgba(8, 8, 8, 0.75)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'scale-out': {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.97)' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-out-right': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'slide-in-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pop: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-up': 'fade-up 350ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scale-in 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-out': 'scale-out 150ms ease-out forwards',
        'slide-in-right': 'slide-in-right 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-out-right': 'slide-out-right 250ms ease-out forwards',
        'slide-in-up': 'slide-in-up 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        shimmer: 'shimmer 1.8s ease-in-out infinite',
        pop: 'pop 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
    },
  },
  plugins: [],
};