import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/family-activity-scheduler/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 20,
              },
            },
          },
        ],
      },
      manifest: {
        name: 'Family Activity Scheduler',
        short_name: 'Activity Scheduler',
        description: 'Manage kids activities and schedules',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/family-activity-scheduler/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/family-activity-scheduler/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
})
