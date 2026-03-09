import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: '/PokeVault/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['tesseract.js'],
  },
  server: {
    proxy: {
      '/pokemon-tcg-api': {
        target: 'https://api.pokemontcg.io/v2',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/pokemon-tcg-api/, ''),
      },
      '/tcgdex-api': {
        target: 'https://api.tcgdex.net/v2',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tcgdex-api/, ''),
      },
    },
  },
})
