import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Smart Operation',
        short_name: 'Smart Op',
        dir: 'rtl',
        lang: 'ar',
        display: 'standalone',
        theme_color: '#0A0A0F',
        background_color: '#0A0A0F',
        icons: [
          { src: 'icons/pwa-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: 'icons/pwa-512x512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /\/locales\/.*\.json$/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'i18n-cache' },
          },
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/,
            handler: 'CacheFirst',
            options: { cacheName: 'firebase-images' },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
