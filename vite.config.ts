import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const vendorChunkGroups = [
  ['vendor-pdf-renderer', ['@react-pdf/renderer']],
  ['vendor-pdf-viewer', ['react-pdf', 'pdfjs-dist']],
  ['vendor-recharts', ['recharts']],
  ['vendor-excel', ['exceljs']],
  ['vendor-docs', ['docx', 'jszip', 'file-saver']],
  [
    'vendor-radix',
    [
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
    ],
  ],
  [
    'vendor-data',
    ['@tanstack/react-query', 'react-hook-form', 'zod'],
  ],
  [
    'vendor-tauri',
    [
      '@tauri-apps/api',
      '@tauri-apps/plugin-dialog',
      '@tauri-apps/plugin-fs',
    ],
  ],
  ['vendor-react', ['react', 'react-dom', 'react-router-dom']],
] as const;

function manualVendorChunk(moduleId: string): string | undefined {
  const normalizedId = moduleId.replaceAll('\\', '/');
  for (const [chunkName, packages] of vendorChunkGroups) {
    if (packages.some((packageName) => normalizedId.includes(`/node_modules/${packageName}/`))) {
      return chunkName;
    }
  }
  return undefined;
}

const isTauriDebugBuild = process.env.TAURI_ENV_DEBUG === 'true';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
  build: {
    target: 'baseline-widely-available',
    minify: isTauriDebugBuild ? false : 'oxc',
    sourcemap: isTauriDebugBuild,
    // PDF renderer (~1.58MB) is inherently large; Excel (~938KB) is isolated.
    // Warn only when a chunk grows beyond those reviewed dependency boundaries.
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: manualVendorChunk,
      },
    },
  },
  // VITE_ variables are intentionally public renderer configuration. Secrets
  // must never use this prefix; Tauri process variables stay outside the bundle.
  envPrefix: 'VITE_',
});
