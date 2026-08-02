/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        jungle: {
          DEFAULT: '#10b981',
          dark: '#059669',
        },
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
      keyframes: {
        'border-beam': {
          '0%': { '--border-angle': '0deg' },
          '100%': { '--border-angle': '360deg' },
        },
      },
      animation: {
        'border-beam': 'border-beam 1.8s cubic-bezier(0.65, 0, 0.35, 1) 1 forwards',
      },
    },
  },
  plugins: [],
}
