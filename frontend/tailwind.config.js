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
        page: '#18102B',
        surface: '#211737',
        raised: '#2C2048',
        border: 'rgba(245, 243, 255, 0.08)',
        'border-strong': 'rgba(245, 243, 255, 0.15)',
        'text-primary': '#F5F3FF',
        'text-secondary': '#C9C6D5',
        'text-muted': '#9D98AA',
        'text-faint': '#6C667C',
        'neutral-strong': '#3A3355',
        accent: {
          DEFAULT: '#834DFB',
          hover: '#6F3BE6',
          press: '#5B2FC4',
          deep: '#3E2380',
          tint: '#2A1B52',
          glow: '#A98BFF',
        },
        highlight: '#F0E100',
        turbo: '#F0E100',
        'glass-border': 'rgba(245, 243, 255, 0.10)',
        'glass-border-strong': 'rgba(245, 243, 255, 0.18)',
        'glass-fill': 'rgba(24, 16, 43, 0.03)',
        'glass-strong': 'rgba(24, 16, 43, 0.75)',
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