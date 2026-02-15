/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ========================================
      // CYBER SECURITY COLOR PALETTE
      // ========================================
      colors: {
        // Primary neon teal
        cyber: {
          50: '#e6ffff',
          100: '#b3fffd',
          200: '#80fffc',
          300: '#4dfffb',
          400: '#1afffa',
          500: '#00E5E1',  // Main brand color
          600: '#00b8b5',
          700: '#008a88',
          800: '#005c5b',
          900: '#002e2e',
        },
        // Dark backgrounds
        dark: {
          50: '#2a3441',
          100: '#232d3a',
          200: '#1c2530',
          300: '#151d27',
          400: '#111923',
          500: '#0d1117',  // Main background
          600: '#0a0e13',
          700: '#070a0e',
          800: '#04060a',
          900: '#020305',
        },
        // Card backgrounds
        card: {
          DEFAULT: '#131c2b',
          light: '#1a2535',
          hover: '#1f2d42',
        },
        // Alert/Risk colors
        risk: {
          critical: '#ff4b4b',
          high: '#ff6b35',
          medium: '#ffd93d',
          low: '#00d97e',
          safe: '#00E5E1',
        },
        // Text colors
        text: {
          primary: '#ffffff',
          secondary: '#b3b3b3',
          muted: '#6c757d',
        }
      },
      // ========================================
      // CUSTOM BOX SHADOWS (NEON GLOW EFFECTS)
      // ========================================
      boxShadow: {
        'glow-sm': '0 0 10px rgba(0, 229, 225, 0.3)',
        'glow': '0 0 20px rgba(0, 229, 225, 0.4)',
        'glow-lg': '0 0 30px rgba(0, 229, 225, 0.5)',
        'glow-xl': '0 0 40px rgba(0, 229, 225, 0.6)',
        'glow-red': '0 0 20px rgba(255, 75, 75, 0.4)',
        'glow-yellow': '0 0 20px rgba(255, 217, 61, 0.4)',
        'glow-green': '0 0 20px rgba(0, 217, 126, 0.4)',
        'card': '0 8px 32px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 229, 225, 0.15)',
      },
      // ========================================
      // CUSTOM FONTS
      // ========================================
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      // ========================================
      // BACKGROUND IMAGES (GRID PATTERN)
      // ========================================
      backgroundImage: {
        'cyber-grid': `
          linear-gradient(rgba(0, 229, 225, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 229, 225, 0.03) 1px, transparent 1px)
        `,
        'cyber-radial': 'radial-gradient(ellipse at top right, rgba(0, 229, 225, 0.08) 0%, transparent 50%)',
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      },
      backgroundSize: {
        'grid': '50px 50px',
      },
      // ========================================
      // ANIMATIONS
      // ========================================
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'scan-line': 'scan-line 3s linear infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 229, 225, 0.4)' },
          '50%': { boxShadow: '0 0 35px rgba(0, 229, 225, 0.7)' },
        },
        'scan-line': {
          '0%': { left: '-100%' },
          '100%': { left: '100%' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      // ========================================
      // BORDER RADIUS
      // ========================================
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
