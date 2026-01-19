/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        earth: {
          300: '#d2c9bf',
        },
        bhumi: {
          50: '#f4f7f2',
          100: '#e3ebe0',
          200: '#c5d9c0',
          300: '#9cbfa5',
          400: '#729f7f',
          500: '#528260',
          600: '#3e664a',
          700: '#33523d',
          800: '#2a4233',
          900: '#23372b',
        },
        terra: {
          50: '#fdf8f6',
          100: '#fcefe9',
          200: '#f8dcd0',
          300: '#f2bfad',
          400: '#ea9a7f',
          500: '#df7654',
          600: '#ce5a39',
          700: '#ab462a',
          800: '#8d3b26',
          900: '#713323',
        },
        sand: {
          50: '#faf9f6',
          100: '#f5f2eb',
          200: '#e6e0d2',
          300: '#d6ccb6',
          400: '#c5b699',
          500: '#b09e7d',
          600: '#9d8866',
          700: '#826f54',
          800: '#6b5b46',
          900: '#584b3b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    }
  },
  plugins: [],
}