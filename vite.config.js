import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/excalia': {
        target: 'https://excalia.fr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/excalia/, '/api')
      }
    }
  }
})
