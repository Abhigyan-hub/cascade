import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, '')
  const apiTarget = String(env.VITE_API_URL || 'https://api.cascade.mozartdev.in').replace(/\/$/, '')

  return {
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
          target: apiTarget,
          changeOrigin: true,
          configure(proxy) {
            proxy.on('error', (err, _req, res) => {
              console.error('[vite proxy /api]', err.message)
              if (res && !res.headersSent) {
                res.writeHead(502, { 'Content-Type': 'application/json' })
                res.end(
                  JSON.stringify({
                    message: `Cannot reach the API at ${apiTarget}. Check Nginx on api.cascade.mozartdev.in and that cascade-api is running on 127.0.0.1:4000.`,
                  })
                )
              }
            })
          },
        },
      },
    },
  }
})
