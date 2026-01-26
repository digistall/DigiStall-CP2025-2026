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
      // MVC Role Folder Aliases (from FRONTEND-WEB at project root)
      '@BUSINESS_OWNER': fileURLToPath(new URL('../BUSINESS_OWNER/FRONTEND-WEB/VIEWS', import.meta.url)),
      '@BRANCH_MANAGER': fileURLToPath(new URL('../BRANCH_MANAGER/FRONTEND-WEB/VIEWS', import.meta.url)),
      '@STALL_HOLDER': fileURLToPath(new URL('../STALL_HOLDER/FRONTEND-WEB/VIEWS', import.meta.url)),
      '@EMPLOYEE': fileURLToPath(new URL('../EMPLOYEE/WEB_EMPLOYEE/FRONTEND-WEB/VIEWS', import.meta.url)),
      '@VENDOR': fileURLToPath(new URL('../VENDOR/FRONTEND-WEB/VIEWS', import.meta.url)),
      '@APPLICANTS': fileURLToPath(new URL('../APPLICANTS/FRONTEND-WEB/VIEWS', import.meta.url)),
      '@SYSTEM_ADMIN': fileURLToPath(new URL('../SYSTEM_ADMINISTRATOR/FRONTEND-WEB/VIEWS', import.meta.url)),
      '@PUBLIC': fileURLToPath(new URL('../PUBLIC-LANDINGPAGE/FRONTEND-WEB/VIEWS', import.meta.url)),
      '@PUBLIC_ASSETS': fileURLToPath(new URL('../PUBLIC-LANDINGPAGE/FRONTEND-WEB/ASSETS', import.meta.url)),
      '@SHARED': fileURLToPath(new URL('../SHARED', import.meta.url)),
      // SHARED/FRONTEND-WEB aliases (for shared Vue components, stores, services)
      '@SHARED_FE': fileURLToPath(new URL('../SHARED/FRONTEND-WEB', import.meta.url)),
      '@SHARED_COMPONENTS': fileURLToPath(new URL('../SHARED/FRONTEND-WEB/COMPONENTS', import.meta.url)),
      '@SHARED_AUTH': fileURLToPath(new URL('../SHARED/FRONTEND-WEB/AUTH', import.meta.url)),
      '@SHARED_STORES': fileURLToPath(new URL('../SHARED/FRONTEND-WEB/STORES', import.meta.url)),
      '@SHARED_SERVICES': fileURLToPath(new URL('../SHARED/FRONTEND-WEB/SERVICES', import.meta.url)),
      '@SHARED_UTILS': fileURLToPath(new URL('../SHARED/FRONTEND-WEB/UTILS', import.meta.url)),
      '@SHARED_CONFIG': fileURLToPath(new URL('../SHARED/FRONTEND-WEB/CONFIG', import.meta.url)),
      '@SHARED_PLUGINS': fileURLToPath(new URL('../SHARED/FRONTEND-WEB/PLUGINS', import.meta.url)),
      '@SHARED_ASSETS': fileURLToPath(new URL('../SHARED/FRONTEND-WEB/ASSETS', import.meta.url)),
      // Fix node_modules resolution for files outside FRONTEND-WEB
      'chart.js/auto': fileURLToPath(new URL('./node_modules/chart.js/auto/auto.js', import.meta.url)),
      'chart.js': fileURLToPath(new URL('./node_modules/chart.js', import.meta.url)),
      'xlsx': fileURLToPath(new URL('./node_modules/xlsx/xlsx.mjs', import.meta.url)),
      '@emailjs/browser': fileURLToPath(new URL('./node_modules/@emailjs/browser/es/index.js', import.meta.url))
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
    // Allow serving files from MVC role folders at project root
    fs: {
      allow: [
        fileURLToPath(new URL('.', import.meta.url)),
        fileURLToPath(new URL('..', import.meta.url)),
      ]
    }
  },
  // Optimize dependencies to avoid eval - CRITICAL for CSP
  optimizeDeps: {
    exclude: ['vue-demi'],
    esbuildOptions: {
      // Prevent esbuild from using eval
      define: {
        global: 'globalThis'
      }
    }
  }
})
