import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt': a new version never reloads the page by itself (in-memory form data would be lost)
      registerType: 'prompt',
      injectRegister: 'auto',
      includeAssets: ['logo.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'QR Code Builder',
        short_name: 'QR Builder',
        description: 'Create styled QR codes and export them as PNG, SVG or PDF. Free, private, no sign-up.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#0d0a1a',
        background_color: '#0d0a1a',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the app shell and small lazy chunks (flag SVGs...).
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,woff2}'],
        // PDF export chunks (~780 kB) are only needed by who exports a PDF: cached at first use instead.
        globIgnores: ['**/assets/{jspdf.es.min,html2canvas,index.es,purify.es}-*.js'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => /\/assets\/(jspdf\.es\.min|html2canvas|index\.es|purify\.es)-[^/]+\.js$/.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'pdf-chunks',
              expiration: { maxEntries: 8 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})
