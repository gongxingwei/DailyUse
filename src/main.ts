import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import './style.css'
import App from './App.vue'
import router from './router'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import '@mdi/font/css/materialdesignicons.css'

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi', // 设置默认图标集为 mdi
  },
})

// 创建 Pinia 实例并使用插件
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate) // 使用插件

createApp(App)
  .use(router)
  .use(vuetify)
  .use(pinia) // 将 Pinia 实例传递给 Vue 应用
  .mount('#app')
  .$nextTick(() => {
    // Use contextBridge
    window.ipcRenderer.on('main-process-message', (_event, message) => {
      console.log(message)
    })
  })
