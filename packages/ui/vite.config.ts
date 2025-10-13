/**
 * @dailyuse/ui 打包配置
 *
 * 包类型：Vue 3 组件库
 * 打包工具：Vite (Library Mode)
 *
 * 选择原因：
 * 1. Vue 组件库需要处理 .vue 文件和 CSS
 * 2. Vite 对 Vue 3 有最佳支持
 * 3. 支持 CSS 代码分割和优化
 * 4. HMR 快速，开发体验好
 *
 * 打包策略：
 * - 格式：ESM (现代化)
 * - 外部化：vue, vuetify, @mdi/font (作为 peer dependencies)
 * - CSS：打包到单独文件 (style.css)
 * - Tree-shaking：自动支持
 */

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  // ============================================================
  // 插件配置
  // ============================================================

  plugins: [
    // Vue 3 支持
    vue(),
  ],

  // ============================================================
  // 构建配置 (Library Mode)
  // ============================================================

  build: {
    // 库模式配置
    lib: {
      // 入口文件
      entry: resolve(__dirname, 'src/index.ts'),

      // 库名称 (用于 UMD/IIFE 格式)
      name: 'DailyUseUI',

      // 输出文件名
      fileName: 'index',

      // 输出格式：仅 ESM (现代化，支持 tree-shaking)
      formats: ['es'],
    },

    // ============================================================
    // Rollup 配置
    // ============================================================

    rollupOptions: {
      // 外部化 peer dependencies (不打包到 bundle 中)
      external: [
        'vue',
        'vuetify',
        '@mdi/font',
        // 外部化所有 vuetify 子模块
        /^vuetify\/.*/,
      ],

      // 输出配置
      output: {
        // 全局变量名 (用于 UMD 格式，但我们只用 ESM)
        globals: {
          vue: 'Vue',
          vuetify: 'Vuetify',
        },

        // 保留模块结构 (便于 tree-shaking)
        preserveModules: false,

        // 导出模式
        exports: 'named',
      },
    },

    // ============================================================
    // 构建优化
    // ============================================================

    // CSS 不分割 (组件库通常打包到单个 CSS 文件)
    cssCodeSplit: false,

    // Source map (便于调试)
    sourcemap: true,

    // 目标环境
    target: 'es2020',

    // 压缩代码
    minify: 'esbuild',
  },

  // ============================================================
  // 路径别名
  // ============================================================

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
