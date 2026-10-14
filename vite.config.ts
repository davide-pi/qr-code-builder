import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['logo.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'QR Code Builder',
        short_name: 'QR Builder',
        description: 'Create styled QR codes and export them as PNG, SVG or PDF. Free, private, no sign-up.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#5a67d8',
        background_color: '#1e1e2e',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the whole build (shell, lazy chunks such as jsPDF, flag SVGs) for full offline use.
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,woff2}'],
        // The jsPDF chunk exceeds Workbox's 2 MiB default.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})
