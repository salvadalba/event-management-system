/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          50: '#ffffff',
          100: '#f5f6f7',
          200: '#eceff3',
          300: '#e2e6eb',
        },
        primary: {
          50: '#e9eff6',
          100: '#c9d8ea',
          200: '#a7bedc',
          300: '#85a4ce',
          400: '#5378b1',
          500: '#2f558f',
          600: '#234272',
          700: '#1a3156',
          800: '#10223d',
          900: '#0b1d39',
        },
        secondary: {
          50: '#f9f9f9',
          100: '#f1f1f1',
          200: '#e2e2e2',
          300: '#d4d4d4',
          400: '#c7c7c7',
          500: '#bbbbbb',
          600: '#a6a6a6',
          700: '#909090',
          800: '#7a7a7a',
          900: '#636363',
        },
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'large': '0 10px 50px -12px rgba(0, 0, 0, 0.25)',
        'neo': '-6px -6px 12px rgba(255,255,255,0.6), 6px 6px 12px rgba(0,0,0,0.08)',
        'neo-press': '-4px -4px 8px rgba(255,255,255,0.5), 4px 4px 8px rgba(0,0,0,0.12)',
        'neo-inset': 'inset -4px -4px 8px rgba(255,255,255,0.6), inset 4px 4px 8px rgba(0,0,0,0.06)'
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
