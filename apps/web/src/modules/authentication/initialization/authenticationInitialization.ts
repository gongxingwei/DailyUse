/**
 * 认证模块初始化任务注册
 * Authentication Module Initialization Tasks
 */

import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';
import { useAuthStore } from '../presentation/stores/useAuthStore';
import { useAccountStore } from '@/modules/account';
import { AuthManager } from '../../../shared/api/core/interceptors';
import { Account } from '@dailyuse/domain-client';
/**
 * 注册认证模块的所有初始化任务
 */
export function registerAuthenticationInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  // 1. 认证状态恢复任务
  const authStateRestoreTask: InitializationTask = {
    name: 'auth-state-restore',
    phase: InitializationPhase.APP_STARTUP,
    priority: 15,
    initialize: async () => {
      console.log('🔐 [AuthModule] 恢复认证状态');
      const accountStore = useAccountStore();
      const authStore = useAuthStore();
      // 方案2：直接从 localStorage 读取持久化数据
      const persistedData = localStorage.getItem('auth');
      let authData = null;
      const tokenInfo = {
        accessToken: AuthManager.getAccessToken(),
        refreshToken: AuthManager.getRefreshToken(),
        rememberToken: AuthManager.getRememberToken(),
        expiresIn: AuthManager.getTokenExpiry(),
      };

      if (persistedData && tokenInfo.accessToken && tokenInfo.refreshToken) {
        try {
          authData = JSON.parse(persistedData);
          console.log('🔍 [AuthModule] localStorage 中的认证状态:', authData.account);
          const accountEntity = Account.fromDTO(authData.account);
          accountStore.setAccount(accountEntity);
          // 安全调用 setTokens，提供默认值
          authStore.setTokens({
            accessToken: tokenInfo.accessToken,
            refreshToken: tokenInfo.refreshToken,
            rememberToken: tokenInfo.rememberToken || undefined, // 可选参数
            expiresIn: tokenInfo.expiresIn || undefined, // 可选参数
          });
          console.log('✅ [AuthModule] 账户信息已恢复:', accountEntity);
        } catch (error) {
          console.error('❌ [AuthModule] 解析持久化数据失败:', error);
          localStorage.removeItem('auth'); // 清除损坏的数据
        }
      }

      // 获取 Pinia store 实例（此时数据可能还没有恢复）

      console.log('🔍 [AuthModule] Pinia store 认证状态:', authStore.accessToken);

      // 使用 localStorage 中的数据进行状态恢复
      const effectiveAuthData = authData || {
        accessToken: authStore.accessToken,
        refreshToken: authStore.refreshToken,
        rememberToken: authStore.rememberToken,
        expiresIn: authStore.tokenExpiry,
        user: authStore.user,
      };

      // 如果有有效的认证状态，同步到 AuthManager 并恢复用户会话
      if (effectiveAuthData.accessToken && effectiveAuthData.user) {
        console.log('✅ [AuthModule] 发现有效的认证状态，准备自动登录');

        // 手动同步数据到 Pinia store（如果还没有恢复）
        if (!authStore.accessToken && authData) {
          authStore.setTokens({
            accessToken: authData.accessToken,
            refreshToken: authData.refreshToken || '',
            rememberToken: authData.rememberToken || '',
            expiresIn: authData.expiresIn || 3600,
          });
          if (authData.user) {
            authStore.setUser(authData.user);
          }
        }

        // 同步到 AuthManager
        authStore.syncToAuthManager();

        // 检查 token 是否过期
        const isTokenExpired = authStore.isTokenExpired;
        const needsRefresh = authStore.needsRefresh;

        if (isTokenExpired) {
          console.log('⚠️ [AuthModule] Token已过期，清除认证状态');
          authStore.clearAuth();
          return;
        }

        // 如果需要刷新token，先刷新
        if (needsRefresh && authStore.refreshToken) {
          console.log('🔄 [AuthModule] Token即将过期，尝试刷新');
          try {
            // 使用认证应用服务来刷新token
            const { AuthApplicationService } = await import(
              '../application/services/AuthApplicationService'
            );
            const authService = await AuthApplicationService.getInstance();

            await authService.refreshToken();
            console.log('✅ [AuthModule] Token刷新成功');
          } catch (error) {
            console.error('❌ [AuthModule] Token刷新失败，清除认证状态', error);
            authStore.clearAuth();
            return;
          }
        }

        // 触发自动登录流程
        if (authStore.user?.accountUuid) {
          console.log(`🚀 [AuthModule] 触发自动登录: ${authStore.user.accountUuid}`);

          // 导入 AppInitializationManager（避免循环依赖）
          const { AppInitializationManager } = await import(
            '../../../shared/initialization/AppInitializationManager'
          );
          await AppInitializationManager.initializeUserSession(authStore.user.accountUuid);

          console.log('✅ [AuthModule] 自动登录完成');
        }
      } else {
        console.log('ℹ️ [AuthModule] 未发现有效的认证状态');
      }
    },
    cleanup: async () => {
      console.log('🧹 [AuthModule] 清理认证状态');
      // 清理认证相关的状态
      const authStore = useAuthStore();
      authStore.clearAuth();
    },
  };

  // 2. 认证配置初始化任务
  const authConfigInitTask: InitializationTask = {
    name: 'auth-config-init',
    phase: InitializationPhase.APP_STARTUP,
    priority: 10,
    initialize: async () => {
      console.log('⚙️ [AuthModule] 初始化认证配置');
      // 初始化认证相关的配置
      // 例如：API 端点、超时设置、重试策略等
    },
  };

  // 3. 用户会话启动任务
  const userSessionStartTask: InitializationTask = {
    name: 'user-session-start',
    phase: InitializationPhase.USER_LOGIN,
    priority: 5, // 最高优先级，用户登录时首先执行
    initialize: async (context?: { accountUuid: string }) => {
      if (context?.accountUuid) {
        console.log(`👤 [AuthModule] 启动用户会话: ${context.accountUuid}`);
        // 启动用户会话相关的服务
        // 例如：心跳检测、会话保活等
      }
    },
    cleanup: async () => {
      console.log('🔚 [AuthModule] 结束用户会话');
      // 清理用户会话
    },
  };

  // 4. Token 刷新服务任务
  const tokenRefreshServiceTask: InitializationTask = {
    name: 'token-refresh-service',
    phase: InitializationPhase.USER_LOGIN,
    priority: 10,
    dependencies: ['user-session-start'], // 依赖会话启动
    initialize: async () => {
      console.log('🔄 [AuthModule] 启动 Token 刷新服务');
      // 启动 Token 自动刷新服务
    },
    cleanup: async () => {
      console.log('🛑 [AuthModule] 停止 Token 刷新服务');
      // 停止 Token 刷新服务
    },
  };

  // 注册所有任务
  manager.registerTask(authConfigInitTask);
  manager.registerTask(authStateRestoreTask);
  manager.registerTask(userSessionStartTask);
  manager.registerTask(tokenRefreshServiceTask);

  console.log('📝 [AuthModule] 所有初始化任务已注册');
}
