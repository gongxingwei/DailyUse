/**
 * Route Definitions
 * 路由定义 - 统一管理所有路由配置
 */

import type { RouteRecordRaw } from 'vue-router';
import MainLayout from '@/modules/app/MainLayout.vue';

/**
 * 认证相关路由
 */
export const authRoutes: RouteRecordRaw[] = [
  {
    path: '/auth',
    name: 'auth',
    component: () => import('@/views/AuthView.vue'),
    meta: {
      title: '登录',
      requiresAuth: false,
    },
  },
];

/**
 * 错误页面路由
 */
export const errorRoutes: RouteRecordRaw[] = [
  {
    path: '/unauthorized',
    name: 'unauthorized',
    component: () => import('@/shared/components/UnauthorizedPage.vue'),
    meta: {
      title: '无权限访问',
      requiresAuth: false,
    },
  },
  {
    path: '/error',
    name: 'error',
    component: () => import('@/shared/components/ErrorPage.vue'),
    meta: {
      title: '错误',
      requiresAuth: false,
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/shared/components/NotFoundPage.vue'),
    meta: {
      title: '页面不存在',
      requiresAuth: false,
    },
  },
];

/**
 * 主应用路由
 */
export const appRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: MainLayout,
    meta: {
      requiresAuth: true,
    },
    children: [
      // 首页/仪表盘
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/modules/dashboard/presentation/views/DashboardView.vue'),
        meta: {
          title: '仪表盘',
          showInNav: true,
          icon: 'mdi-view-dashboard',
          order: 1,
          requiresAuth: true,
        },
      },

      // 任务管理
      {
        path: '/tasks',
        name: 'tasks',
        meta: {
          title: '任务管理',
          showInNav: true,
          icon: 'mdi-check-circle',
          order: 2,
          requiresAuth: true,
        },
        children: [
          {
            path: '',
            name: 'task-list',
            component: () => import('@/modules/task/presentation/views/TaskListView.vue'),
            meta: {
              title: '任务列表',
              requiresAuth: true,
            },
          },
          {
            path: 'create',
            name: 'task-create',
            component: () => import('@/modules/task/presentation/views/TaskCreateView.vue'),
            meta: {
              title: '创建任务',
              requiresAuth: true,
            },
          },
          {
            path: ':id',
            name: 'task-detail',
            component: () => import('@/modules/task/presentation/views/TaskDetailView.vue'),
            meta: {
              title: '任务详情',
              requiresAuth: true,
            },
            props: true,
          },
          {
            path: ':id/edit',
            name: 'task-edit',
            component: () => import('@/modules/task/presentation/views/TaskEditView.vue'),
            meta: {
              title: '编辑任务',
              requiresAuth: true,
            },
            props: true,
          },
        ],
      },

      // 目标管理
      {
        path: '/goals',
        name: 'goals',
        meta: {
          title: '目标管理',
          showInNav: true,
          icon: 'mdi-target',
          order: 3,
          requiresAuth: true,
        },
        children: [
          {
            path: '',
            name: 'goal-list',
            component: () => import('@/modules/goal/presentation/views/GoalListView.vue'),
            meta: {
              title: '目标列表',
              requiresAuth: true,
            },
          },
          {
            path: 'create',
            name: 'goal-create',
            component: () => import('@/modules/goal/presentation/views/GoalCreateView.vue'),
            meta: {
              title: '创建目标',
              requiresAuth: true,
            },
          },
          {
            path: ':id',
            name: 'goal-detail',
            component: () => import('@/modules/goal/presentation/views/GoalDetailView.vue'),
            meta: {
              title: '目标详情',
              requiresAuth: true,
            },
            props: true,
          },
          {
            path: ':id/edit',
            name: 'goal-edit',
            component: () => import('@/modules/goal/presentation/views/GoalEditView.vue'),
            meta: {
              title: '编辑目标',
              requiresAuth: true,
            },
            props: true,
          },
        ],
      },

      // 提醒管理
      {
        path: '/reminders',
        name: 'reminders',
        meta: {
          title: '提醒管理',
          showInNav: true,
          icon: 'mdi-bell',
          order: 4,
          requiresAuth: true,
        },
        children: [
          {
            path: '',
            name: 'reminder-list',
            component: () => import('@/modules/reminder/presentation/views/ReminderListView.vue'),
            meta: {
              title: '提醒列表',
              requiresAuth: true,
            },
          },
          {
            path: 'create',
            name: 'reminder-create',
            component: () => import('@/modules/reminder/presentation/views/ReminderCreateView.vue'),
            meta: {
              title: '创建提醒',
              requiresAuth: true,
            },
          },
          {
            path: ':id',
            name: 'reminder-detail',
            component: () => import('@/modules/reminder/presentation/views/ReminderDetailView.vue'),
            meta: {
              title: '提醒详情',
              requiresAuth: true,
            },
            props: true,
          },
          {
            path: ':id/edit',
            name: 'reminder-edit',
            component: () => import('@/modules/reminder/presentation/views/ReminderEditView.vue'),
            meta: {
              title: '编辑提醒',
              requiresAuth: true,
            },
            props: true,
          },
        ],
      },

      // 编辑器
      {
        path: '/editor',
        name: 'editor',
        meta: {
          title: '编辑器',
          showInNav: true,
          icon: 'mdi-file-edit',
          order: 5,
          requiresAuth: true,
        },
        children: [
          {
            path: '',
            name: 'editor-main',
            component: () => import('@/modules/editor/presentation/views/EditorView.vue'),
            meta: {
              title: '编辑器',
              requiresAuth: true,
            },
          },
          {
            path: 'file/:path*',
            name: 'editor-file',
            component: () => import('@/modules/editor/presentation/views/EditorView.vue'),
            meta: {
              title: '编辑文件',
              requiresAuth: true,
            },
            props: true,
          },
        ],
      },

      // 仓储管理
      {
        path: '/repositories',
        name: 'repositories',
        meta: {
          title: '仓储管理',
          showInNav: true,
          icon: 'mdi-source-repository',
          order: 6,
          requiresAuth: true,
        },
        children: [
          {
            path: '',
            name: 'repository-list',
            component: () =>
              import('@/modules/repository/presentation/views/RepositoryListView.vue'),
            meta: {
              title: '仓储列表',
              requiresAuth: true,
            },
          },
          {
            path: 'create',
            name: 'repository-create',
            component: () =>
              import('@/modules/repository/presentation/views/RepositoryCreateView.vue'),
            meta: {
              title: '添加仓储',
              requiresAuth: true,
            },
          },
          {
            path: ':id',
            name: 'repository-detail',
            component: () =>
              import('@/modules/repository/presentation/views/RepositoryDetailView.vue'),
            meta: {
              title: '仓储详情',
              requiresAuth: true,
            },
            props: true,
          },
          {
            path: ':id/edit',
            name: 'repository-edit',
            component: () =>
              import('@/modules/repository/presentation/views/RepositoryEditView.vue'),
            meta: {
              title: '编辑仓储',
              requiresAuth: true,
            },
            props: true,
          },
        ],
      },

      // 账户设置
      {
        path: '/account',
        name: 'account',
        meta: {
          title: '账户设置',
          showInNav: true,
          icon: 'mdi-account-cog',
          order: 7,
          requiresAuth: true,
        },
        children: [
          {
            path: '',
            name: 'account-profile',
            component: () => import('@/modules/account/presentation/views/ProfileView.vue'),
            meta: {
              title: '个人资料',
              requiresAuth: true,
            },
          },
          {
            path: 'settings',
            name: 'account-settings',
            component: () => import('@/modules/account/presentation/views/SettingsView.vue'),
            meta: {
              title: '账户设置',
              requiresAuth: true,
            },
          },
          {
            path: 'security',
            name: 'account-security',
            component: () => import('@/modules/account/presentation/views/SecurityView.vue'),
            meta: {
              title: '安全设置',
              requiresAuth: true,
              permissions: ['account:security'],
            },
          },
        ],
      },

      // 测试页面 (开发环境)
      {
        path: '/test',
        name: 'test',
        component: () => import('@/modules/account/presentation/views/TestView.vue'),
        meta: {
          title: '测试页面',
          showInNav: import.meta.env.DEV,
          icon: 'mdi-test-tube',
          order: 999,
          requiresAuth: true,
        },
      },
    ],
  },
];

/**
 * 所有路由配置
 */
export const routes: RouteRecordRaw[] = [...authRoutes, ...appRoutes, ...errorRoutes];

/**
 * 获取导航菜单项
 */
export const getNavigationRoutes = () => {
  return (
    appRoutes[0].children
      ?.filter((route) => route.meta?.showInNav)
      .sort((a, b) => (a.meta?.order || 0) - (b.meta?.order || 0))
      .map((route) => ({
        name: route.name,
        path: route.path,
        title: route.meta?.title,
        icon: route.meta?.icon,
        order: route.meta?.order,
      })) || []
  );
};
