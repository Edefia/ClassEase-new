/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // UCC Brand Colors
        'ucc-navy': {
          DEFAULT: '#161B48',
          50: '#E8E9F0',
          100: '#D1D3E1',
          200: '#A3A7C3',
          300: '#757BA5',
          400: '#474F87',
          500: '#161B48',
          600: '#12163A',
          700: '#0E112C',
          800: '#0A0C1E',
          900: '#060710',
        },
        'ucc-crimson': {
          DEFAULT: '#ED1C24',
          50: '#FDE8E9',
          100: '#FBD1D3',
          200: '#F7A3A7',
          300: '#F3757B',
          400: '#EF474F',
          500: '#ED1C24',
          600: '#C4171E',
          700: '#9B1218',
          800: '#720D12',
          900: '#49080C',
        },
        'ucc-gold': {
          DEFAULT: '#F9E197',
          50: '#FFFDF5',
          100: '#FEF9E6',
          200: '#FCF2CC',
          300: '#FBECB3',
          400: '#FAE6A5',
          500: '#F9E197',
          600: '#F5D060',
          700: '#F1BF29',
          800: '#C99B10',
          900: '#92700C',
        },
        // Semantic colors
        border: '#DDE1EC',
        input: '#DDE1EC',
        ring: '#161B48',
        background: '#F5F6FA',
        foreground: '#1A1A2E',
        primary: {
          DEFAULT: '#161B48',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#F9E197',
          foreground: '#161B48',
        },
        destructive: {
          DEFAULT: '#C0392B',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#F0F1F5',
          foreground: '#555770',
        },
        accent: {
          DEFAULT: '#ED1C24',
          foreground: '#FFFFFF',
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#1A1A2E',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#1A1A2E',
        },
        success: '#2E7D52',
        warning: '#E07B2A',
        error: '#C0392B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
      borderRadius: {
        lg: '0.625rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
        'sidebar': '2px 0 8px rgba(0, 0, 0, 0.08)',
        'dropdown': '0 4px 16px rgba(0, 0, 0, 0.12)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
        'fade-in': {
          from: { opacity: 0, transform: 'translateY(4px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
