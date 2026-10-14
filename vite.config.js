import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Forward API calls to the order server in server/index.js.
    proxy: { '/api': 'http://localhost:3001' },
  },
})
