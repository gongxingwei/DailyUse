import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import Home from '../views/Home.vue'

// 定义路由配置
const routes: RouteRecordRaw[] = [
    {
        path: '/',
        component: MainLayout,
        children: [
            {
                path: '/home',
                name: 'home',
                component: Home
            },
            {
                path: '/document',
                name: 'document',
                component: () => import('../views/Document.vue')
            },
            {
                path: '/goal/:id',
                component: () => import('../views/Goal.vue'),
                children: [
                    {
                        path: 'maindoc',
                        name: 'MainDoc',
                        component: () => import('../components/goals/MainDoc.vue')
                    },
                    {
                        path: 'note',
                        name: 'Note',
                        component: () => import('../components/goals/Note.vue')
                    },
                    {
                        path: 'settings',
                        name: 'Settings',
                        component: () => import('../components/goals/Settings.vue')
                    },
                    {
                        path: '',
                        redirect: 'maindoc'
                    }
                ]
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