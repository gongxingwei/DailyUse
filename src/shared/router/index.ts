import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import MainLayout from '@/shared/layouts/MainLayout.vue'
import Home from '@/modules/Home/Home.vue'
import Editor from '@/modules/Repo/Editor.vue'
import Repository from '@/modules/Repo/Repo.vue'
import Setting from '@/modules/Setting/Setting.vue'
import NotificationWindow from '@/shared/utils/notification/NotificationWindow.vue'

// 定义路由配置
const routes: RouteRecordRaw[] = [
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
                path: '',
                name: 'home',
                component: Home
            },
            {
                path: '/todolist',
                name: 'todolist',
                component: () => import('@/modules/Todo/Todo.vue')
            },
            {
                path: '/profile',
                name: 'profile',
                component: () => import('@/modules/Profile/Pro.vue')
            },
            {
                path: '/repository',  
                name: 'repository',
                component: Repository
            },{
                path: '/reminder',
                name: 'reminder',
                component: () => import('@/modules/Reminder/Reminder.vue')
            },
            {
                path: '/repo/:title',
                name: 'repo',
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
            {
                path: '/editor',
                name: 'editor',
                component: () => import('@/modules/Editor/layouts/EditorLayout.vue')
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
  // 例如：修改页面标题
  document.title = `${to.meta.title || '默认标题'}`
  next()
})

export default router