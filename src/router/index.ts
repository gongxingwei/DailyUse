import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import Home from '../views/Home.vue'

// 定义路由配置
const routes: RouteRecordRaw[] = [
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
                component: () => import('../views/ToDoList.vue')
            },
            {
                path: '/profile',
                name: 'profile',
                component: () => import('../views/Pro.vue')
            },
            {
                path: '/repo/:title',
                name: 'repo',
                component: () => import('../views/Goal.vue')
            }
        ]
    }
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