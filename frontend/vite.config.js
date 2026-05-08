import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

const apiTarget = process.env.VITE_API_TARGET || 'http://localhost:8080'

const apiProxy = {
  '/api': {
    target: apiTarget,
    changeOrigin: true,
    configure: (proxy) => {
      proxy.on('error', (err, req, res) => {
        console.error('[proxy error]', req.url, 'target:', apiTarget, 'code:', err.code, 'msg:', err.message, 'stack:', err.stack?.slice(0, 200))
      })
      proxy.on('proxyReq', (proxyReq, req) => {
        console.log('[proxy req]', req.method, req.url, '->', apiTarget + proxyReq.path)
      })
      proxy.on('proxyRes', (proxyRes, req) => {
        console.log('[proxy res]', req.url, proxyRes.statusCode)
      })
    }
  }
}

export default defineConfig({
  plugins: [uni()],
  server: {
    host: '0.0.0.0',
    proxy: apiProxy
  },
  preview: {
    proxy: apiProxy
  }
})
