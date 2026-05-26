/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-syne)', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: {
          DEFAULT: '#0A0A0F',
          2: '#111118',
          3: '#16161F',
          4: '#1C1C27',
        },
        border: {
          DEFAULT: '#2A2A38',
          2: '#353548',
        },
        text: {
          DEFAULT: '#F0F0F8',
          2: '#9090A8',
          3: '#5A5A72',
        },
        accent: {
          DEFAULT: '#6C63FF',
          2: '#4FFFB0',
          3: '#FF6B9D',
        },
        brand: {
          amber: '#F5A623',
          red: '#FF4D6A',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'pulse-dot': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
        'spin-slow': { to: { transform: 'rotate(360deg)' } },
        'fade-in': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        'slide-in': { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'pulse-dot': 'pulse-dot 1.2s ease-in-out infinite',
        'spin-slow': 'spin-slow 0.8s linear infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in': 'slide-in 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
