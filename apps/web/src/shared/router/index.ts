/**
 * Vue Router Configuration
 * Vue路由配置 - 配置路由和权限管理
 */

import { createRouter, createWebHistory } from 'vue-router';
import { routes } from './routes';
import { applyRouterGuards } from './guards';

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
  // 滚动行为
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    if (to.hash) {
      return { el: to.hash };
    }
    return { top: 0 };
  },
});

// 应用路由守卫
applyRouterGuards(router);

export default router;
