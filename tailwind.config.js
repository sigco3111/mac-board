/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'mac-blue': '#0070c9',
        'mac-gray': '#f5f5f7',
        'mac-dark': '#1d1d1f',
        'mac-light': '#fbfbfd',
        'mac-border': '#d2d2d7',
        'mac-window': 'rgba(255, 255, 255, 0.8)',
        'mac-sidebar': '#f9f9f9',
      },
      fontFamily: {
        'mac': ['-apple-system', 'BlinkMacSystemFont', 'San Francisco', 'Helvetica Neue', 'sans-serif'],
      },
      boxShadow: {
        'mac-window': '0 10px 30px rgba(0, 0, 0, 0.1)',
        'mac-dock': '0 0 20px rgba(0, 0, 0, 0.2)',
      },
      backdropBlur: {
        'mac': '20px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} 