import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
   server: {
    allowedHosts: ['.loca.lt', 'localhost'], // 👈 Add this line to accept the tunnel traffic
    hmr: {
      clientPort: 443, // Forces live reload sockets to work over secure HTTPS
    }
  }
})
