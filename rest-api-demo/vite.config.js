import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        upload: resolve(__dirname, 'src/pages/upload.html'),
        live: resolve(__dirname, 'src/pages/live.html'),
      },
    },
  },
  server: {
    open: true,
  },
})
