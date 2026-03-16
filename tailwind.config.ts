import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fdf8f0',
          100: '#faefd8',
          200: '#f5d9a8',
          300: '#efc06b',
          400: '#e8a23a',  // primary amber
          500: '#d4841a',
          600: '#b56a10',
          700: '#8f500f',
          800: '#6b3d10',
          900: '#4d2d0f',
        },
        surface: {
          DEFAULT: '#fdf8f0',
          sidebar: '#292524',  // warm dark sidebar (stone-800)
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'celebrate-row': {
          '0%':   { transform: 'scale(1)', backgroundColor: 'transparent' },
          '40%':  { transform: 'scale(1.03)', backgroundColor: '#fef3c7' },
          '100%': { transform: 'scale(1)', backgroundColor: 'transparent' },
        },
        'category-glow': {
          '0%, 100%': { boxShadow: 'none' },
          '40%':      { boxShadow: '0 0 0 2px #fbbf24' },
        },
      },
      animation: {
        'celebrate-row': 'celebrate-row 0.8s ease-out',
        'category-glow': 'category-glow 0.8s ease-out',
      },
    },
  },
  plugins: [],
}

export default config
