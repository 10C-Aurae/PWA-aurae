import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
      manifest: {
        name: 'Aurae — Experiencias de Evento',
        short_name: 'Aurae',
        description: 'Tu experiencia de evento gamificada con Aura',
        theme_color: '#4169E1',
        background_color: '#0A0A0F',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /\/api\/v1\/eventos/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'eventos-cache' },
          },
          {
            urlPattern: /\/api\/v1\/aura/,
            handler: 'NetworkFirst',
            options: { cacheName: 'aura-cache' },
          },
        ],
      },
    }),
  ],
})
