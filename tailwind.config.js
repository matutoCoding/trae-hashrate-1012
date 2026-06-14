/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        shadow: {
          50: '#FBF5E9',
          100: '#F5E6D0',
          200: '#E8D0A8',
          300: '#D4B078',
          400: '#C9A227',
          500: '#B8860B',
          600: '#8B6914',
          700: '#6B4F0F',
          800: '#4A350A',
          900: '#2D1F06',
        },
        crimson: {
          50: '#FBE8E0',
          100: '#F5C9B8',
          200: '#E89E7A',
          300: '#D9703C',
          400: '#B8350D',
          500: '#93280A',
          600: '#701E08',
          700: '#4F1506',
          800: '#330E04',
          900: '#1A0702',
        },
        parchment: {
          50: '#FFFEF7',
          100: '#FDF8E8',
          200: '#F9EFCF',
          300: '#F3E3B0',
          400: '#E8D08A',
          500: '#D9BA66',
        },
        ink: {
          50: '#F5F2ED',
          100: '#E8E2D8',
          200: '#D4C9B8',
          300: '#B8A88E',
          400: '#8B7D65',
          500: '#5D5240',
          600: '#3D2914',
          700: '#2A1D0E',
          800: '#1A1208',
          900: '#0D0904',
        }
      },
      fontFamily: {
        display: ['"Noto Serif SC"', 'Georgia', 'serif'],
        body: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'shadow-puppet': '0 4px 20px rgba(61, 41, 20, 0.3), 0 2px 8px rgba(0,0,0,0.2)',
        'warm-glow': '0 0 30px rgba(201, 162, 39, 0.4), 0 0 60px rgba(184, 53, 13, 0.2)',
        'paper': 'inset 0 0 50px rgba(139, 105, 20, 0.1)',
      },
      animation: {
        'flicker': 'flicker 3s ease-in-out infinite',
        'breathe': 'breathe 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
        breathe: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(201, 162, 39, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(201, 162, 39, 0.7)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
