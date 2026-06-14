import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      // Brand palette — replicates the Aquí PDF identity exactly
      colors: {
        ink: {
          DEFAULT: '#0F1B2E',
          50: '#F3F4F8',
          100: '#DCDEE4',
          900: '#0F1B2E',
          950: '#0A1320'
        },
        teal: {
          DEFAULT: '#0F4C5C',
          dark: '#0A3640',
          light: '#DBEEF1'
        },
        red: {
          DEFAULT: '#E63946',
          light: '#FBE3E5'
        },
        yellow: {
          DEFAULT: '#F5C842',
          light: '#FFF4D1'
        },
        cream: '#FAF6EF',
        warm: {
          50: '#F7F7F5',
          100: '#EFEEEA',
          300: '#C9C7C0',
          500: '#6B6962',
          700: '#3D3B36'
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif']
      },
      fontSize: {
        // Display sizes for the wayfinding aesthetic
        'display-1': ['132px', { lineHeight: '0.88', letterSpacing: '-0.06em', fontWeight: '800' }],
        'display-2': ['82px', { lineHeight: '0.92', letterSpacing: '-0.05em', fontWeight: '800' }],
        'display-3': ['46px', { lineHeight: '1.02', letterSpacing: '-0.035em', fontWeight: '700' }]
      },
      letterSpacing: {
        'eyebrow': '0.22em',
        'label': '0.15em'
      },
      animation: {
        'pulse-pin': 'pulsePin 1.5s ease-out infinite',
        'dash-route': 'dashRoute 1.2s linear infinite',
        'arrow-bob': 'arrowBob 1.8s ease-in-out infinite',
        'fade-in': 'fadeIn 0.25s ease',
        'scan-line': 'scanLine 2s linear infinite'
      },
      keyframes: {
        pulsePin: {
          '0%': { transform: 'scale(1)', opacity: '0.5' },
          '100%': { transform: 'scale(2)', opacity: '0' }
        },
        dashRoute: {
          'to': { strokeDashoffset: '-28' }
        },
        arrowBob: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' }
        },
        fadeIn: {
          'from': { opacity: '0', transform: 'translateY(8px)' },
          'to': { opacity: '1', transform: 'none' }
        },
        scanLine: {
          '0%': { top: '15%' },
          '50%': { top: '80%' },
          '100%': { top: '15%' }
        }
      }
    }
  },
  plugins: []
};

export default config;
