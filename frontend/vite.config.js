import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

const apiProxy = {
  '/api': {
    target: process.env.VITE_API_TARGET || 'http://localhost:8081',
    changeOrigin: true
  }
}

export default defineConfig({
  plugins: [uni()],
  server: {
    proxy: apiProxy
  },
  preview: {
    proxy: apiProxy
  }
})
