import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const normalizePath = (path) => path.replaceAll('\\', '/');

export default defineConfig({
  plugins: [react()],
  build: {
    // The 3D engine is loaded with the product viewer and compresses to ~192 KB.
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
      output: {
        manualChunks(id) {
          const path = normalizePath(id);
          if (path.includes('/node_modules/three/')) return 'three-core';
          if (path.includes('/node_modules/@react-three/fiber/')) return 'r3f-fiber';
          if (path.includes('/node_modules/@react-three/drei/')) return 'r3f-drei';
        },
      },
    },
  },
});
