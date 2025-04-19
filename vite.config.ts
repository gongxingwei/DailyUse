import { defineConfig } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import vue from '@vitejs/plugin-vue'
import monacoEditorPlugin from 'vite-plugin-monaco-editor'
import fs from 'node:fs'

// 自动发现插件目录
const pluginsDir = path.resolve(__dirname, 'src/plugins')
const plugins = fs.readdirSync(pluginsDir)
  .filter(file => fs.statSync(path.join(pluginsDir, file)).isDirectory())
  .filter(dir => fs.existsSync(path.join(pluginsDir, dir, 'index.html')))

// 构建入口配置
const buildInputs = {
  main: path.resolve(__dirname, 'index.html'),
  ...Object.fromEntries(
    plugins.map(plugin => [
      plugin,
      path.resolve(__dirname, `src/plugins/${plugin}/index.html`)
    ])
  )
}

// 收集所有预加载脚本
const preloadInputs = {
  main_preload: path.join(__dirname, 'electron/preload.ts'),
  ...Object.fromEntries(
    plugins
      .filter(plugin => fs.existsSync(path.join(pluginsDir, plugin, 'electron/preload.ts')))
      .map(plugin => [
        `${plugin}_preload`,
        path.join(pluginsDir, plugin, 'electron/preload.ts')
      ])
  )
}

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './'),
      '@': path.resolve(__dirname, './src'),
      'src': path.resolve(__dirname, './src'),
    }
  },
  base: './',
  build: {
    rollupOptions: {
      input: buildInputs,
      output: {
        inlineDynamicImports: false,
        manualChunks: undefined
      }
    }
  },
  plugins: [
    (monacoEditorPlugin as any).default({
      languageWorkers:['editorWorkerService', 'json']
    }),
    vue(),
    electron({
      main: {
        entry: 'electron/main.ts',
      },
      preload: {
        input: preloadInputs,
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              output: {
                inlineDynamicImports: false,
                manualChunks: undefined,
                entryFileNames: '[name].mjs'
              }
            }
          }
        }
      },
      renderer: process.env.NODE_ENV === 'test'
        ? undefined
        : {},
    }),
  ],
})
