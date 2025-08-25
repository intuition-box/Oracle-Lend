import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '' : '/',
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '8ef19213-dfa9-4633-a860-550d67397915-00-12qagfqjojqwg.janeway.replit.dev',
      '.replit.dev',
      '.replit.app'
    ]
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ethers: ['ethers']
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': './src',
      '@assets': './attached_assets'
    }
  }
})