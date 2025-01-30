import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/styles'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import { Plugin, PluginMetadata } from '@/plugins/core/types'

export class QuickLauncherRendererPlugin implements Plugin {
  private app: ReturnType<typeof createApp> | null = null;
  
  metadata: PluginMetadata = {
    name: 'QuickLauncherRenderer',
    version: '1.0.0',
    description: 'Quick launcher renderer plugin',
    author: 'DailyUse'
  }
  
  async init(): Promise<void> {
    console.log('[QuickLauncherRenderer] 1. 开始初始化渲染进程插件');
    
    // First unmount any existing app
    const appElement = document.getElementById('app')
    if (appElement) {
      console.log('[QuickLauncherRenderer] 2. 找到app元素，准备清理');
      if (this.app) {
        console.log('[QuickLauncherRenderer] 3. 卸载已存在的Vue实例');
        this.app.unmount()
        this.app = null
      }
      appElement.innerHTML = ''
    }

    console.log('[QuickLauncherRenderer] 4. 创建Vuetify实例');
    // Create an independent Vuetify instance
    const vuetify = createVuetify({
      components,
      directives,
      icons: {
        defaultSet: 'mdi',
        aliases,
        sets: {
          mdi,
        },
      },
      theme: {
        defaultTheme: 'dark'
      }
    })

    // Create pinia instance with persistence plugin
    const pinia = createPinia()
    pinia.use(piniaPluginPersistedstate)

    console.log('[QuickLauncherRenderer] 5. 创建Vue应用实例');
    // Create the Vue app
    this.app = createApp(App)

    console.log('[QuickLauncherRenderer] 6. 注册插件');
    // Use plugins
    this.app.use(pinia)
    this.app.use(vuetify)

    console.log('[QuickLauncherRenderer] 7. 提供IPC通信接口');
    // Provide electron ipcRenderer to all components
    this.app.provide('ipcRenderer', window.electron.ipcRenderer)

    console.log('[QuickLauncherRenderer] 8. 挂载应用');
    // Mount the app
    this.app.mount('#app')
    console.log('[QuickLauncherRenderer] 9. 初始化完成');
  }

  async destroy(): Promise<void> {
    console.log('[QuickLauncherRenderer] 开始销毁插件');
    if (this.app) {
      console.log('[QuickLauncherRenderer] 卸载Vue实例');
      this.app.unmount()
      this.app = null
    }
    const appElement = document.getElementById('app')
    if (appElement) {
      console.log('[QuickLauncherRenderer] 清理DOM');
      appElement.innerHTML = ''
    }
    console.log('[QuickLauncherRenderer] 销毁完成');
  }
}

// Export a default instance
export default new QuickLauncherRendererPlugin()