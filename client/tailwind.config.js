/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Yellow theme
        primary: {
          50: '#FFFEF0',
          100: '#FFF9DB',
          200: '#FFF3B8',
          300: '#FFEC8A',
          400: '#FFE44D',
          500: '#FFC107',
          600: '#FFB300',
          700: '#FFA000',
          800: '#FF8F00',
          900: '#FF6F00',
        },
        // Dark theme colors
        dark: {
          50: '#1F1F1F',
          100: '#181818',
          200: '#141414',
          300: '#0F0F0F',
          400: '#0A0A0A',
          500: '#050505',
          600: '#000000',
        },
        // Sidebar specific
        sidebar: {
          bg: '#0F0F0F',
          hover: '#1A1A1A',
          active: '#FFC107',
          'active-hover': '#FFD54F',
          text: '#FFFFFF',
          'text-muted': '#9CA3AF',
        },
        // Chart colors
        chart: {
          primary: '#FFC107',
          secondary: '#FFEB3B',
          completed: '#FFC107',
          progress: '#FFEB3B',
          pending: '#1F1F1F',
          grid: '#E5E7EB',
        },
        // Status colors
        success: {
          50: '#ECFDF5',
          500: '#10B981',
          600: '#059669',
        },
        warning: {
          50: '#FFFBEB',
          500: '#F59E0B',
          600: '#D97706',
        },
        danger: {
          50: '#FEF2F2',
          500: '#EF4444',
          600: '#DC2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'sidebar': '4px 0 6px -1px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}