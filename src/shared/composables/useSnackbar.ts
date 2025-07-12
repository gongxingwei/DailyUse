import { ref } from "vue";

/**
 * 通知 Composable
 * 专门处理应用内的 Snackbar 通知
 */

interface SnackbarConfig {
  show: boolean;
  message: string;
  color: 'success' | 'error' | 'warning' | 'info';
  timeout: number;
}

export function useSnackbar() {
  const snackbar = ref<SnackbarConfig>({
    show: false,
    message: '',
    color: 'success',
    timeout: 4000
  });

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

  const closeSnackbar = () => {
    snackbar.value.show = false;
  };

  const showSuccess = (message: string, timeout = 4000) => {
    showSnackbar(message, 'success', timeout);
  };

  const showError = (message: string, timeout = 6000) => {
    showSnackbar(message, 'error', timeout);
  };

  const showWarning = (message: string, timeout = 5000) => {
    showSnackbar(message, 'warning', timeout);
  };

  const showInfo = (message: string, timeout = 4000) => {
    showSnackbar(message, 'info', timeout);
  };

  return {
    snackbar,
    showSnackbar,
    closeSnackbar,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
}
