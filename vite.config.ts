import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://staging.tsdc.vnedu.vn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false,
        headers: {
          'Origin': 'https://ninhbinh.tsdc.vnedu.vn',
          'Referer': 'https://ninhbinh.tsdc.vnedu.vn/'
        }
      }
    }
  }
})
