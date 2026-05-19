import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],

  theme: {
    extend: {
      colors: {
        ark: {
          bg: '#050508',
          surface: '#0D0D14',
          border: '#1A1A2E',

          primary: '#6D28D9',
          'primary-hover': '#7C3AED',

          secondary: '#06B6D4',

          text: '#F8FAFC',
          'text-secondary': '#94A3B8',
          'text-muted': '#475569',

          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
        },
      },

      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },

      animation: {
        shimmer: 'shimmer 2s linear infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
      },

      keyframes: {
        shimmer: {
          '0%': {
            backgroundPosition: '200% 0',
          },
          '100%': {
            backgroundPosition: '-200% 0',
          },
        },

        'glow-pulse': {
          '0%, 100%': {
            opacity: '0.3',
            boxShadow: '0 0 20px rgba(109, 40, 217, 0.15)',
          },

          '50%': {
            opacity: '1',
            boxShadow: '0 0 40px rgba(109, 40, 217, 0.4)',
          },
        },

        float: {
          '0%, 100%': {
            transform: 'translateY(0)',
          },

          '50%': {
            transform: 'translateY(-15px)',
          },
        },
      },
    },
  },

  plugins: [],
}

export default config
