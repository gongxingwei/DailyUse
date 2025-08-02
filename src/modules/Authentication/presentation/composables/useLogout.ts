import { authenticationService } from "../../application/services/authenticationService";
import { useSnackbar } from "@/shared/composables/useSnackbar";

/**
 * useLogout
 * 
 * 该组合式函数封装了用户注销（登出）相关的业务操作，
 * 并统一处理消息提示（snackbar），为表现层提供简洁的调用接口。
 * 
 * 主要职责：
 * - 调用 authenticationService 完成注销操作
 * - 统一处理操作结果和异常
 * - 通过 snackbar 反馈操作结果
 */
export function useLogout() {
  // 获取全局 snackbar 相关方法
  const { snackbar, showError, showSuccess } = useSnackbar();

  /**
   * 注销（登出）操作
   */
  const handleLogout = async () => {
    try {
      const result = await authenticationService.logout();
      console.log("注销结果：", result);
      if (result.success) {
        showSuccess("注销成功");
      } else {
        showError(`注销失败：${result.message}`);
      }
      return result;
    } catch (error) {
      showError("注销异常，请稍后重试");
      console.error("Logout error:", error);
      return {
        success: false,
        message: "注销异常，请稍后重试",
        data: undefined,
      };
    }
  };

  // 导出注销操作和 snackbar
  return {
    snackbar,
    handleLogout,
  };
}