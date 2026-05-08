/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary:    '#987536',
        secondary:  '#B89444',
        tertiary:   '#6B5F4F',
        surface:    '#F1ECE0',
        'surface-container': '#E5DCC6',
        'surface-high':      '#D5C9B0',
        'on-surface':        '#1F1816',
        'on-primary':        '#F1ECE0',
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
