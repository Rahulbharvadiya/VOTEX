/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', '"Noto Sans Devanagari"', '"Noto Sans Kannada"', '"Noto Sans Gujarati"', '"Noto Sans Tamil"', '"Noto Sans Telugu"', '"Noto Sans Bengali"', '"Noto Sans Gurmukhi"', '"Noto Sans Malayalam"', '"Noto Naskh Arabic"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: { 50: '#F6F7F9', 100: '#EDF0F4', 200: '#DDE1E8', 300: '#C5CBD5', 400: '#8791A1', 500: '#5B6678', 700: '#2A3547', 800: '#18233A', 900: '#0E1726' },
        brand: { 50: '#E8F3F4', 100: '#CFE6E8', 500: '#167A85', 600: '#0F5E66', 700: '#0B4A51', 900: '#072F34' },
        accent: { 50: '#FDF5E3', 500: '#E8A317', 600: '#C98A0B' },
      },
      boxShadow: {
        panel: '0 1px 2px rgba(14,23,38,.04), 0 8px 24px -12px rgba(14,23,38,.12)',
      },
    },
  },
  plugins: [],
}
