/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    'index.js',
    './src/app/**/*.{js,jsx,ts,tsx}',
    './src/components/**/*.{js,jsx,ts,tsx}',
    './src/context/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        /* Eco-Connect design tokens */
        canvas: '#F9F9F9',
        primary: {
          DEFAULT: '#2ECC71', // Primary Action Green
          light: '#81C784',
          dark: '#257942',
        },
        secondary: {
          DEFAULT: '#3498DB', // Secondary Sky Blue
          light: '#81D4FA',
          dark: '#217DBB',
        },
        earth: {
          accent: '#E67E22', // Warm Earth Accent
          brown: '#8D6E63',
          sand: '#F5DEB3',
        },
        forest: '#34495E', // Deep Forest Gray (primary text)
        success: '#2ECC71',
        info: '#3498DB',
        warn: '#E67E22',
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
        transparent: 'transparent',
      },
      borderRadius: {
        xs: '6px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        full: '9999px',
      },
      boxShadow: {
        card: '0 6px 12px rgba(52, 73, 94, 0.08)',
        soft: '0 4px 8px rgba(52, 73, 94, 0.06)',
      },
      spacing: {
        '3xs': '4px',
        '2xs': '6px',
        xs: '8px',
        sm: '12px',
        md: '16px',
        lg: '24px',
        xl: '32px',
      },
    },
  },
  plugins: [],
};
