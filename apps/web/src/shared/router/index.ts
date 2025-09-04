import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '@/modules/app/MainLayout.vue';
const routes = [
  {
    path: '/auth',
    name: 'auth',
    component: () => import('@/views/AuthView.vue'),
  },
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '/',
        name: 'home',
        component: () => import('@/modules/account/presentation/views/TestView.vue'),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
