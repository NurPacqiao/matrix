import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves the app from /ohtaniApp/, so the deploy workflow sets BASE_PATH.
  // Local dev stays at /.
  base: process.env.BASE_PATH ?? '/',
})
