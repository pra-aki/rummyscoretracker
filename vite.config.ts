import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // `npm run dev` keeps Vite's hot reload while forwarding API calls to
  // `npm run dev:api`, which runs the Functions against a local D1 file.
  server: {
    proxy: {
      '/api': 'http://localhost:8788',
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
