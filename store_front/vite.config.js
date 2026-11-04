import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const normalizePath = (path) => path.replaceAll('\\', '/');

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      onwarn(warning, defaultHandler) {
        const id = normalizePath(warning.id || '');
        const isClientOnlyPackage =
          id.includes('/node_modules/framer-motion/') ||
          id.includes('/node_modules/lucide-react/');

        // These client-side packages include an RSC marker; Vite's SPA build
        // ignores it, so avoid repeating the same harmless warning per module.
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && warning.message.includes('"use client"') && isClientOnlyPackage) return;
        defaultHandler(warning);
      },
    },
  },
});
