/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundColor: {
        gray: {
          960: '#111111',
        },
      },
      color: {
        white: {
          100: '#F4F4F4',
          200: '#dD9D9D9',
          300: '#C1C1C1',
        },
      },
      fontFamily: {
        sans: ['var(--font-source-sans-pro)'],
        inter: ['var(--font-inter)'],
        roboto: ['var(--font-roboto)'],
        tabloid: ['var(--font-tabloid)'],
      },
      screens: {
        sm: '640px',
      },
      gridTemplateColumns: {
        withSidebar: '2fr 8fr',
        withSidebarLarge: '3ft 7fr'
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
