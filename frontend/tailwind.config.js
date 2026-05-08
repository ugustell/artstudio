/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary:    '#C49240',
        secondary:  '#E8C87A',
        tertiary:   '#8B6B3D',
        surface:    '#1E1610',
        'surface-container': '#2C2016',
        'surface-high':      '#3A2C1C',
        'on-surface':        '#F0E0C0',
        'on-primary':        '#160900',
      },
      fontFamily: {
        serif:  ['Noto Serif', 'serif'],
        sans:   ['Manrope', 'sans-serif'],
      },
      animation: {
        'float':         'float 6s ease-in-out infinite',
        'float-delayed': 'float 8s ease-in-out 1s infinite',
        'fade-up':       'fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both',
      },
      keyframes: {
        float:  { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-16px)' } },
        fadeUp: { from: { opacity: 0, transform: 'translateY(24px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
