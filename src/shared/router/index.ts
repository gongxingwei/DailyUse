import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import { useRepositoryStore } from '@/modules/Repository/repositoryStore'
import MainLayout from '@/modules/App/MainLayout.vue'
import Home from '@/modules/Home/Home.vue'
import Editor from '@/modules/Editor/Editor.vue'
import Repository from '@/modules/Repository/Repository.vue'
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
                path: '/goal-management',
                name: 'goal-management',
                component: () => import('@/modules/Goal/views/GoalManagement.vue')
            },
            {
                path: 'goal/:id',
                name: 'goal-info',
                component: () => import('@/modules/Goal/views/GoalInfo.vue')
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
// 设置页面标题
document.title = `${to.meta.title || '默认标题'}`
  
// 检查是否访问仓库
if (to.name === 'repository-detail' && to.params.title) {
  const store = useRepositoryStore()
  store.addToRecent(decodeURIComponent(to.params.title as string))
  store.updateRepoLastVisitTime(decodeURIComponent(to.params.title as string))
}
  next()
})

export default router