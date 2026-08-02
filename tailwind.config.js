/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        jungle: {
          pale: '#DAF1DE',
          light: '#8EB69B',
          DEFAULT: '#235347',
          dark: '#163832',
          deep: '#0B2B26',
          deepest: '#051F20',
        },
        surface: 'var(--color-surface)',
        'surface-secondary': 'var(--color-surface-secondary)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-tertiary': 'var(--color-text-tertiary)',
        separator: 'var(--color-separator)',
        'border-glass': 'var(--color-border-glass)',
        focus: 'var(--color-focus)',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'ui-sans-serif',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      borderRadius: {
        panel: '1.75rem',
      },
      keyframes: {
        'border-beam': {
          '0%': { '--border-angle': '0deg' },
          '100%': { '--border-angle': '360deg' },
        },
        'panel-in': {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(6px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'backdrop-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'border-beam': 'border-beam 1.8s cubic-bezier(0.65, 0, 0.35, 1) 1 forwards',
        'panel-in': 'panel-in 280ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'backdrop-in': 'backdrop-in 220ms ease-out both',
      },
    },
  },
  plugins: [],
}
