import { ref, computed, onMounted, onUnmounted } from 'vue';
import { UserSession, SessionStatus } from '../domain/types';

/**
 * 会话管理 Composable
 * 提供会话相关的响应式状态和操作方法
 */
export function useSessionManagement() {
  // 响应式状态
  const currentSession = ref<UserSession | null>(null);
  const activeSessions = ref<UserSession[]>([]);
  const isSessionValid = ref<boolean>(false);
  const isAutoLoginEnabled = ref<boolean>(false);
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  // 获取 IPC 渲染器
  const ipcRenderer = window.shared?.ipcRenderer;

  // 计算属性
  const isLoggedIn = computed(() => {
    return currentSession.value?.status === SessionStatus.ACTIVE;
  });

  const sessionInfo = computed(() => {
    if (!currentSession.value) return null;
    
    return {
      username: currentSession.value.username,
      accountType: currentSession.value.accountType,
      rememberMe: currentSession.value.rememberMe,
      autoLogin: currentSession.value.autoLogin,
      createdAt: currentSession.value.createdAt,
      lastAccessAt: currentSession.value.lastAccessAt,
      expiresAt: currentSession.value.expiresAt
    };
  });

  const hasMultipleSessions = computed(() => {
    return activeSessions.value.length > 1;
  });

  // 事件监听器
  const sessionStatusChangedListener = (_event: any, session: UserSession) => {
    currentSession.value = session;
    checkSessionValidity();
  };

  const sessionExpiredListener = (_event: any, sessionId: string) => {
    console.log('会话过期:', sessionId);
    
    // 如果过期的是当前会话，清空状态
    if (currentSession.value?.id === sessionId) {
      currentSession.value = null;
      isSessionValid.value = false;
    }
    
    // 从活动会话列表中移除
    activeSessions.value = activeSessions.value.filter(s => s.uuid !== sessionId);
    
    // 可以在这里添加用户通知逻辑
    error.value = '会话已过期，请重新登录';
  };

  const sessionRefreshedListener = (_event: any, session: UserSession) => {
    console.log('会话已刷新:', session);
    
    // 更新当前会话
    if (currentSession.value?.id === session.uuid) {
      currentSession.value = session;
    }
    
    // 更新活动会话列表中的对应项
    const index = activeSessions.value.findIndex(s => s.uuid === session.uuid);
    if (index !== -1) {
      activeSessions.value[index] = session;
    }
  };

  const autoLoginStateChangedListener = (_event: any, enabled: boolean) => {
    isAutoLoginEnabled.value = enabled;
  };

  // 获取当前会话
  const getCurrentSession = async (): Promise<void> => {
    if (!ipcRenderer) return;
    
    try {
      isLoading.value = true;
      error.value = null;
      
      const result = await ipcRenderer.invoke('session:get-current');
      
      if (result.success && result.data) {
        currentSession.value = result.data;
        checkSessionValidity();
      } else {
        currentSession.value = null;
        isSessionValid.value = false;
        error.value = result.message || '获取会话失败';
      }
    } catch (err) {
      console.error('获取当前会话失败:', err);
      error.value = '获取会话失败';
    } finally {
      isLoading.value = false;
    }
  };

  // 验证会话
  const validateSession = async (token: string): Promise<boolean> => {
    if (!ipcRenderer) return false;
    
    try {
      const result = await ipcRenderer.invoke('session:validate', token);
      
      if (result.success && result.data) {
        currentSession.value = result.data;
        isSessionValid.value = true;
        return true;
      } else {
        isSessionValid.value = false;
        error.value = result.message || '会话验证失败';
        return false;
      }
    } catch (err) {
      console.error('验证会话失败:', err);
      error.value = '验证会话失败';
      return false;
    }
  };

  // 刷新会话
  const refreshSession = async (refreshToken?: string): Promise<boolean> => {
    if (!ipcRenderer) return false;
    
    try {
      isLoading.value = true;
      error.value = null;
      
      const tokenToUse = refreshToken || currentSession.value?.refreshToken;
      if (!tokenToUse) {
        error.value = '没有可用的刷新令牌';
        return false;
      }
      
      const result = await ipcRenderer.invoke('session:refresh', tokenToUse);
      
      if (result.success && result.data) {
        currentSession.value = result.data;
        isSessionValid.value = true;
        return true;
      } else {
        error.value = result.message || '刷新会话失败';
        return false;
      }
    } catch (err) {
      console.error('刷新会话失败:', err);
      error.value = '刷新会话失败';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // 销毁会话（登出）
  const destroySession = async (token?: string): Promise<boolean> => {
    if (!ipcRenderer) return false;
    
    try {
      isLoading.value = true;
      error.value = null;
      
      const result = await ipcRenderer.invoke('session:destroy', token);
      
      if (result.success) {
        currentSession.value = null;
        isSessionValid.value = false;
        return true;
      } else {
        error.value = result.message || '登出失败';
        return false;
      }
    } catch (err) {
      console.error('销毁会话失败:', err);
      error.value = '登出失败';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // 销毁所有会话
  const destroyAllSessions = async (): Promise<boolean> => {
    if (!ipcRenderer) return false;
    
    try {
      isLoading.value = true;
      error.value = null;
      
      const result = await ipcRenderer.invoke('session:destroy-all');
      
      if (result.success) {
        currentSession.value = null;
        activeSessions.value = [];
        isSessionValid.value = false;
        return true;
      } else {
        error.value = result.message || '销毁所有会话失败';
        return false;
      }
    } catch (err) {
      console.error('销毁所有会话失败:', err);
      error.value = '销毁所有会话失败';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // 获取活动会话列表
  const getActiveSessions = async (): Promise<void> => {
    if (!ipcRenderer) return;
    
    try {
      isLoading.value = true;
      error.value = null;
      
      const result = await ipcRenderer.invoke('session:get-active-sessions');
      
      if (result.success && result.data) {
        activeSessions.value = result.data;
      } else {
        activeSessions.value = [];
        error.value = result.message || '获取活动会话失败';
      }
    } catch (err) {
      console.error('获取活动会话失败:', err);
      error.value = '获取活动会话失败';
    } finally {
      isLoading.value = false;
    }
  };

  // 检查会话有效性
  const checkSessionValidity = async (): Promise<void> => {
    if (!currentSession.value || !ipcRenderer) {
      isSessionValid.value = false;
      return;
    }
    
    try {
      const result = await ipcRenderer.invoke('session:has-active');
      isSessionValid.value = result;
    } catch (err) {
      console.error('检查会话有效性失败:', err);
      isSessionValid.value = false;
    }
  };

  // 获取自动登录状态
  const getAutoLoginState = async (): Promise<void> => {
    if (!ipcRenderer) return;
    
    try {
      const enabled = await ipcRenderer.invoke('session:get-auto-login-state');
      isAutoLoginEnabled.value = enabled;
    } catch (err) {
      console.error('获取自动登录状态失败:', err);
      isAutoLoginEnabled.value = false;
    }
  };

  // 设置自动登录状态
  const setAutoLoginState = async (enabled: boolean): Promise<boolean> => {
    if (!ipcRenderer) return false;
    
    try {
      isLoading.value = true;
      error.value = null;
      
      const result = await ipcRenderer.invoke('session:set-auto-login-state', enabled);
      
      if (result.success) {
        isAutoLoginEnabled.value = enabled;
        return true;
      } else {
        error.value = result.message || '设置自动登录状态失败';
        return false;
      }
    } catch (err) {
      console.error('设置自动登录状态失败:', err);
      error.value = '设置自动登录状态失败';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // 清理过期会话
  const cleanupExpiredSessions = async (): Promise<boolean> => {
    if (!ipcRenderer) return false;
    
    try {
      const result = await ipcRenderer.invoke('session:cleanup-expired');
      
      if (result.success) {
        // 重新获取活动会话列表
        await getActiveSessions();
        return true;
      } else {
        error.value = result.message || '清理过期会话失败';
        return false;
      }
    } catch (err) {
      console.error('清理过期会话失败:', err);
      error.value = '清理过期会话失败';
      return false;
    }
  };

  // 清除错误
  const clearError = (): void => {
    error.value = null;
  };

  // 生命周期钩子
  onMounted(() => {
    if (!ipcRenderer) return;
    
    // 添加事件监听器
    ipcRenderer.on('session:status-changed', sessionStatusChangedListener);
    ipcRenderer.on('session:expired', sessionExpiredListener);
    ipcRenderer.on('session:refreshed', sessionRefreshedListener);
    ipcRenderer.on('session:auto-login-state-changed', autoLoginStateChangedListener);
    
    // 初始化获取当前会话和自动登录状态
    getCurrentSession();
    getAutoLoginState();
  });

  onUnmounted(() => {
    if (!ipcRenderer) return;
    
    // 移除事件监听器
    ipcRenderer.off('session:status-changed', sessionStatusChangedListener);
    ipcRenderer.off('session:expired', sessionExpiredListener);
    ipcRenderer.off('session:refreshed', sessionRefreshedListener);
    ipcRenderer.off('session:auto-login-state-changed', autoLoginStateChangedListener);
  });

  return {
    // 响应式状态
    currentSession,
    activeSessions,
    isSessionValid,
    isAutoLoginEnabled,
    isLoading,
    error,
    
    // 计算属性
    isLoggedIn,
    sessionInfo,
    hasMultipleSessions,
    
    // 方法
    getCurrentSession,
    validateSession,
    refreshSession,
    destroySession,
    destroyAllSessions,
    getActiveSessions,
    checkSessionValidity,
    getAutoLoginState,
    setAutoLoginState,
    cleanupExpiredSessions,
    clearError
  };
}
import type { TResponse } from '@/shared/types/response';

/**
 * 会话管理 Composable
 * 提供会话相关的响应式状态和操作方法
 */
export function useSessionManagement() {
  // 响应式状态
  const currentSession = ref<UserSession | null>(null);
  const activeSessions = ref<UserSession[]>([]);
  const isSessionValid = ref<boolean>(false);
  const isAutoLoginEnabled = ref<boolean>(false);
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  // 计算属性
  const isLoggedIn = computed(() => {
    return currentSession.value?.status === SessionStatus.ACTIVE;
  });

  const sessionInfo = computed(() => {
    if (!currentSession.value) return null;
    
    return {
      username: currentSession.value.username,
      accountType: currentSession.value.accountType,
      rememberMe: currentSession.value.rememberMe,
      autoLogin: currentSession.value.autoLogin,
      createdAt: currentSession.value.createdAt,
      lastAccessAt: currentSession.value.lastAccessAt,
      expiresAt: currentSession.value.expiresAt
    };
  });

  const hasMultipleSessions = computed(() => {
    return activeSessions.value.length > 1;
  });

  // 事件监听器
  const sessionStatusChangedListener = (event: Event, session: UserSession) => {
    currentSession.value = session;
    checkSessionValidity();
  };

  const sessionExpiredListener = (event: Event, sessionId: string) => {
    console.log('会话过期:', sessionId);
    
    // 如果过期的是当前会话，清空状态
    if (currentSession.value?.id === sessionId) {
      currentSession.value = null;
      isSessionValid.value = false;
    }
    
    // 从活动会话列表中移除
    activeSessions.value = activeSessions.value.filter(s => s.uuid !== sessionId);
    
    // 可以在这里添加用户通知逻辑
    error.value = '会话已过期，请重新登录';
  };

  const sessionRefreshedListener = (event: Event, session: UserSession) => {
    console.log('会话已刷新:', session);
    
    // 更新当前会话
    if (currentSession.value?.id === session.uuid) {
      currentSession.value = session;
    }
    
    // 更新活动会话列表中的对应项
    const index = activeSessions.value.findIndex(s => s.uuid === session.uuid);
    if (index !== -1) {
      activeSessions.value[index] = session;
    }
  };

  const autoLoginStateChangedListener = (event: Event, enabled: boolean) => {
    isAutoLoginEnabled.value = enabled;
  };

  // 获取当前会话
  const getCurrentSession = async (): Promise<void> => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const result = await rendererSessionManagementApplicationService.getCurrentSession();
      
      if (result.success && result.data) {
        currentSession.value = result.data;
        checkSessionValidity();
      } else {
        currentSession.value = null;
        isSessionValid.value = false;
        error.value = result.message || '获取会话失败';
      }
    } catch (err) {
      console.error('获取当前会话失败:', err);
      error.value = '获取会话失败';
    } finally {
      isLoading.value = false;
    }
  };

  // 验证会话
  const validateSession = async (token: string): Promise<boolean> => {
    try {
      const result = await rendererSessionManagementApplicationService.validateSession(token);
      
      if (result.success && result.data) {
        currentSession.value = result.data;
        isSessionValid.value = true;
        return true;
      } else {
        isSessionValid.value = false;
        error.value = result.message || '会话验证失败';
        return false;
      }
    } catch (err) {
      console.error('验证会话失败:', err);
      error.value = '验证会话失败';
      return false;
    }
  };

  // 刷新会话
  const refreshSession = async (refreshToken?: string): Promise<boolean> => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const tokenToUse = refreshToken || currentSession.value?.refreshToken;
      if (!tokenToUse) {
        error.value = '没有可用的刷新令牌';
        return false;
      }
      
      const result = await rendererSessionManagementApplicationService.refreshSession(tokenToUse);
      
      if (result.success && result.data) {
        currentSession.value = result.data;
        isSessionValid.value = true;
        return true;
      } else {
        error.value = result.message || '刷新会话失败';
        return false;
      }
    } catch (err) {
      console.error('刷新会话失败:', err);
      error.value = '刷新会话失败';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // 销毁会话（登出）
  const destroySession = async (token?: string): Promise<boolean> => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const result = await rendererSessionManagementApplicationService.destroySession(token);
      
      if (result.success) {
        currentSession.value = null;
        isSessionValid.value = false;
        return true;
      } else {
        error.value = result.message || '登出失败';
        return false;
      }
    } catch (err) {
      console.error('销毁会话失败:', err);
      error.value = '登出失败';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // 销毁所有会话
  const destroyAllSessions = async (): Promise<boolean> => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const result = await rendererSessionManagementApplicationService.destroyAllSessions();
      
      if (result.success) {
        currentSession.value = null;
        activeSessions.value = [];
        isSessionValid.value = false;
        return true;
      } else {
        error.value = result.message || '销毁所有会话失败';
        return false;
      }
    } catch (err) {
      console.error('销毁所有会话失败:', err);
      error.value = '销毁所有会话失败';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // 获取活动会话列表
  const getActiveSessions = async (): Promise<void> => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const result = await rendererSessionManagementApplicationService.getUserActiveSessions();
      
      if (result.success && result.data) {
        activeSessions.value = result.data;
      } else {
        activeSessions.value = [];
        error.value = result.message || '获取活动会话失败';
      }
    } catch (err) {
      console.error('获取活动会话失败:', err);
      error.value = '获取活动会话失败';
    } finally {
      isLoading.value = false;
    }
  };

  // 检查会话有效性
  const checkSessionValidity = async (): Promise<void> => {
    if (!currentSession.value) {
      isSessionValid.value = false;
      return;
    }
    
    const hasActive = await rendererSessionManagementApplicationService.hasActiveSession();
    isSessionValid.value = hasActive;
  };

  // 获取自动登录状态
  const getAutoLoginState = async (): Promise<void> => {
    try {
      const enabled = await rendererSessionManagementApplicationService.getAutoLoginState();
      isAutoLoginEnabled.value = enabled;
    } catch (err) {
      console.error('获取自动登录状态失败:', err);
      isAutoLoginEnabled.value = false;
    }
  };

  // 设置自动登录状态
  const setAutoLoginState = async (enabled: boolean): Promise<boolean> => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const result = await rendererSessionManagementApplicationService.setAutoLoginState(enabled);
      
      if (result.success) {
        isAutoLoginEnabled.value = enabled;
        return true;
      } else {
        error.value = result.message || '设置自动登录状态失败';
        return false;
      }
    } catch (err) {
      console.error('设置自动登录状态失败:', err);
      error.value = '设置自动登录状态失败';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // 清理过期会话
  const cleanupExpiredSessions = async (): Promise<boolean> => {
    try {
      const result = await rendererSessionManagementApplicationService.cleanupExpiredSessions();
      
      if (result.success) {
        // 重新获取活动会话列表
        await getActiveSessions();
        return true;
      } else {
        error.value = result.message || '清理过期会话失败';
        return false;
      }
    } catch (err) {
      console.error('清理过期会话失败:', err);
      error.value = '清理过期会话失败';
      return false;
    }
  };

  // 清除错误
  const clearError = (): void => {
    error.value = null;
  };

  // 生命周期钩子
  onMounted(() => {
    // 添加事件监听器
    window.addEventListener('session-status-changed', sessionStatusChangedListener);
    window.addEventListener('session-expired', sessionExpiredListener);
    window.addEventListener('session-refreshed', sessionRefreshedListener);
    window.addEventListener('auto-login-state-changed', autoLoginStateChangedListener);
    
    // 初始化获取当前会话和自动登录状态
    getCurrentSession();
    getAutoLoginState();
  });

  onUnmounted(() => {
    // 移除事件监听器
    window.removeEventListener('session-status-changed', sessionStatusChangedListener);
    window.removeEventListener('session-expired', sessionExpiredListener);
    window.removeEventListener('session-refreshed', sessionRefreshedListener);
    window.removeEventListener('auto-login-state-changed', autoLoginStateChangedListener);
  });

  return {
    // 响应式状态
    currentSession,
    activeSessions,
    isSessionValid,
    isAutoLoginEnabled,
    isLoading,
    error,
    
    // 计算属性
    isLoggedIn,
    sessionInfo,
    hasMultipleSessions,
    
    // 方法
    getCurrentSession,
    validateSession,
    refreshSession,
    destroySession,
    destroyAllSessions,
    getActiveSessions,
    checkSessionValidity,
    getAutoLoginState,
    setAutoLoginState,
    cleanupExpiredSessions,
    clearError
  };
}
