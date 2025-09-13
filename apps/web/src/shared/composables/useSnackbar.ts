import { useSnackbarStore, type SnackbarConfig } from '../stores/snackbarStore';

/**
 * Snackbar 全局提示系统 Composable
 * 符合 DailyUse 项目架构设计：
 * - 基于 Pinia Store 的状态管理
 * - 提供简洁的 API 接口
 * - 支持多种提示类型和自定义配置
 * - 与 GoalWebApplicationService 等应用服务无缝集成
 */
export function useSnackbar() {
  const snackbarStore = useSnackbarStore();

  /**
   * 显示通用提示
   */
  const showSnackbar = (config: SnackbarConfig) => {
    snackbarStore.show(config);
  };

  /**
   * 显示成功提示
   */
  const showSuccess = (message: string, timeout?: number) => {
    snackbarStore.showSuccess(message, timeout);
  };

  /**
   * 显示错误提示
   */
  const showError = (message: string, timeout?: number) => {
    snackbarStore.showError(message, timeout);
  };

  /**
   * 显示警告提示
   */
  const showWarning = (message: string, timeout?: number) => {
    snackbarStore.showWarning(message, timeout);
  };

  /**
   * 显示信息提示
   */
  const showInfo = (message: string, timeout?: number) => {
    snackbarStore.showInfo(message, timeout);
  };

  /**
   * 显示带操作按钮的提示
   */
  const showWithAction = (
    message: string,
    actionText: string,
    actionHandler: () => void,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
  ) => {
    snackbarStore.show({
      message,
      type,
      action: {
        text: actionText,
        handler: actionHandler,
      },
    });
  };

  /**
   * 显示持久化提示（需要手动关闭）
   */
  const showPersistent = (
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
  ) => {
    snackbarStore.show({
      message,
      type,
      persistent: true,
    });
  };

  /**
   * 隐藏提示
   */
  const hideSnackbar = () => {
    snackbarStore.hide();
  };

  /**
   * 操作结果反馈快捷方法
   * 自动处理 Promise 的成功和失败状态
   */
  const handleOperationResult = <T>(
    promise: Promise<T>,
    successMessage: string,
    errorMessage?: string,
  ): Promise<T> => {
    return promise
      .then((result) => {
        showSuccess(successMessage);
        return result;
      })
      .catch((error) => {
        const errorMsg = errorMessage || error.message || '操作失败';
        showError(errorMsg);
        throw error;
      });
  };

  /**
   * 批量操作结果反馈
   */
  const handleBatchOperationResult = (
    results: Array<{ success: boolean; message?: string }>,
    operation: string,
  ) => {
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;

    if (failCount === 0) {
      showSuccess(`${operation}完成：成功 ${successCount} 项`);
    } else if (successCount === 0) {
      showError(`${operation}失败：失败 ${failCount} 项`);
    } else {
      showWarning(`${operation}部分完成：成功 ${successCount} 项，失败 ${failCount} 项`);
    }
  };

  return {
    // 基础方法
    showSnackbar,
    hideSnackbar,

    // 类型方法
    showSuccess,
    showError,
    showWarning,
    showInfo,

    // 高级方法
    showWithAction,
    showPersistent,
    handleOperationResult,
    handleBatchOperationResult,

    // 状态（只读）
    isVisible: snackbarStore.isVisible,

    // 兼容旧 API
    snackbar: {
      show: snackbarStore.isVisible,
      message: snackbarStore.message,
      color: snackbarStore.type,
      timeout: snackbarStore.timeout,
    },
    closeSnackbar: hideSnackbar,
  };
}
