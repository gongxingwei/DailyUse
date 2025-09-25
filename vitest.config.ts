/// <reference types="vitest" />
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
    ],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './apps/web/src'),
      '@dailyuse/contracts': resolve(__dirname, './packages/contracts/src'),
      '@dailyuse/domain-client': resolve(__dirname, './packages/domain-client/src'),
      '@dailyuse/domain-core': resolve(__dirname, './packages/domain-core/src'),
      '@dailyuse/ui': resolve(__dirname, './packages/ui/src'),
      '@dailyuse/utils': resolve(__dirname, './packages/utils/src'),
    },
  },
});
