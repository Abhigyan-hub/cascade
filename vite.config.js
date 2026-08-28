import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root,
  publicDir: path.join(root, 'public'),
  plugins: [react()],
  build: {
    outDir: path.join(root, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.join(root, 'index.html'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
