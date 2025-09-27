/**
 * Schedule 模块路由配置
 */

import type { RouteRecordRaw } from 'vue-router';

export const scheduleRoutes: RouteRecordRaw[] = [
  {
    path: '/schedule',
    name: 'Schedule',
    redirect: '/schedule/management',
    meta: {
      title: '调度管理',
      requiresAuth: true,
    },
  },
  {
    path: '/schedule/management',
    name: 'ScheduleManagement',
    component: () => import('../presentation/views/ScheduleManagementView.vue'),
    meta: {
      title: '调度管理',
      requiresAuth: true,
    },
  },
];
