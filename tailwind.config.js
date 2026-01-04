/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'emory-blue': '#004990',
        'emory-gold': '#B58B00',
      },
      fontFamily: {
        'serif': ['"Crimson Pro"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
