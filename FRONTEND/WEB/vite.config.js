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
      // Core app alias
      '@': fileURLToPath(new URL('./src', import.meta.url)),

      // === USER-ROLE MODULE ALIASES ===
      // Shared features (Dashboard, Payment, Applicants, etc.)
      '@shared-features': fileURLToPath(new URL('./SHARE-FEATURE', import.meta.url)),

      // Business Owner exclusive (Branch, Subscription)
      '@business-owner': fileURLToPath(new URL('./BUSINESS-OWNER', import.meta.url)),

      // Business Manager exclusive (Employees)
      '@business-manager': fileURLToPath(new URL('./BUSINESS-MANAGER', import.meta.url)),

      // Web Employee (permission-gated, uses shared features)
      '@web-employee': fileURLToPath(new URL('./WEB-EMPLOYEE', import.meta.url)),

      // Auth (Login, ForgotPassword)
      '@auth': fileURLToPath(new URL('./AUTH', import.meta.url)),

      // System Admin
      '@system-admin': fileURLToPath(new URL('./SYSTEM-ADMIN', import.meta.url)),

      // Public Landing Page
      '@landing': fileURLToPath(new URL('./LANDINGPAGE', import.meta.url)),

      // === SHARED COMPONENT ALIASES ===
      '@common': fileURLToPath(new URL('./src/components/Common', import.meta.url)),
      '@SHARED_COMPONENTS': fileURLToPath(new URL('./src/components/Common', import.meta.url)),

      // === APP RESOURCE ALIASES ===
      '@stores': fileURLToPath(new URL('./src/stores', import.meta.url)),
      '@services': fileURLToPath(new URL('./src/services', import.meta.url)),
      '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
      '@eventBus': fileURLToPath(new URL('./src/eventBus.js', import.meta.url)),
      '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),

      // === NPM PACKAGE ALIASES ===
      'axios': fileURLToPath(new URL('./node_modules/axios', import.meta.url)),
      'chart.js': fileURLToPath(new URL('./node_modules/chart.js', import.meta.url)),
      'chart.js/auto': fileURLToPath(new URL('./node_modules/chart.js/auto', import.meta.url)),
      'mitt': fileURLToPath(new URL('./node_modules/mitt', import.meta.url)),
      'xlsx': fileURLToPath(new URL('./node_modules/xlsx', import.meta.url)),
      '@emailjs/browser': fileURLToPath(new URL('./node_modules/@emailjs/browser', import.meta.url)),
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
        target: 'http://localhost:5000',
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
