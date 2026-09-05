/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        border: 'var(--border)',
        textPrimary: 'var(--text-primary)',
        textSecondary: 'var(--text-secondary)',
        accent: 'var(--accent)',
        accentCtaText: 'var(--accent-cta-text)',
        accentMuted: 'var(--accent-muted)',
        ivory: '#FAF8F5',
        charcoal: '#2B2824',
        bronze: {
          DEFAULT: '#8B7355',
          light: '#A89680',
          dark: '#6E5A42',
        },
        stoneborder: '#E8E2D9',
        coffee: {
          DEFAULT: '#6B4F3B',
          hover: '#543D2D',
          light: '#85664F',
        },
        sand: {
          50: '#FAF8F5',
          100: '#F4F0EA',
          200: '#E8E2D9',
          300: '#D5CCBF',
          400: '#B8AC9D',
          500: '#8B7355',
          600: '#6B4F3B',
          700: '#543D2D',
          800: '#3D2C20',
          900: '#2B2824',
        },
        coop: {
          50: '#FAF8F5',
          100: '#F4F0EA',
          200: '#E8E2D9',
          300: '#A89680',
          400: '#8B7355',
          500: '#6B4F3B',
          600: '#543D2D',
          700: '#423023',
          800: '#312319',
          900: '#2B2824',
          950: '#1C1917',
        }
      }
    },
  },
  plugins: [],
}
