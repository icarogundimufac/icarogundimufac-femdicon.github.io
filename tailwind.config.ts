import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        verde: {
          50:  '#f0faf4',
          100: '#d6f3e1',
          200: '#b0e6c4',
          300: '#7bd09e',
          400: '#44b375',
          500: '#229157',
          600: '#157244',
          700: '#0f5b36',
          800: '#0a4028',
          900: '#072d1c',
          950: '#041a10',
        },
        estrela: {
          400: '#e74c3c',
          500: '#C7392F',
          600: '#a93226',
        },
        ouro: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#F2C230',
          500: '#d4a017',
          600: '#b07d0e',
          700: '#8a5e09',
        },
        cinza: {
          50:  '#f9fafb',
          100: '#F3F4F6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#2F3437',
          900: '#111827',
        },
        areia: {
          50:  '#fafaf7',
          100: '#f5f4ef',
          200: '#e8e6dc',
          300: '#d4d0c4',
          400: '#b0aa98',
          500: '#8c8472',
          600: '#6b6355',
          700: '#514b40',
          800: '#38342c',
          900: '#211e18',
        },
      },
      fontFamily: {
        fraunces: ['var(--font-fraunces)', 'Georgia', 'serif'],
        jakarta: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-12px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [animate],
}

export default config
