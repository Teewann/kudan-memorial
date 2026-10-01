import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'Kudan Memorial',
        short_name: 'Kudan Memorial',
        description: 'A community register of the deceased and families of Kudan.',
        theme_color: '#1e3a5f', // navy, matches --color-primary
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          // TODO: replace with real 192/512 (and maskable) icons before launch
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // Offline fallback: cached shell loads even with no network.
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: { cacheName: 'images', expiration: { maxEntries: 200 } },
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      // The API and uploaded photos live on the backend, port 4000.
      // These two lines make them appear as if they live on the client's
      // own port, so /uploads/xxx.jpg and /api/... both work in the browser.
      '/uploads': 'http://localhost:4000',
      '/api': 'http://localhost:4000',
    },
  },
});