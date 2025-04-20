/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'light-blue': '#E0F2FF',
        'card-blue': '#B8D8F2',
        'accent-blue': '#4A90E2',
        'dark-blue': '#0A2D4D',
        'medium-blue': '#155A8A',
        'red': '#D70000',
        'orange': '#FF9933',
      },
    },
  },
  plugins: [],
} 