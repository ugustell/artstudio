/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary:    '#ffb4a5',
        secondary:  '#e9c349',
        tertiary:   '#d8bafa',
        surface:    '#5f76b8',
        'surface-container': '#6f84c1',
        'surface-high':      '#8497cd',
        'on-surface':        '#edf2ff',
        'on-primary':        '#611205',
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
