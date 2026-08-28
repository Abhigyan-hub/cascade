/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // CASCADE theme - dark, vibrant purple, golden accents
        cascade: {
          dark: '#0a0a0f',
          darker: '#050508',
          surface: '#12121a',
          'surface-hover': '#1a1a25',
          border: '#2a2a3a',
          purple: '#a855f7',
          'purple-light': '#c084fc',
          'purple-dark': '#7c3aed',
          gold: '#eab308',
          'gold-light': '#facc15',
          'gold-dark': '#ca8a04',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'cascade': '0 4px 20px rgba(168, 85, 247, 0.15)',
        'cascade-gold': '0 4px 20px rgba(234, 179, 8, 0.15)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
