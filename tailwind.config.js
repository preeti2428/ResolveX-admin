/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#F2F5F9',
          100: '#E8EDF5',
          200: '#C7D3E5',
          300: '#9FB5D2',
          600: '#2E4679',
          700: '#243761',
          800: '#1B2A4A', // Primary Navy Blue
          900: '#121C31',
          950: '#0B1220',
        },
        gold: {
          50: '#FDFBF4',
          100: '#FAF3DE',
          200: '#F5E5B8',
          300: '#E8C468', // Muted Gold for icon circles
          400: '#DFB33F',
          500: '#D4A017', // Primary Gold / Amber
          600: '#C9A227', // Accent Gold
          700: '#A98319',
          800: '#7E6112',
          900: '#54400A',
        },
        charcoal: '#2C2C2C', // Body text
        surface: '#F8F8F8',  // Section backgrounds
        cream: '#FAF9F5',    // Subtle backgrounds
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          500: '#1B2A4A',
          600: '#121C31',
        },
        aiml: {
          primary: '#1B2A4A',
          accent: '#D4A017',
          dark: '#121C31',
          card: '#FFFFFF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glow-brand': '0 0 25px -5px rgba(99, 102, 241, 0.4)',
        'glow-accent': '0 0 25px -5px rgba(6, 182, 212, 0.4)',
        'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-subtle': 'pulseSubtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
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
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        }
      }
    },
  },
  plugins: [],
};
