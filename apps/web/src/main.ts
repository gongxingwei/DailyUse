import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import App from './App.vue';
import router from './shared/router';
import vuetify from './shared/vuetify';
import { i18n } from './shared/i18n';
import { AppInitializationManager } from './shared/initialization/AppInitializationManager';

// 导入事件系统示例（开发环境）
if (import.meta.env.DEV) {
  import('./shared/examples/eventSystemExample');
  import('./shared/debug/eventDebug');
}

async function startApp() {
  console.log('🚀 开始启动应用...');

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

  try {
    // 先完成应用模块初始化（包括认证状态恢复）
    console.log('⚙️ 初始化应用模块...');
    await AppInitializationManager.initializeApp();
    console.log('✅ 应用模块初始化完成');

    // 然后挂载应用
    console.log('🎯 挂载应用到DOM...');
    app.mount('#app').$nextTick(() => {
      console.log('🎉 应用启动成功！');
    });
  } catch (error) {
    console.error('❌ 应用启动失败:', error);

    // 即使初始化失败，也要挂载应用（但可能没有认证状态）
    console.log('🔄 尝试降级启动...');
    app.mount('#app').$nextTick(() => {
      console.log('⚠️ 应用以降级模式启动');
    });
  }
}

// 启动应用
startApp();
