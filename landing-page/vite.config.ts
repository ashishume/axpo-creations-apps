import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { readFileSync } from 'node:fs'

// Mirror the static legal-page rewrites locally, including URLs without a trailing slash.
const legalRoutes = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf8')).rewrites
  .filter((route: { source: string }) => route.source.startsWith('/figureout') || route.source.startsWith('/mindstrike')) as { source: string; destination: string }[]
function serveLegal(req: { url?: string }, _res: unknown, next: () => void) {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const route = legalRoutes.find(route => route.source === url.pathname)
  if (route) req.url = route.destination + url.search
  next()
}

export default defineConfig({
  plugins: [{ name: 'app-static-pages', configureServer(server) { server.middlewares.use(serveLegal) },
    configurePreviewServer(server) { server.middlewares.use(serveLegal) } }, react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(import.meta.dirname, 'index.html'),
        axpo: path.resolve(import.meta.dirname, 'axpo.html'),
      },
    },
  },
})
