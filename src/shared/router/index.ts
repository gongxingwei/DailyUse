import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import { useRepositoryStore } from '@/modules/Repository/stores/repositoryStore'
import { useAuthStore } from '@/modules/Account/stores/authStore';
import MainLayout from '@/modules/App/MainLayout.vue'
import Editor from '@/modules/Editor/Editor.vue'
import Setting from '@/modules/Setting/Setting.vue'
import NotificationWindow from '@/shared/utils/notification/NotificationWindow.vue'
import Summary from '@/modules/Summary/views/Summary.vue';

// 定义路由配置
const routes: RouteRecordRaw[] = [
    {
        path: '/',
        redirect: '/summary'
    },
    {
        path: '/login',
        name: 'login',
        component: () => import('@/modules/Account/views/LoginView.vue'),
        meta: {
            requiresAuth: false,
            title: '登录'
        }
    },
    {
        path: '/register',
        name: 'register',
        component: () => import('@/modules/Account/views/RegisterView.vue'),
        meta: {
            requiresAuth: false,
            title: '注册'
        }
    },
    {
        path: '/notification',
        name: 'notification',
        component: NotificationWindow
    },
    {
        path: '/',
        component: MainLayout,
        children: [
            {
                path: '/summary',
                name: 'summary',
                component: Summary,
            },
            {
                path: '/goal-management',
                name: 'goal-management',
                component: () => import('@/modules/Goal/views/GoalManagement.vue')
            },
            {
                path: '/goal/:goalId',
                name: 'goal-info',
                component: () => import('@/modules/Goal/views/GoalInfo.vue')
            },
            {
                path: '/goal-review/:goalId',
                name: 'goal-review',
                component: () => import('@/modules/Goal/views/GoalReview.vue')
            },
            {
                path: '/task-management',
                name: 'task-management',
                component: () => import('@/modules/Task/views/TaskManagement.vue')
            },

            {
                path: '/profile',
                name: 'profile',
                component: () => import('@/modules/Account/views/Profile.vue')
            },
            {
                path: '/repository',
                name: 'repository',
                component: () => import('@/modules/Repository/views/Repository.vue'),
            }, {
                path: '/reminder',
                name: 'reminder',
                component: () => import('@/modules/Reminder/Reminder.vue')
            },
            {
                path: '/repository/:title',
                name: 'repository-detail',
                component: Editor
            },
            {
                path: '/setting',
                name: 'setting',
                component: Setting
            },
            {
                path: '/test',
                name: 'test',
                component: () => import('@/modules/Test/Test.vue')
            },
        ]
    },
]

// 创建路由实例
const router = createRouter({
    history: createWebHashHistory(),
    routes
})

// 全局前置守卫（可选）
router.beforeEach((to, _from, next) => {
    const authStore = useAuthStore()
    // 设置页面标题
    document.title = `${to.meta.title || '默认标题'}`

    // 检查认证状态
    const publicPages = ['/login', '/register']
    const authRequired = !publicPages.includes(to.path)

   if (authRequired && !authStore.isAuthenticated) {
        // 存储原始目标路由
        return next({
            name: 'login',
            query: { redirect: to.fullPath }
        })
    }

    // 已登录用户访问登录/注册页面时重定向到首页
    if (authStore.isAuthenticated && publicPages.includes(to.path)) {
        return next('/summary')
    }

    // 检查是否访问仓库
    if (to.name === 'repository-detail' && to.params.title) {
        const store = useRepositoryStore()
        store.updateRepoLastVisitTime(decodeURIComponent(to.params.title as string))
    }
    next()
})

export default router