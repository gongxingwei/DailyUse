/**
 * Router Guards
 * 路由守卫 - 处理认证和权限控制
 */

import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { useAuthStore } from '@/modules/authentication/presentation/stores/useAuthStore';

/**
 * 需要认证的路由标记
 */
export interface RouteMeta {
  /** 是否需要认证 */
  requiresAuth?: boolean;
  /** 需要的权限列表 */
  permissions?: string[];
  /** 页面标题 */
  title?: string;
  /** 是否在导航中显示 */
  showInNav?: boolean;
  /** 图标 */
  icon?: string;
  /** 排序权重 */
  order?: number;
}

/**
 * 声明路由元信息类型
 */
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    permissions?: string[];
    title?: string;
    showInNav?: boolean;
    icon?: string;
    order?: number;
  }
}

/**
 * 认证守卫 - 检查用户是否已登录
 */
export const authGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  const authStore = useAuthStore();

  // 检查路由是否需要认证
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

  if (requiresAuth) {
    // 检查用户是否已认证
    if (!authStore.isAuthenticated) {
      console.log('Route requires auth but user is not authenticated, redirecting to login');
      next({
        name: 'auth',
        query: {
          redirect: to.fullPath,
          reason: 'login_required',
        },
      });
      return;
    }

    // 检查token是否过期
    if (authStore.isTokenExpired) {
      console.log('Token expired, redirecting to login');
      authStore.clearAuth();
      next({
        name: 'auth',
        query: {
          redirect: to.fullPath,
          reason: 'token_expired',
        },
      });
      return;
    }

    // 检查是否需要刷新token
    if (authStore.needsRefresh && authStore.refreshToken) {
      try {
        // TODO: 实现token刷新逻辑
        console.log('Token needs refresh, attempting to refresh...');
        // await authService.refreshToken();
      } catch (error) {
        console.error('Token refresh failed:', error);
        authStore.clearAuth();
        next({
          name: 'auth',
          query: {
            redirect: to.fullPath,
            reason: 'refresh_failed',
          },
        });
        return;
      }
    }
  }

  next();
};

/**
 * 权限守卫 - 检查用户是否有访问特定路由的权限
 */
export const permissionGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  const authStore = useAuthStore();

  // 获取路由所需的权限
  const requiredPermissions = to.matched
    .flatMap((record) => record.meta.permissions || [])
    .filter((permission, index, array) => array.indexOf(permission) === index); // 去重

  if (requiredPermissions.length > 0) {
    // 检查用户是否有所需权限
    // TODO: 实现权限检查逻辑
    // const userPermissions = authStore.user?.permissions || [];
    // const hasPermission = requiredPermissions.every(permission =>
    //   userPermissions.includes(permission)
    // );

    // 临时跳过权限检查
    const hasPermission = true;

    if (!hasPermission) {
      console.log('User lacks required permissions:', requiredPermissions);
      next({
        name: 'unauthorized',
        query: {
          from: to.fullPath,
          required: requiredPermissions.join(','),
        },
      });
      return;
    }
  }

  next();
};

/**
 * 页面标题守卫 - 设置页面标题
 */
export const titleGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  // 从路由元信息中获取标题
  const title = to.matched
    .slice()
    .reverse()
    .find((record) => record.meta.title)?.meta.title;

  if (title) {
    document.title = `${title} - DailyUse`;
  } else {
    document.title = 'DailyUse';
  }

  next();
};

/**
 * 登录重定向守卫 - 已登录用户访问认证页面时重定向
 */
export const loginRedirectGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  const authStore = useAuthStore();

  // 如果访问登录页面但已经认证，重定向到首页
  if (to.name === 'auth' && authStore.isAuthenticated) {
    const redirect = (to.query.redirect as string) || '/';
    next(redirect);
    return;
  }

  next();
};

/**
 * 应用所有路由守卫
 */
export const applyRouterGuards = (router: any) => {
  // 全局前置守卫
  router.beforeEach(
    async (
      to: RouteLocationNormalized,
      from: RouteLocationNormalized,
      next: NavigationGuardNext,
    ) => {
      try {
        // 1. 登录重定向检查
        if (to.name === 'auth') {
          loginRedirectGuard(to, from, next);
          return;
        }

        // 2. 认证检查
        authGuard(to, from, next);

        // 如果认证检查没有调用next()，说明被重定向了
        // 这里不再继续后续检查
      } catch (error) {
        console.error('Router guard error:', error);
        next({ name: 'error', query: { message: 'Navigation failed' } });
      }
    },
  );

  // 全局后置钩子
  router.afterEach((to: RouteLocationNormalized) => {
    // 设置页面标题
    const title = to.matched
      .slice()
      .reverse()
      .find((record) => record.meta.title)?.meta.title;

    if (title) {
      document.title = `${title} - DailyUse`;
    } else {
      document.title = 'DailyUse';
    }

    // 页面加载完成后的处理
    console.log(`Navigated to: ${to.path}`);
  });
};
