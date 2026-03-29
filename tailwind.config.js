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
          surface: '#141414',
          border: '#1f1f1f',
          accent: '#8b5cf6',
          'accent-hover': '#7c3aed',
          success: '#22c55e',
          warning: '#f59e0b',
          error: '#ef4444',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-fast': 'spin 0.5s linear infinite',
      },
    },
  },
  plugins: [],
}
