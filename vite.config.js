import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Registro de Equipos',
        short_name: 'Equipos',
        description: 'Inventario de equipos: No. de serie, marca/modelo, RAM y comentarios',
        theme_color: '#0f1720',
        background_color: '#0f1720',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // cachea el shell de la app (JS/CSS/HTML) para que abra offline;
        // las llamadas a Firestore van directo a la red, no se cachean aquí
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ]
});
