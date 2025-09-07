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
import { createQuickLauncherI18n } from './i18n'
export class QuickLauncherRendererPlugin implements Plugin {
  private app: ReturnType<typeof createApp> | null = null;

  metadata: PluginMetadata = {
    name: 'QuickLauncherRenderer',
    version: '1.0.0',
    description: 'Quick launcher renderer plugin',
    author: 'DailyUse'
  }

  async init(): Promise<void> {
    // First unmount any existing app
    const appElement = document.getElementById('app')
    if (appElement) {
      if (this.app) {
        this.app.unmount()
        this.app = null
      }
      appElement.innerHTML = ''
    }

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
    const i18n = createQuickLauncherI18n()
    // Create the Vue app
    this.app = createApp(App)
    this.app.use(i18n)
    // Use plugins
    this.app.use(pinia)
    this.app.use(vuetify)

    // Provide electron ipcRenderer to all components
    // this.app.provide('shared', window.shared)

    // Mount the app
    this.app.mount('#app')
  }

  async destroy(): Promise<void> {
    if (this.app) {
      this.app.unmount()
      this.app = null
    }
    const appElement = document.getElementById('app')
    if (appElement) {
      appElement.innerHTML = ''
    }
  }
}

// Export a default instance
export default new QuickLauncherRendererPlugin()
