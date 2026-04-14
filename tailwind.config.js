/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        ink: {
          DEFAULT: '#0f0e0d',
          50: '#f7f6f4',
          100: '#eeebe6',
          200: '#ddd8ce',
          300: '#c5bcae',
          400: '#a99889',
          500: '#917f6e',
          600: '#7d6b5c',
          700: '#67584c',
          800: '#554a41',
          900: '#473f38',
        },
        cream: {
          DEFAULT: '#f9f7f3',
          dark: '#f0ede6',
        },
        accent: {
          DEFAULT: '#e8643a',
          hover: '#d4562e',
          light: '#fdf0eb',
        },
        jade: {
          DEFAULT: '#2d7a5f',
          light: '#e8f5f0',
        },
        amber: {
          soft: '#f5a623',
          light: '#fef8ec',
        },
        rose: {
          soft: '#e05c7a',
          light: '#fdeef2',
        }
      },
      animation: {
        'flip-in': 'flipIn 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'bounce-subtle': 'bounceSubtle 0.5s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        flipIn: {
          '0%': { transform: 'rotateY(90deg)', opacity: '0' },
          '100%': { transform: 'rotateY(0deg)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      },
      boxShadow: {
        'card': '0 1px 3px rgba(15,14,13,0.06), 0 4px 16px rgba(15,14,13,0.08)',
        'card-hover': '0 4px 12px rgba(15,14,13,0.1), 0 16px 48px rgba(15,14,13,0.12)',
        'flashcard': '0 8px 32px rgba(15,14,13,0.12), 0 2px 8px rgba(15,14,13,0.06)',
      }
    },
  },
  plugins: [],
}
