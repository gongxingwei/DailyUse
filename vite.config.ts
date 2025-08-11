/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import path from 'node:path';
import electron from 'vite-plugin-electron/simple';
import vue from '@vitejs/plugin-vue';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';
import fs from 'node:fs';

// 自动发现插件目录
const pluginsDir = path.resolve(__dirname, 'src/plugins');
const plugins = fs
  .readdirSync(pluginsDir)
  .filter((file) => fs.statSync(path.join(pluginsDir, file)).isDirectory())
  .filter((dir) => fs.existsSync(path.join(pluginsDir, dir, 'index.html')));

// 构建入口配置
const buildInputs = {
  main: path.resolve(__dirname, 'index.html'),
  ...Object.fromEntries(
    plugins.map((plugin) => [plugin, path.resolve(__dirname, `src/plugins/${plugin}/index.html`)]),
  ),
};

// 收集所有预加载脚本
const preloadInputs = {
  main_preload: path.join(__dirname, 'electron/preload.ts'),
  login_preload: path.join(__dirname, 'electron/preload/loginPreload.ts'),
  ...Object.fromEntries(
    plugins
      .filter((plugin) => fs.existsSync(path.join(pluginsDir, plugin, 'electron/preload.ts')))
      .map((plugin) => [`${plugin}_preload`, path.join(pluginsDir, plugin, 'electron/preload.ts')]),
  ),
};

// 原生模块列表
const nativeModules = ['better-sqlite3', 'bcrypt', 'electron'];

// 本地工作区包（避免被 optimizeDeps 处理）
const workspacePkgs = [
  '@dailyuse/utils',
  '@dailyuse/domain',
  '@dailyuse/contracts',
  '@dailyuse/ui',
];

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './'),
      '@': path.resolve(__dirname, './src'),
      src: path.resolve(__dirname, './src'),
      '@electron': path.resolve(__dirname, './electron'),
      '@common': path.resolve(__dirname, './common'),
      // 如需源码直引可开启：
      // '@dailyuse/utils': path.resolve(__dirname, './packages/utils/src'),
      // '@dailyuse/domain': path.resolve(__dirname, './packages/domain/src'),
      // '@dailyuse/contracts': path.resolve(__dirname, './packages/contracts/src'),
      // '@dailyuse/ui': path.resolve(__dirname, './packages/ui/src'),
    },
  },
  base: './',
  build: {
    rollupOptions: {
      input: buildInputs,
      output: {
        inlineDynamicImports: false,
        manualChunks: undefined,
      },
      // 在主构建中也排除原生模块
      external: nativeModules,
    },
  },
  optimizeDeps: {
    exclude: [...nativeModules, ...workspacePkgs],
  },
  test: {
    globals: true,
    include: ['src/**/*.test.ts', 'electron/**/*.test.ts'],
    environment: 'node', // 默认 node
    environmentMatchGlobs: [
      ['src/**/*.test.ts', 'jsdom'], // src 下测试用 jsdom
      ['electron/**/*.test.ts', 'node'], // electron 下测试用 node
    ],
  },
  plugins: [
    (monacoEditorPlugin as any).default({
      languageWorkers: ['editorWorkerService', 'json'],
    }),
    vue(),
    electron({
      main: {
        entry: 'electron/main.ts',
        vite: {
          resolve: {
            alias: {
              '@': path.resolve(__dirname, './src'),
              '@electron': path.resolve(__dirname, './electron'),
              '@common': path.resolve(__dirname, './common'),
            },
          },
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: nativeModules,
              output: {
                format: 'es',
              },
            },
          },
          optimizeDeps: {
            exclude: [...nativeModules, ...workspacePkgs],
          },
        },
      },
      preload: {
        input: preloadInputs,
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: nativeModules,
              output: {
                inlineDynamicImports: false,
                manualChunks: undefined,
                entryFileNames: '[name].mjs',
              },
            },
          },
          optimizeDeps: {
            exclude: [...nativeModules, ...workspacePkgs],
          },
        },
      },

      renderer: process.env.NODE_ENV === 'test' ? undefined : {},
    }),
  ],
});
