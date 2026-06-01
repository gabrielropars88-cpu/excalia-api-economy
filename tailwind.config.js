/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Orbitron', 'monospace'],
        body: ['Rajdhani', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        ore: {
          50: '#f0fdf4',
          100: '#dcfce7',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
        },
        void: {
          900: '#020408',
          800: '#050d14',
          700: '#091420',
          600: '#0d1f30',
          500: '#122840',
        },
        crystal: {
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
        },
        lava: {
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
        },
        gold: {
          300: '#fde68a',
          400: '#fbbf24',
          500: '#f59e0b',
        },
        emerald: {
          400: '#34d399',
          500: '#10b981',
        }
      },
      backgroundImage: {
        'grid-pattern': `linear-gradient(rgba(14,165,233,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(14,165,233,0.05) 1px, transparent 1px)`,
        'ore-glow': 'radial-gradient(ellipse at center, rgba(14,165,233,0.15) 0%, transparent 70%)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'scan': 'scan 8s linear infinite',
        'number-spin': 'numberSpin 0.4s ease-out',
      },
      keyframes: {
        glow: {
          '0%': { textShadow: '0 0 10px rgba(14,165,233,0.5)' },
          '100%': { textShadow: '0 0 25px rgba(14,165,233,0.9), 0 0 50px rgba(14,165,233,0.4)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        numberSpin: {
          '0%': { opacity: 0, transform: 'translateY(-10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        }
      },
      boxShadow: {
        'crystal': '0 0 20px rgba(14,165,233,0.3), inset 0 0 20px rgba(14,165,233,0.05)',
        'ore-green': '0 0 20px rgba(34,197,94,0.3), inset 0 0 20px rgba(34,197,94,0.05)',
        'ore-red': '0 0 20px rgba(239,68,68,0.3), inset 0 0 20px rgba(239,68,68,0.05)',
        'gold': '0 0 20px rgba(245,158,11,0.3), inset 0 0 20px rgba(245,158,11,0.05)',
      }
    },
  },
  plugins: [],
}
