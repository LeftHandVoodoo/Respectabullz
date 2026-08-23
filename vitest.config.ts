import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'scripts/**/*.{test,spec}.mjs',
    ],
    exclude: ['node_modules', 'dist', 'src-tauri'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'dist/',
        'scripts/',
        'src-tauri/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/',
        '**/__tests__/**',
        '**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      ],
      thresholds: {
        // Vitest 4/V8 instruments substantially more functions and branches
        // than the former Vitest 2 baseline. These integer floors ratchet the
        // measured 1.10.4 result without pretending the metrics are comparable.
        statements: 26,
        branches: 19,
        functions: 17,
        lines: 27,
        // Risk-focused ratchets complement the measured repository baseline.
        'src/lib/db/migrations.ts': {
          statements: 70,
          branches: 60,
          functions: 50,
          lines: 70,
        },
        'src/lib/documentWorkflow.ts': {
          statements: 54,
          branches: 10,
          functions: 55,
          lines: 54,
        },
        'src/lib/backupUtils.ts': {
          statements: 40,
          branches: 30,
          functions: 30,
          lines: 40,
        },
        'src/lib/fsUtils.ts': {
          statements: 80,
          branches: 50,
          functions: 60,
          lines: 80,
        },
        'src/lib/github.ts': {
          statements: 73,
          branches: 80,
          functions: 77,
          lines: 73,
        },
        'src/lib/contract{Destination,Template}.ts': {
          statements: 80,
          branches: 70,
          functions: 100,
          lines: 100,
        },
        'src/components/bug-report/BugReportDialog.tsx': {
          statements: 92,
          branches: 60,
          functions: 75,
          lines: 92,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
});

