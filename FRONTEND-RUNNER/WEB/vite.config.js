import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import devNoCsp from './vite-plugin-dev-no-csp.js'

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // Configure Vue compiler for better CSP compliance
          whitespace: 'preserve'
        }
      }
    }),
    devNoCsp() // Remove CSP restrictions in development
  ],
  define: {
    'process.env': {},
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Shared components alias (used by .js files)
      '@SHARED_COMPONENTS': fileURLToPath(new URL('../../SHARED/FRONTEND-WEB/COMPONENTS/Common', import.meta.url)),
      // MVC Role-Based Folder Aliases - Import from role folders
      '@business-shared': fileURLToPath(new URL('../../BUSINESS/SHARED/FRONTEND-WEB', import.meta.url)),
      '@owner-manager': fileURLToPath(new URL('../../BUSINESS/OWNER-MANAGER/FRONTEND-WEB', import.meta.url)),
      '@auth': fileURLToPath(new URL('../../AUTH/FRONTEND-WEB', import.meta.url)),
      '@employee': fileURLToPath(new URL('../../EMPLOYEE/FRONTEND-WEB', import.meta.url)),
      '@stall-holder': fileURLToPath(new URL('../../STALL-HOLDER/FRONTEND-WEB', import.meta.url)),
      '@vendor': fileURLToPath(new URL('../../VENDOR/FRONTEND-WEB', import.meta.url)),
      '@applicants': fileURLToPath(new URL('../../APPLICANTS/FRONTEND-WEB', import.meta.url)),
      '@public-landing': fileURLToPath(new URL('../../PUBLIC-LANDINGPAGE/FRONTEND-WEB', import.meta.url)),
      '@system-admin': fileURLToPath(new URL('../../SYSTEM-ADMINISTRATOR/FRONTEND-WEB', import.meta.url)),
      '@shared': fileURLToPath(new URL('../../SHARED/FRONTEND-WEB', import.meta.url)),
      '@shared-assets': fileURLToPath(new URL('../../SHARED/FRONTEND-WEB/ASSETS', import.meta.url)),
      // NPM package aliases for MVC folders (resolve to local node_modules)
      'axios': fileURLToPath(new URL('./node_modules/axios', import.meta.url)),
      'chart.js': fileURLToPath(new URL('./node_modules/chart.js', import.meta.url)),
      'chart.js/auto': fileURLToPath(new URL('./node_modules/chart.js/auto', import.meta.url)),
      'mitt': fileURLToPath(new URL('./node_modules/mitt', import.meta.url)),
      'xlsx': fileURLToPath(new URL('./node_modules/xlsx', import.meta.url)),
      '@emailjs/browser': fileURLToPath(new URL('./node_modules/@emailjs/browser', import.meta.url)),
      // Common component aliases for MVC file relative imports
      '@common': fileURLToPath(new URL('../../SHARED/FRONTEND-WEB/COMPONENTS/Common', import.meta.url)),
      '@stores': fileURLToPath(new URL('./src/stores', import.meta.url)),
      '@services': fileURLToPath(new URL('./src/services', import.meta.url)),
      '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
      '@eventBus': fileURLToPath(new URL('./src/eventBus.js', import.meta.url)),
      '@utils': fileURLToPath(new URL('./src/utils', import.meta.url))
    }
  },
  build: {
    // Production build optimizations
    minify: 'esbuild', // esbuild is faster and CSP-safe
    target: 'es2015',
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        // Ensure CSP-safe output
        manualChunks: {
          'vendor': ['vue', 'vue-router', 'pinia'],
          'vuetify': ['vuetify']
        }
      }
    }
  },
  server: {
    // CSP-friendly development server settings
    host: '0.0.0.0', // Allow external connections (for Docker)
    port: 5173,
    hmr: {
      protocol: 'ws',
      host: 'localhost'
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  // Optimize dependencies to avoid eval - CRITICAL for CSP
  optimizeDeps: {
    exclude: ['vue-demi'],
    include: ['chart.js', 'chart.js/auto', 'mitt', 'xlsx', '@emailjs/browser'],
    esbuildOptions: {
      // Prevent esbuild from using eval
      define: {
        global: 'globalThis'
      }
    }
  }
})
