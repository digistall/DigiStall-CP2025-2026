// ===== VITE PLUGIN: DISABLE CSP IN DEVELOPMENT =====
// This plugin removes CSP headers in development mode to prevent eval blocking

export default function devNoCsp() {
  return {
    name: 'dev-no-csp',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Remove any CSP headers in development
        res.removeHeader('Content-Security-Policy')
        res.removeHeader('Content-Security-Policy-Report-Only')
        res.removeHeader('X-Content-Security-Policy')
        res.removeHeader('X-WebKit-CSP')
        next()
      })
    }
  }
}
