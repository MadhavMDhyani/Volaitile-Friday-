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
        sans:  ['"Neue Montreal"', '"Inter"', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        mono:  ['"IBM Plex Mono"', 'monospace'],
        title: ['"Neue Montreal"', '"Inter"', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      colors: {
        bg:      '#070707',
        page:    '#070707',
        primary: '#33BC65',
        accent:  '#12DCEF',
        glow:    '#5DFFD9',
        'text-primary':   '#FFFFFF',
        'text-secondary': 'rgba(255,255,255,0.80)',
        'text-muted':     'rgba(255,255,255,0.55)',
        'text-faint':     'rgba(255,255,255,0.35)',
        'glass-bg':     'rgba(255,255,255,0.06)',
        'glass-border': 'rgba(255,255,255,0.18)',
        border:          'rgba(255,255,255,0.18)',
        'border-subtle': 'rgba(255,255,255,0.10)',
        'border-strong': 'rgba(255,255,255,0.22)',
        surface: 'rgba(255,255,255,0.06)',
        raised:  'rgba(255,255,255,0.09)',
        tile: {
          DEFAULT:   'rgba(255,255,255,0.06)',
          raised:    'rgba(255,255,255,0.09)',
          deep:      'rgba(0,0,0,0.35)',
          accent:    '#33BC65',
          highlight: '#5DFFD9',
        },
        'neutral-strong': 'rgba(255,255,255,0.12)',
        scrim: 'rgba(7,7,7,0.72)',
      },
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'scale-out': {
          '0%':   { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.97)' },
        },
        'slide-in-right': {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-out-right': {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'slide-in-up': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pop: {
          '0%':   { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in':        'fade-in 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-up':        'fade-up 350ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in':       'scale-in 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-out':      'scale-out 150ms ease-out forwards',
        'slide-in-right': 'slide-in-right 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-out-right':'slide-out-right 250ms ease-out forwards',
        'slide-in-up':    'slide-in-up 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        shimmer:          'shimmer 1.8s ease-in-out infinite',
        pop:              'pop 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      boxShadow: {
        tile: '0 1px 0 rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
};
