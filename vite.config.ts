import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    host: true,
    proxy: {
      '/api': 'http://localhost:3001',
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
      },
    },
  },
});
