import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  base: '/PokeVault/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'PokeVault — TCG Collection & Deck Builder',
        short_name: 'PokeVault',
        description: 'Pokemon TCG card collection manager and deck builder',
        theme_color: '#0f0f1a',
        background_color: '#0f0f1a',
        display: 'standalone',
        start_url: '/PokeVault/',
        scope: '/PokeVault/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
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
