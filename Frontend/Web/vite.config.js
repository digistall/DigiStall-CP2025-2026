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
      '@': fileURLToPath(new URL('./src', import.meta.url))
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
    esbuildOptions: {
      // Prevent esbuild from using eval
      define: {
        global: 'globalThis'
      }
    }
  }
})
