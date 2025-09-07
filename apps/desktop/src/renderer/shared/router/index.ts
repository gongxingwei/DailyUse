import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import MainLayout from '@renderer/modules/App/MainLayout.vue';
import NotificationWindow from '@renderer/shared/utils/notification/NotificationWindow.vue';
import Summary from '@renderer/modules/Summary/views/Summary.vue';

// 定义路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/summary',
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@renderer/views/AuthView.vue'),
    meta: {
      requiresAuth: false,
      hideLayout: true,
      title: '用户登录',
    },
  },
  {
    path: '/notification',
    name: 'notification',
    component: NotificationWindow,
  },
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '/auth',
        name: 'auth',
        component: () => import('@renderer/views/AuthView.vue'),
        meta: {
          requiresAuth: false,
          title: '用户认证',
        },
      },
      {
        path: '/summary',
        name: 'summary',
        component: Summary,
      },
      {
        path: '/goal-management',
        name: 'goal-management',
        component: () => import('@renderer/modules/Goal/presentation/views/GoalManagement.vue'),
      },
      {
        path: '/goal/:goalUuid',
        name: 'goal-info',
        component: () => import('@renderer/modules/Goal/presentation/views/GoalInfo.vue'),
      },
      {
        path: '/goal/:goalUuid/:keyResultUuid',
        name: 'key-result-info',
        component: () => import('@renderer/modules/Goal/presentation/views/KeyResultInfo.vue'),
      },
      {
        path: '/goal-review/:goalUuid',
        name: 'goal-review',
        component: () => import('@renderer/modules/Goal/presentation/views/GoalReview.vue'),
      },
      {
        path: '/task-management',
        name: 'task-management',
        component: () => import('@renderer/modules/Task/presentation/views/TaskManagementView.vue'),
      },
      {
        path: '/repository',
        name: 'repository',
        component: () =>
          import('@renderer/modules/Repository/presentation/views/RepositoryView.vue'),
      },
      {
        path: '/reminder',
        name: 'reminder',
        component: () => import('@renderer/modules/Reminder/presentation/views/ReminderView.vue'),
      },
      {
        path: '/repository/:title',
        name: 'repository-detail',
        component: () => import('@renderer/modules/Editor/Editor.vue'),
      },
      {
        path: '/setting',
        name: 'setting',
        component: () => import('@renderer/modules/Setting/views/Setting.vue'),
      },
      {
        path: '/about',
        name: 'about',
        component: () => import('@renderer/views/AboutView.vue'),
      },
      {
        path: '/test',
        name: 'test',
        component: () => import('@renderer/modules/Test/Test.vue'),
      },
    ],
  },
];

// 创建路由实例
const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// 全局前置守卫（可选）
router.beforeEach((to, from, next) => {
  console.log('[router.beforeEach] 跳转到:', to.fullPath, '来自:', from.fullPath);

  // 设置页面标题
  document.title = `${to.meta.title || '默认标题'}`;

  // 检查认证状态
  //     const publicPages = ['/auth','/notification']
  //     const authRequired = !publicPages.includes(to.path)

  //    if (authRequired && !accountStore.isAuthenticated) {
  //         // 存储原始目标路由
  //         return next({
  //             name: 'auth',
  //             query: { redirect: to.fullPath }
  //         })
  //     }

  //     // 已登录用户访问登录/注册页面时重定向到首页
  //     if (accountStore.isAuthenticated && publicPages.includes(to.path)) {
  //         return next('/summary')
  //     }

  next();
});

router.afterEach((to, from) => {
  console.log('[router.afterEach] 跳转到:', to.fullPath, '来自:', from.fullPath);
});

export default router;
