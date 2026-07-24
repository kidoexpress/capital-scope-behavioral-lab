import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Behavioral Lab runs on isolated ports so it can run alongside the
    // upstream Capital Scope Terminal (5173 / 8000) without collision.
    port: 5273,
    proxy: {
      '/api/yahoo': {
        // Route through FastAPI backend proxy for consistency between dev and production.
        // Same code path works in both environments.
        target: 'http://127.0.0.1:8100',
        changeOrigin: true,
      },
      '/api/claude': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/claude/, ''),
        headers: {
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
      },
      '/api/fmp': {
        target: 'https://financialmodelingprep.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/fmp/, ''),
      },
      '/api/finnhub': {
        target: 'https://finnhub.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/finnhub/, ''),
      },
      '/api/portfolio': {
        target: 'http://127.0.0.1:8100',
        changeOrigin: true,
      },
      '/api/synthetic-portfolio': {
        target: 'http://127.0.0.1:8100',
        changeOrigin: true,
      },
    },
  },
})
