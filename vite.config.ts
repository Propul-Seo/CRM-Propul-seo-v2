import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['@react-pdf/renderer'],
  },
  build: {
    // Optimisations de build
    rollupOptions: {
      output: {
        // Manual chunks pour code splitting optimal
        manualChunks: {
          // Dependencies vendor
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['framer-motion', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'vendor-charts': ['recharts'],
          'vendor-calendar': ['@fullcalendar/core', '@fullcalendar/react', '@fullcalendar/daygrid'],
          'vendor-forms': ['react-hook-form', 'zod', '@hookform/resolvers'],
          // Supabase
          'vendor-supabase': ['@supabase/supabase-js'],
          // Utils
          'vendor-utils': ['date-fns', 'date-fns-tz', 'clsx', 'tailwind-merge'],
          // Zustand state management
          'vendor-state': ['zustand'],
          // PDF rendering (lazy-loaded, chunk séparé)
          'vendor-pdf': ['@react-pdf/renderer'],
        },
      },
    },
    // Optimisations générales
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    minify: 'esbuild', // Utiliser esbuild au lieu de terser
    // Source maps désactivés en production
    sourcemap: false,
  },
});
