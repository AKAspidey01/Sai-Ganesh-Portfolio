import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    // The three.js coin (coin3d chunk, ~540 kB / 135 kB gzip) is lazy-loaded
    // after first paint, so its size doesn't affect the initial load.
    chunkSizeWarningLimit: 600,
  },
});
