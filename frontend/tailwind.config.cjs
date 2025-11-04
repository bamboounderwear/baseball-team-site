/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{svelte,ts}'],
  theme: {
    extend: {
      borderRadius: {
        DEFAULT: '0'
      },
      colors: {
        black: '#000000',
        white: '#ffffff'
      }
    }
  },
  plugins: []
};
