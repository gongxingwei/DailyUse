import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import HelloWorld from '../views/HelloWorld.vue'
import MainLayout from '../layouts/MainLayout.vue'


// 定义路由配置
const routes: RouteRecordRaw[] = [
    {
        path: '/hello',
        name: 'hello',
        component: HelloWorld
    },
    {
        path: '/',
        component: MainLayout,
        children: [
            {
                path: '/hello',
                name: 'hello',
                component: HelloWorld
            },
            {
                path: '/task',
                name: 'task',
                component: () => import('../views/Task.vue')
            },
            {
                path: '/profile',
                name: 'profile',
                component: () => import('../views/Pro.vue')
            }
        ]
    }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局前置守卫（可选）
router.beforeEach((to, from, next) => {
  // 例如：修改页面标题
  document.title = `${to.meta.title || '默认标题'}`
  next()
})

export default router