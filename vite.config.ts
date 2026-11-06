import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// Strict CSP for the built site: no inline or third-party scripts, no network requests, images only from
// the app itself or local blob: URLs. Build-only, because Vite's dev server needs inline scripts for HMR.
// shortcut: <meta> CSP can't set frame-ancestors; add it as a real header if you host somewhere that allows headers.
const CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' blob:",
  "base-uri 'none'",
  "form-action 'none'",
  "require-trusted-types-for 'script'",
].join('; ')

const csp: Plugin = {
  name: 'csp',
  apply: 'build',
  transformIndexHtml: () => [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' }],
}

export default defineConfig({
  base: './', // works on any GitHub Pages repo name
  plugins: [react(), csp],
})
