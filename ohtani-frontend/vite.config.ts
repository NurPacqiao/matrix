import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { defineConfig, loadEnv, type Plugin } from 'vite'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

// The sign-in token lives in localStorage, so any script running on this page could read it.
// This limits scripts to our own and Google's sign-in, and requests to our API and Google.
// GitHub Pages can't send headers, hence a <meta> tag. Build only: the dev server needs
// inline scripts for hot reload.
function contentSecurityPolicy(apiUrl: string): Plugin {
  const policy = [
    "default-src 'self'",
    "script-src 'self' https://accounts.google.com/gsi/client",
    "style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style",
    "img-src 'self' data: https://*.googleusercontent.com",
    `connect-src 'self' ${new URL(apiUrl).origin} https://accounts.google.com/gsi/`,
    'frame-src https://accounts.google.com/gsi/',
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
  ].join('; ')

  return {
    name: 'content-security-policy',
    apply: 'build',
    transformIndexHtml: () => [
      { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: policy }, injectTo: 'head-prepend' },
    ],
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // || and not ??: an unset GitHub Actions variable arrives as an empty string
  const apiUrl = loadEnv(mode, process.cwd()).VITE_API_URL || 'http://localhost:5255/api'
  return {
    plugins: [react(), contentSecurityPolicy(apiUrl)],
    define: { __APP_VERSION__: JSON.stringify(version) },
    // GitHub Pages serves the app from /matrix/, so the deploy workflow sets BASE_PATH.
    // Local dev stays at /.
    base: process.env.BASE_PATH ?? '/',
  }
})
