/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'perenroll': {
          'green': '#24BE68',
          'green-light': '#24BD6A',
          'green-dark': '#22BF68',
          'dark': '#282E3A',
          'dark-light': '#282F39',
          'dark-lighter': '#292F3B',
        }
      }
    },
  },
  plugins: [],
}
