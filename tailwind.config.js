/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        indigo: { 
          50: '#eef2ff', 
          100: '#e0e7ff', 
          500: '#6366f1', 
          600: '#4f46e5', 
          700: '#4338ca', 
          900: '#312e81' 
        },
        emerald: { 
          500: '#10b981', 
          600: '#059669' 
        },
        dark: {
          bg: '#0f172a',
          card: '#1e293b',
          text: '#f8fafc'
        }
      },
      animation: {
        'breath': 'breath 3s ease-in-out infinite',
        'shine': 'shine 2s linear infinite',
        'ring-pulse': 'ring-pulse 2s infinite',
      },
      keyframes: {
        breath: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
        shine: {
          '0%': { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
        'ring-pulse': {
          '0%': { boxShadow: '0 0 0 0 rgba(99, 102, 241, 0.4)' },
          '70%': { boxShadow: '0 0 0 10px rgba(99, 102, 241, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(99, 102, 241, 0)' },
        }
      }
    },
  },
  plugins: [],
}
