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
        page: '#140d09',
        surface: '#1e130d',
        raised: '#2a1a11',
        border: 'rgba(255, 200, 150, 0.08)',
        'border-strong': 'rgba(255, 200, 150, 0.15)',
        'text-primary': '#f3e6da',
        'text-secondary': '#c4b5a8',
        'text-muted': '#a89384',
        'text-faint': '#6e5d50',
        'neutral-strong': '#4a3d35',
        accent: {
          DEFAULT: '#d98a5a',
          hover: '#c47a4a',
          press: '#a86840',
          deep: '#7a4a30',
          tint: '#3a2518',
        },
        'glass-border': 'rgba(255, 200, 150, 0.10)',
        'glass-border-strong': 'rgba(255, 200, 150, 0.18)',
        'glass-fill': 'rgba(20, 13, 9, 0.03)',
        'glass-strong': 'rgba(20, 13, 9, 0.75)',
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
      transitionTimingFunction: {
        out: 'var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1))',
        spring: 'var(--ease-spring, cubic-bezier(0.34, 1.56, 0.64, 1))',
        'ease-out': 'var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1))',
        'ease-spring': 'var(--ease-spring, cubic-bezier(0.34, 1.56, 0.64, 1))',
      },
      transitionDuration: {
        150: '150ms',
        250: '250ms',
        450: '450ms',
        700: '700ms',
      },
    },
  },
  plugins: [],
};