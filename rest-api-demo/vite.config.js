import { defineConfig, loadEnv } from 'vite'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Route browser API calls (VITE_RAVNUR_API_ENDPOINT=/rms-api/) through the dev
  // server to the real RMS endpoint, so the browser only ever talks to its own
  // origin and never hits CORS.
  const proxy = {
    '/rms-api': {
      target: env.RMS_API_TARGET,
      changeOrigin: true,          // set Host header to target (Azure Front Door routes by Host)
      secure: false,               // allow self-signed cert for the localhost:7239 alternative
      timeout: 300000,             // 5 min — some actions (e.g. start live event) are slow
      proxyTimeout: 300000,        // 5 min — outbound wait for the RMS endpoint to respond
      rewrite: (path) => path.replace(/^\/rms-api/, ''),
      // Log every proxied request/response/error to the terminal running `npm run dev`.
      configure: (proxy) => {
        proxy.on('proxyReq', (proxyReq, req) => {
          console.log(`[rms-proxy] --> ${req.method} ${req.url}`)
        })
        proxy.on('proxyRes', (proxyRes, req) => {
          console.log(`[rms-proxy] <-- ${proxyRes.statusCode} ${req.method} ${req.url}`)
        })
        proxy.on('error', (err, req) => {
          console.error(`[rms-proxy] xxx ${req.method} ${req.url} — ${err.message}`)
        })
      },
    },
  }

  return {
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          upload: resolve(__dirname, 'src/pages/upload.html'),
          live: resolve(__dirname, 'src/pages/live.html'),
        },
      },
    },
    server: { open: true, proxy },
    preview: { proxy },
  }
})
