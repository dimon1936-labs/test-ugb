import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ugb: {
          green: '#78BE20',
          'green-dark': '#5A9216',
          'green-light': '#E8F5E0',
          'green-50': '#F0F9E8',
          navy: '#003D6B',
          'navy-dark': '#002B4D',
          'navy-light': '#E6EFF7',
        },
        surface: {
          bg: '#F5F7FA',
          card: '#FFFFFF',
          border: '#E2E8F0',
          'border-hover': '#CBD5E1',
        },
        txt: {
          primary: '#1A2332',
          secondary: '#5A6B7D',
          muted: '#94A3B8',
        },
        status: {
          success: '#16A34A',
          error: '#DC2626',
          warning: '#D97706',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'ui-monospace', 'monospace'],
        display: ['var(--font-grotesk)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
