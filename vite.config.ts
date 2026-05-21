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
