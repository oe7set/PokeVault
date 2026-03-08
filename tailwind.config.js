/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        fire: '#FF6B35',
        water: '#4D9DE0',
        grass: '#56B04C',
        electric: '#F7D842',
        psychic: '#E8649A',
        ice: '#74CCD3',
        dragon: '#6F35FC',
        darkness: '#5A4F72',
        fairy: '#F7B5DB',
        fighting: '#C22E28',
        poison: '#A33EA1',
        ground: '#E2BF65',
        flying: '#A98FF3',
        bug: '#A6B91A',
        rock: '#B6A136',
        ghost: '#735797',
        steel: '#B7B7CE',
        colorless: '#A8A878',
        surface: {
          50: '#1a1a2e',
          100: '#16213e',
          200: '#0f3460',
        },
        accent: {
          DEFAULT: '#e94560',
          hover: '#c73651',
        },
        card: {
          bg: '#1e1e2e',
          border: '#2a2a3e',
          hover: '#252535',
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
        'scan-line': 'scan 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        scan: {
          '0%': { top: '0%' },
          '100%': { top: '100%' },
        },
      },
    },
  },
  plugins: [],
}

