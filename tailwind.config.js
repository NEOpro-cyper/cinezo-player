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
        player: {
          bg: '#0a0a0a',
          surface: '#000000',
          border: '#27272a',
          accent: '#e11d48',
          'accent-hover': '#be123c',
          success: '#22c55e',
          warning: '#f59e0b',
          error: '#ef4444',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-fast': 'spin 0.5s linear infinite',
        'blink-fade': 'blink-fade 3s ease-in-out infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
