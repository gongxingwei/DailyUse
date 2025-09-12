import { ref, computed } from 'vue';
import {
  getGlobalInitializationService,
  GlobalInitializationService,
} from '../../../../common/modules/initialization/GlobalInitializationService';

/**
 * 全局初始化 Composable
 * 提供组件级别的全局初始化功能接口
 */
export function useGlobalInitialization() {
  // 获取全局初始化服务
  const initializationService = getGlobalInitializationService();

  // 响应式状态
  const isInitializing = ref(false);
  const initializationError = ref<string | null>(null);
  const lastInitializationResults = ref<any>(null);

  // 计算属性
  const initializationStatus = computed(() => {
    return initializationService.getInitializationStatus();
  });

  const syncStatus = computed(() => {
    return initializationService.checkSyncStatus();
  });

  const isFullyInitialized = computed(() => {
    return initializationStatus.value.isInitialized && syncStatus.value.overall;
  });

  // ===== 初始化方法 =====

  /**
   * 初始化所有模块
   */
  const initializeAllModules = async () => {
    if (isInitializing.value) {
      console.log('初始化正在进行中，跳过重复调用');
      return lastInitializationResults.value;
    }

    try {
      isInitializing.value = true;
      initializationError.value = null;

      console.log('开始初始化所有模块...');
      const results = await initializationService.initializeAllModules();

      lastInitializationResults.value = results;

      if (!results.success && results.errors.length > 0) {
        initializationError.value = results.errors.join('; ');
      }

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '初始化失败';
      initializationError.value = errorMessage;
      console.error('初始化所有模块失败:', error);
      throw error;
    } finally {
      isInitializing.value = false;
    }
  };

  /**
   * 强制重新初始化
   */
  const forceReinitialize = async () => {
    try {
      isInitializing.value = true;
      initializationError.value = null;

      console.log('强制重新初始化所有模块...');
      const results = await initializationService.forceReinitialize();

      lastInitializationResults.value = results;

      if (!results.success && results.errors.length > 0) {
        initializationError.value = results.errors.join('; ');
      }

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '强制重新初始化失败';
      initializationError.value = errorMessage;
      console.error('强制重新初始化失败:', error);
      throw error;
    } finally {
      isInitializing.value = false;
    }
  };

  /**
   * 强制同步所有数据
   */
  const forceSyncAllData = async () => {
    try {
      isInitializing.value = true;
      initializationError.value = null;

      console.log('强制同步所有模块数据...');
      const results = await initializationService.forceSyncAllData();

      if (!results.success && results.errors.length > 0) {
        initializationError.value = results.errors.join('; ');
      }

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '强制同步数据失败';
      initializationError.value = errorMessage;
      console.error('强制同步数据失败:', error);
      throw error;
    } finally {
      isInitializing.value = false;
    }
  };

  /**
   * 用户登录后初始化
   */
  const initializeForUser = async () => {
    try {
      isInitializing.value = true;
      initializationError.value = null;

      console.log('用户登录后初始化...');
      const results = await initializationService.initializeForUser();

      lastInitializationResults.value = results;

      if (!results.success && results.errors.length > 0) {
        initializationError.value = results.errors.join('; ');
      }

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '用户登录后初始化失败';
      initializationError.value = errorMessage;
      console.error('用户登录后初始化失败:', error);
      throw error;
    } finally {
      isInitializing.value = false;
    }
  };

  // ===== 工具方法 =====

  /**
   * 清除错误状态
   */
  const clearError = () => {
    initializationError.value = null;
  };

  /**
   * 检查是否需要初始化
   */
  const shouldInitialize = () => {
    const status = initializationService.getInitializationStatus();
    return !status.isInitialized && !status.isInitializing;
  };

  /**
   * 获取服务实例
   */
  const getServices = () => {
    return initializationService.getServices();
  };

  /**
   * 获取初始化服务实例
   */
  const getInitializationService = () => {
    return initializationService;
  };

  /**
   * 清理资源
   */
  const cleanup = () => {
    initializationService.cleanup();
    initializationError.value = null;
    lastInitializationResults.value = null;
    isInitializing.value = false;
  };

  return {
    // 状态
    isInitializing: computed(() => isInitializing.value),
    initializationError: computed(() => initializationError.value),
    lastInitializationResults: computed(() => lastInitializationResults.value),
    initializationStatus,
    syncStatus,
    isFullyInitialized,

    // 方法
    initializeAllModules,
    forceReinitialize,
    forceSyncAllData,
    initializeForUser,

    // 工具方法
    clearError,
    shouldInitialize,
    getServices,
    getInitializationService,
    cleanup,
  };
}
