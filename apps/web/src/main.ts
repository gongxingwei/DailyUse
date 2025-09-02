import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import App from './App.vue';
import router from './shared/router';
import vuetify from './shared/vuetify';
import { i18n } from './shared/i18n';

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

app.use(pinia).use(router).use(vuetify).use(i18n);

// app.config.globalProperties.$api = api as any;

// declare module 'vue' {
//   interface ComponentCustomProperties {
//     $api: typeof api;
//   }
// }

app.mount('#app').$nextTick(() => {
  console.log('🚀 App mounted successfully');
});
