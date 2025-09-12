import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const isDev = mode !== 'production';
  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@dailyuse/utils': path.resolve(__dirname, '../../packages/utils/src'),
        '@dailyuse/domain': path.resolve(__dirname, '../../packages/domain/src'),
        '@dailyuse/contracts': path.resolve(__dirname, '../../packages/contracts/src'),
        '@dailyuse/domain-client': path.resolve(__dirname, '../../packages/domain-client/src'),
        '@dailyuse/domain-core': path.resolve(__dirname, '../../packages/domain-core/src'),
        '@dailyuse/domain-server': path.resolve(__dirname, '../../packages/domain-server/src'),
        '@dailyuse/ui': path.resolve(__dirname, '../../packages/ui/src'),
      },
    },
    plugins: [vue()],
    server: {
      port: 5173,
      open: false,
    },
    preview: {
      port: 5173,
      open: false,
    },
    build: {
      sourcemap: isDev,
    },
  };
});
