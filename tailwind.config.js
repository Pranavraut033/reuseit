/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "index.js",
    './src/app/**/*.{js,jsx,ts,tsx}',
    './src/components/**/*.{js,jsx,ts,tsx}',
    './src/context/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        container: "#FFFFF0",
        primary: {
          DEFAULT: '#34A853', // Main green
          light: '#81C784',
          dark: '#257942',
        },
        accent: {
          DEFAULT: '#FFD600', // Yellow accent
          light: '#FFF59D',
          dark: '#FFB300',
        },
        earth: {
          brown: '#8D6E63',
          sand: '#F5DEB3',
          sky: '#81D4FA',
        },
        gray: {
          100: '#F5F5F5',
          200: '#EEEEEE',
          300: '#E0E0E0',
          400: '#BDBDBD',
          500: '#9E9E9E',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
        },
      },
    },
  },
  plugins: [],
};