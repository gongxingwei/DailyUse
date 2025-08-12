import { ref, reactive } from 'vue';
import type { SnackbarOptions } from '../types';

export function useSnackbar() {
  const snackbar = reactive<SnackbarOptions>({
    show: false,
    message: '',
    color: 'info',
    timeout: 3000,
  });

  const showSnackbar = (
    message: string,
    color: SnackbarOptions['color'] = 'info',
    timeout = 3000,
  ) => {
    snackbar.message = message;
    snackbar.color = color;
    snackbar.timeout = timeout;
    snackbar.show = true;
  };

  const showSuccess = (message: string, timeout = 3000) => {
    showSnackbar(message, 'success', timeout);
  };

  const showError = (message: string, timeout = 5000) => {
    showSnackbar(message, 'error', timeout);
  };

  const showWarning = (message: string, timeout = 4000) => {
    showSnackbar(message, 'warning', timeout);
  };

  const showInfo = (message: string, timeout = 3000) => {
    showSnackbar(message, 'info', timeout);
  };

  const hideSnackbar = () => {
    snackbar.show = false;
  };

  return {
    snackbar,
    showSnackbar,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideSnackbar,
  };
}
