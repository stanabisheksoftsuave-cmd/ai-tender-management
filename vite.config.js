import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Force a single React copy — react-excel-renderer ships a nested react@16,
  // which otherwise produces React-16 elements that React 19 refuses to render.
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
   server: {
    allowedHosts: ['.loca.lt', 'localhost'], // 👈 Add this line to accept the tunnel traffic
    hmr: {
      clientPort: 443, // Forces live reload sockets to work over secure HTTPS
    }
  }
})
