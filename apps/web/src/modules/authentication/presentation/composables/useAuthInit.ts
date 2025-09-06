/**
 * 应用启动时的认证初始化
 * 处理自动恢复认证状态、Token 检查等
 */

import { onMounted } from 'vue';
import { useAuthStore } from '../stores/useAuthStore';
import { useAuthenticationService } from './useAuthenticationService';

export function useAuthInit() {
  const authStore = useAuthStore();
  const authService = useAuthenticationService();

  /**
   * 初始化认证状态
   */
  const initAuth = async () => {
    try {
      // Pinia 持久化插件会自动恢复状态，并同步到 AuthManager

      // 检查是否有有效的 tokens
      if (authStore.isAuthenticated) {
        // 如果 token 过期，尝试刷新
        if (authStore.isTokenExpired) {
          console.log('🔄 Token expired, attempting refresh...');
          try {
            await authService.handleRefreshUser();
          } catch (error) {
            console.warn('⚠️ Token refresh failed, clearing auth state');
            authStore.clearAuth();
            return;
          }
        }

        // 初始化用户信息
        try {
          await authService.handleInitAuth();
          console.log('✅ Auth state initialized successfully');
        } catch (error) {
          console.warn('⚠️ Failed to initialize auth state:', error);
          authStore.clearAuth();
        }
      } else {
        console.log('ℹ️ No valid authentication found');
      }
    } catch (error) {
      console.error('❌ Auth initialization failed:', error);
      authStore.clearAuth();
    }
  };

  /**
   * 监听认证事件
   */
  const setupAuthListeners = () => {
    // 监听登出事件
    window.addEventListener('auth:logout', (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('🚪 Received logout event:', customEvent.detail);
      authStore.clearAuth();
    });

    // 监听 API 错误事件
    window.addEventListener('api:forbidden', (event: Event) => {
      const customEvent = event as CustomEvent;
      console.warn('🚫 API Forbidden:', customEvent.detail);
      // 可以显示权限不足的提示
    });

    window.addEventListener('api:rate_limit', (event: Event) => {
      const customEvent = event as CustomEvent;
      console.warn('⏰ API Rate Limited:', customEvent.detail);
      // 可以显示限流提示
    });

    window.addEventListener('api:server_error', (event: Event) => {
      const customEvent = event as CustomEvent;
      console.error('🔥 API Server Error:', customEvent.detail);
      // 可以显示服务器错误提示
    });
  };

  /**
   * 定期检查 Token 状态
   */
  const setupTokenWatcher = () => {
    // 每分钟检查一次 Token 状态
    setInterval(() => {
      if (authStore.isAuthenticated && authStore.needsRefresh) {
        console.log('🔄 Token needs refresh, refreshing...');
        authService.handleRefreshUser().catch((error) => {
          console.error('❌ Automatic token refresh failed:', error);
        });
      }
    }, 60 * 1000); // 1分钟
  };

  /**
   * 监听页面可见性变化
   */
  const setupVisibilityWatcher = () => {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && authStore.isAuthenticated) {
        // 页面重新可见时，检查 Token 状态
        if (authStore.isTokenExpired) {
          console.log('🔄 Page visible and token expired, refreshing...');
          authService.handleRefreshUser().catch((error) => {
            console.error('❌ Token refresh on visibility change failed:', error);
          });
        }
      }
    });
  };

  /**
   * 完整的初始化流程
   */
  const initialize = async () => {
    console.log('🚀 Initializing authentication...');

    await initAuth();
    setupAuthListeners();
    setupTokenWatcher();
    setupVisibilityWatcher();

    console.log('✅ Authentication initialization complete');
  };

  // 在组件挂载时自动初始化
  onMounted(() => {
    initialize();
  });

  return {
    initAuth,
    initialize,
    isAuthenticated: authStore.isAuthenticated,
    user: authStore.user,
    loading: authStore.loading,
  };
}
