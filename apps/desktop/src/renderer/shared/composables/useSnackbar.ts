import { ref } from "vue";

/**
 * 通用 Snackbar 通知 Composable
 * 
 * 用于在应用内全局显示消息提示（如成功、错误、警告、信息）。
 * 
 * 典型用法：在页面或组件中调用 showSuccess/showError/showWarning/showInfo 显示通知。
 * 
 * @returns 提供 snackbar 状态和一组操作方法
 * @example
 * ```ts
 * const { showSuccess, showError, snackbar } = useSnackbar();
 * showSuccess('保存成功');
 * showError('操作失败');
 * ```
 */
export function useSnackbar() {
  /**
   * Snackbar 配置对象
   * @property show 是否显示
   * @property message 显示的消息内容
   * @property color 通知类型（决定样式）
   * @property timeout 显示时长（毫秒）
   * 
   * @example
   * {
   *   show: true,
   *   message: '操作成功',
   *   color: 'success',
   *   timeout: 4000
   * }
   */
  interface SnackbarConfig {
    show: boolean;
    message: string;
    color: 'success' | 'error' | 'warning' | 'info';
    timeout: number;
  }

  // 响应式 snackbar 状态
  const snackbar = ref<SnackbarConfig>({
    show: false,
    message: '',
    color: 'success',
    timeout: 4000
  });

  /**
   * 显示 Snackbar 通知
   * @param message 消息内容
   * @param color 通知类型（success|error|warning|info），默认 success
   * @param timeout 显示时长（毫秒），默认 4000
   * @example
   * showSnackbar('已保存', 'success', 3000);
   */
  const showSnackbar = (
    message: string, 
    color: SnackbarConfig['color'] = 'success',
    timeout: number = 4000
  ) => {
    snackbar.value = {
      show: true,
      message,
      color,
      timeout
    };
  };

  /**
   * 关闭 Snackbar 通知
   * @example
   * closeSnackbar();
   */
  const closeSnackbar = () => {
    snackbar.value.show = false;
  };

  /**
   * 显示成功类型通知
   * @param message 消息内容
   * @param timeout 显示时长（毫秒），默认 4000
   * @example
   * showSuccess('操作成功');
   */
  const showSuccess = (message: string, timeout = 4000) => {
    showSnackbar(message, 'success', timeout);
  };

  /**
   * 显示错误类型通知
   * @param message 消息内容
   * @param timeout 显示时长（毫秒），默认 6000
   * @example
   * showError('操作失败');
   */
  const showError = (message: string, timeout = 6000) => {
    showSnackbar(message, 'error', timeout);
  };

  /**
   * 显示警告类型通知
   * @param message 消息内容
   * @param timeout 显示时长（毫秒），默认 5000
   * @example
   * showWarning('请检查输入');
   */
  const showWarning = (message: string, timeout = 5000) => {
    showSnackbar(message, 'warning', timeout);
  };

  /**
   * 显示信息类型通知
   * @param message 消息内容
   * @param timeout 显示时长（毫秒），默认 4000
   * @example
   * showInfo('已同步');
   */
  const showInfo = (message: string, timeout = 4000) => {
    showSnackbar(message, 'info', timeout);
  };

  return {
    snackbar,        // 响应式状态对象，适合 v-model 绑定到 UI
    showSnackbar,    // 通用显示方法
    closeSnackbar,   // 关闭方法
    showSuccess,     // 显示成功通知
    showError,       // 显示错误通知
    showWarning,     // 显示警告通知
    showInfo         // 显示信息通知
  };
}
