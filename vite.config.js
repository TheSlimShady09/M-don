import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // During development the API runs separately (npm run dev starts both)
    proxy: {
      '/api': process.env.MDON_API || 'http://127.0.0.1:3001',
      '/uploads': process.env.MDON_API || 'http://127.0.0.1:3001',
    },
  },
});
