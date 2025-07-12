import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import './style.css'
import App from './App.vue'
import router from './shared/router'
import vuetify from './plugins/vuetify'
import { PluginManager } from './plugins/core/PluginManager'
import quickLauncherPlugin from './plugins/quickLauncher/renderer/renderer';
import '@/shared/styles/icons.css'
import { i18n } from './i18n'
import { initializeApp } from './shared/initialization/appInitialization'
// import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'

// // 配置 Monaco Editor 的 worker
// (window as any).MonacoEnvironment = {
//   getWorker() {
//     return new editorWorker()
//   }
// }

// 创建 Pinia 实例并使用插件
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// 创建 Vue 应用实例
const app = createApp(App)

app
  .use(router)
  .use(vuetify)
  .use(pinia)
  .use(i18n)
// 初始化插件系统

const pluginManager = new PluginManager()
// 注册快速启动器插件
pluginManager.register(quickLauncherPlugin)

app.mount('#app')
  .$nextTick(() => {
    // 初始化所有插件
      window.shared.ipcRenderer.on('main-process-message', (_event: any, message: any) => {
        console.log(message)
      })
     (async () => {
      await initializeApp()
      console.log('🚀！！[src/main]: 初始化APP 成功')
    })()
  })
