/**
 * 全局初始化服务使用示例
 * 展示如何在不同场景下使用全局初始化服务
 */

import { useGlobalInitialization } from '@/composables/useGlobalInitialization';

/**
 * 示例 1：在 Vue 组件中使用
 */
export function useInitializationExample() {
  const {
    initializeAllModules,
    forceSyncAllData,
    isInitializing,
    initializationError,
    isFullyInitialized,
    syncStatus,
    clearError,
  } = useGlobalInitialization();

  // 在组件挂载时检查并初始化
  const checkAndInitialize = async () => {
    if (!isFullyInitialized.value) {
      console.log('检测到未初始化，开始初始化...');
      await initializeAllModules();
    }
  };

  // 强制刷新所有数据
  const refreshAllData = async () => {
    console.log('强制刷新所有模块数据...');
    await forceSyncAllData();
  };

  // 检查各模块同步状态
  const checkSyncStatus = () => {
    const status = syncStatus.value;
    console.log('同步状态:', {
      Goal: status.goal ? '✓' : '✗',
      Task: status.task ? '✓' : '✗',
      Repository: status.repository ? '✓' : '✗',
      Editor: status.editor ? '✓' : '✗',
      Overall: status.overall ? '全部同步' : '需要同步',
    });
    return status;
  };

  return {
    checkAndInitialize,
    refreshAllData,
    checkSyncStatus,
    isInitializing,
    initializationError,
    isFullyInitialized,
    syncStatus,
    clearError,
  };
}

/**
 * 示例 2：在路由守卫中使用
 */
export async function routerGuardExample(to: any, from: any, next: any) {
  const { isFullyInitialized, initializeAllModules } = useGlobalInitialization();

  // 如果用户已登录但数据未初始化，先进行初始化
  if (to.meta.requiresAuth && !isFullyInitialized.value) {
    console.log('路由守卫：检测到需要初始化');
    try {
      await initializeAllModules();
      next();
    } catch (error) {
      console.error('路由守卫：初始化失败', error);
      // 即使初始化失败也允许继续，避免阻塞用户
      next();
    }
  } else {
    next();
  }
}

/**
 * 示例 3：在 Pinia action 中使用
 */
export function storeActionExample() {
  return {
    async ensureDataLoaded() {
      const { isFullyInitialized, initializeAllModules } = useGlobalInitialization();

      if (!isFullyInitialized.value) {
        console.log('Store action：数据未加载，开始初始化...');
        const result = await initializeAllModules();

        if (result.success) {
          console.log('Store action：初始化成功');
          return true;
        } else {
          console.warn('Store action：初始化部分失败', result.errors);
          return false;
        }
      }

      return true;
    },
  };
}

/**
 * 示例 4：应用启动时的预加载
 */
export async function appStartupExample() {
  console.log('应用启动：开始预加载检查...');

  const { shouldInitialize, initializeAllModules, getServices } = useGlobalInitialization();

  // 检查是否需要初始化
  if (shouldInitialize()) {
    console.log('应用启动：需要初始化，开始后台预加载...');

    // 后台异步初始化，不阻塞应用启动
    initializeAllModules()
      .then((result) => {
        if (result.success) {
          console.log('应用启动：后台初始化完成');
        } else {
          console.warn('应用启动：后台初始化部分失败', result.errors);
        }
      })
      .catch((error) => {
        console.error('应用启动：后台初始化失败', error);
      });
  } else {
    console.log('应用启动：数据已就绪，跳过初始化');
  }

  // 获取各模块的服务实例进行其他操作
  const services = getServices();
  console.log('应用启动：服务实例已准备就绪', {
    goal: !!services.goal,
    task: !!services.task,
    repository: !!services.repository,
    editor: !!services.editor,
  });
}

/**
 * 示例 5：错误处理和重试机制
 */
export function errorHandlingExample() {
  const { forceReinitialize, initializationError, clearError } = useGlobalInitialization();

  const handleInitializationError = async (maxRetries = 3) => {
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        clearError();
        console.log(`错误处理：第 ${retryCount + 1} 次初始化尝试...`);

        const result = await forceReinitialize();

        if (result.success) {
          console.log('错误处理：初始化成功');
          return true;
        } else {
          throw new Error(`初始化失败: ${result.errors.join(', ')}`);
        }
      } catch (error) {
        retryCount++;
        console.error(`错误处理：第 ${retryCount} 次尝试失败:`, error);

        if (retryCount >= maxRetries) {
          console.error('错误处理：达到最大重试次数，初始化失败');
          return false;
        }

        // 等待一段时间后重试
        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
      }
    }

    return false;
  };

  return {
    handleInitializationError,
    initializationError,
  };
}

/**
 * 示例 6：性能监控
 */
export function performanceMonitoringExample() {
  const { initializeAllModules } = useGlobalInitialization();

  const monitoredInitialize = async () => {
    const startTime = performance.now();

    console.log('性能监控：开始初始化...');

    try {
      const result = await initializeAllModules();
      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`性能监控：初始化完成，耗时 ${duration.toFixed(2)}ms`);
      console.log('性能监控：初始化结果', {
        success: result.success,
        moduleCount: Object.keys(result.results).length,
        errorCount: result.errors.length,
        results: result.results,
      });

      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      console.error(`性能监控：初始化失败，耗时 ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  };

  return {
    monitoredInitialize,
  };
}
