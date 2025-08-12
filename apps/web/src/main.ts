import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import App from './App.vue';
import router from './shared/router';
import { api } from './plugins/axios';
import 'vuetify/styles';
import { createVuetify } from 'vuetify';

const vuetify = createVuetify();

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

app.use(pinia).use(router).use(vuetify);

app.config.globalProperties.$api = api as any;

declare module 'vue' {
  interface ComponentCustomProperties {
    $api: typeof api;
  }
}

app.mount('#app');
