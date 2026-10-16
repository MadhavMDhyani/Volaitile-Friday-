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
      },
      colors: {
        slate: colors.stone,
        violet: colors.stone,
        indigo: colors.stone,
        cyan: {
          50: '#fbf1ec',
          100: '#f5ddd0',
          200: '#ebbca3',
          300: '#e09a75',
          400: '#d57d52',
          500: '#c4643a',
          600: '#a64e2c',
          700: '#853d24',
          800: '#6b3220',
          900: '#572b1e',
          950: '#2f150d',
        },
      },
    },
  },
  plugins: [],
};