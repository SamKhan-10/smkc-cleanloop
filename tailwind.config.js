/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '"Noto Sans Devanagari"', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', '"Noto Sans Devanagari"', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#effaf6', 100: '#d8f3e8', 200: '#b3e6d4', 300: '#80d2b9', 400: '#4bb79a',
          500: '#289c80', 600: '#1b7e68', 700: '#176556', 800: '#155146', 900: '#13433b', 950: '#082621',
        },
        ink: {
          50: '#f6f7f9', 100: '#eceef2', 200: '#d5dae2', 300: '#b0b9c8', 400: '#8592a8',
          500: '#66738c', 600: '#515c73', 700: '#424b5e', 800: '#394050', 900: '#1f2430', 950: '#141821',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.06)',
        lift: '0 4px 12px -2px rgba(16,24,40,.08), 0 2px 6px -2px rgba(16,24,40,.05)',
        pop: '0 20px 40px -12px rgba(16,24,40,.25)',
      },
      keyframes: {
        fadeUp: { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'none' } },
        scan: { '0%': { top: '0%' }, '100%': { top: '100%' } },
        pulseRing: { '0%': { transform: 'scale(.8)', opacity: .7 }, '100%': { transform: 'scale(2.4)', opacity: 0 } },
        pop: { '0%': { transform: 'scale(.6)', opacity: 0 }, '60%': { transform: 'scale(1.08)' }, '100%': { transform: 'scale(1)', opacity: 1 } },
      },
      animation: {
        fadeUp: 'fadeUp .35s ease-out both',
        scan: 'scan 2.2s ease-in-out infinite alternate',
        pulseRing: 'pulseRing 1.8s ease-out infinite',
        pop: 'pop .5s cubic-bezier(.2,.9,.3,1.2) both',
      },
    },
  },
  plugins: [],
};
