import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Do not route Firebase reserved auth helper endpoints to index.html.
        navigateFallbackDenylist: [/^\/__\//],
      },
      manifest: {
        name: 'Family Activity Scheduler',
        short_name: 'Activity Scheduler',
        description: 'Manage kids activities and schedules',
        theme_color: '#ffffff',
        icons: [],
      },
    }),
  ],
})
