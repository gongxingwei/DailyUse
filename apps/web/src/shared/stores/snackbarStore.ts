import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface SnackbarConfig {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  timeout?: number;
  action?: {
    text: string;
    handler: () => void;
  };
  persistent?: boolean;
}

export const useSnackbarStore = defineStore('snackbar', () => {
  // 状态
  const isVisible = ref(false);
  const message = ref('');
  const type = ref<'success' | 'error' | 'warning' | 'info'>('info');
  const timeout = ref(4000);
  const action = ref<SnackbarConfig['action']>();
  const persistent = ref(false);

  // 显示 Snackbar
  const show = (config: SnackbarConfig) => {
    message.value = config.message;
    type.value = config.type || 'info';
    timeout.value = config.timeout || 4000;
    action.value = config.action;
    persistent.value = config.persistent || false;
    isVisible.value = true;
  };

  // 隐藏 Snackbar
  const hide = () => {
    isVisible.value = false;
    // 清理状态
    setTimeout(() => {
      message.value = '';
      action.value = undefined;
      persistent.value = false;
    }, 300); // 等待动画完成
  };

  // 便捷方法
  const showSuccess = (message: string, timeout?: number) => {
    show({ message, type: 'success', timeout });
  };

  const showError = (message: string, timeout?: number) => {
    show({ message, type: 'error', timeout: timeout || 6000 });
  };

  const showWarning = (message: string, timeout?: number) => {
    show({ message, type: 'warning', timeout });
  };

  const showInfo = (message: string, timeout?: number) => {
    show({ message, type: 'info', timeout });
  };

  return {
    // 状态
    isVisible,
    message,
    type,
    timeout,
    action,
    persistent,

    // 方法
    show,
    hide,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
});
