import { createApp, nextTick } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import App from './App.vue';
import router from './shared/router';
import vuetify from './shared/vuetify';
import { i18n } from './shared/i18n';
import { AppInitializationManager } from './shared/initialization/AppInitializationManager';
import { eventBus } from '@dailyuse/utils';

// 将 eventBus 挂载到全局 window 对象，供调试脚本使用
if (typeof window !== 'undefined') {
  (window as any).eventBus = eventBus;
  console.log('🌐 [Main] 已将 eventBus 挂载到全局 window 对象');
}

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

  let vueAppInstance: any = null;
  let isAppMounted = false;

  try {
    // 先完成应用模块初始化（包括认证状态恢复）
    console.log('⚙️ 初始化应用模块...');
    await AppInitializationManager.initializeApp();
    console.log('✅ 应用模块初始化完成');

    // 然后挂载应用
    console.log('🎯 挂载应用到DOM...');
    vueAppInstance = app.mount('#app');
    isAppMounted = true;
    console.log('✅ 应用已成功挂载到DOM');

    // 等待下一个 tick 并确认挂载成功
    await nextTick(() => {
      console.log('🎉 应用启动成功！');
      console.log('🔍 [Debug] 当前路由:', window.location.pathname);
      console.log('🔍 [Debug] Vue应用实例:', vueAppInstance);
      console.log('🔍 [Debug] DOM根节点:', document.getElementById('app'));
    });
  } catch (error) {
    console.error('❌ 应用启动失败:', error);

    // 如果应用还没挂载，尝试降级启动
    if (!isAppMounted) {
      console.log('🔄 尝试降级启动（应用未挂载）...');
      try {
        vueAppInstance = app.mount('#app');
        isAppMounted = true;
        console.log('⚠️ 应用以降级模式启动');
        console.log('🔍 [Debug] 降级模式 - 当前路由:', window.location.pathname);
        console.log('🔍 [Debug] 降级模式 - Vue应用实例:', vueAppInstance);
      } catch (mountError) {
        console.error('💥 应用挂载彻底失败:', mountError);
      }
    } else {
      console.log('⚠️ 应用已挂载，但初始化后处理失败');
      console.log('🔍 [Debug] 当前状态 - 路由:', window.location.pathname);
      console.log('🔍 [Debug] 当前状态 - Vue应用实例:', vueAppInstance);
    }
  }
}

// 启动应用
startApp();
