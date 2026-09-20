import { defineConfig, type Plugin, type ViteDevServer, type PreviewServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// Keep development/preview URLs identical to the production static rewrites.
const mindstrikePages = new Set(['privacy', 'terms', 'support', 'delete-account'])
function installMindstrikeRoutes(server: ViteDevServer | PreviewServer) {
  server.middlewares.use((request, _response, next) => {
    const [pathname, query] = (request.url ?? '').split('?')
    const page = pathname.replace(/^\/mindstrike\//, '')
    const destination = pathname === '/mindstrike' || pathname === '/mindstrike/'
      ? '/mindstrike/index.html'
      : mindstrikePages.has(page) ? `/mindstrike/${page}.html` : undefined
    if (destination) request.url = destination + (query ? `?${query}` : '')
    next()
  })
}
const mindstrikeRoutes: Plugin = {
  name: 'mindstrike-static-pages',
  configureServer: installMindstrikeRoutes,
  configurePreviewServer: installMindstrikeRoutes,
}

export default defineConfig({
  plugins: [mindstrikeRoutes, react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
