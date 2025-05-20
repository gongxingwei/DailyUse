import { ref, reactive, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import type { IUser } from "../types/auth";
// services
import { userDataService } from "../services/userDataService";
import { localAuthService } from "../services/localAuthService";

export function useAccountManagement() {
  const router = useRouter();
  const authStore = useAuthStore();

  // 状态
  const user = ref<IUser | null>(null);
  const loading = ref(false);
  const exporting = ref(false);
  const importing = ref(false);
  const clearing = ref(false);
  const switching = ref(false);
  const loggingOut = ref(false);
  const currentUser = computed(() => authStore.currentUser);
  // 表单数据
  const profileForm = reactive({
    username: "",
    email: "",
  });

  // 弹窗配置
  const snackbar = reactive({
    show: false,
    message: "",
    color: "error",
  });

  // 对话框配置
  const dialog = reactive({
    show: false,
    title: "",
    message: "",
    confirmColor: "primary",
    onConfirm: () => {},
  });

  // 初始化用户数据
  const initUserData = () => {
    user.value = authStore.currentUser;
    if (user.value) {
      profileForm.username = user.value.username;
      profileForm.email = user.value.email;
    }
  };

  // 导出用户数据
  const exportUserData = async () => {
    try {
      exporting.value = true;
      if (!user.value) {
        throw new Error("用户未登录或信息不完整");
      }
      const result = userDataService.exportUserData(user.value.id);
      if (result) {
        console.log("导出成功:", result);
      }
    } catch (error) {
      console.error("导出失败:", error);
    } finally {
      exporting.value = false;
    }
  };

  // 导入用户数据
  const importUserData = async () => {
    try {
      importing.value = true;
      if (!user.value) {
        throw new Error("用户未登录或信息不完整");
      }
      const result = await userDataService.importUserData(user.value.id);
      if (result) {
        console.log("导入成功:");
      }
    } catch (error) {
      console.error("导入失败:", error);
    } finally {
      importing.value = false;
    }
  };

  // 确认清除数据
  const confirmClearData = () => {
    dialog.title = "清除所有数据";
    dialog.message = "此操作将清除所有用户数据，且不可恢复。是否继续？";
    dialog.confirmColor = "error";
    dialog.onConfirm = clearUserData;
    dialog.show = true;
  };

  // 清除用户数据
  const clearUserData = async () => {
    try {
      clearing.value = true;
      if (!user.value) {
        throw new Error("用户未登录或信息不完整");
      }
      const result = await userDataService.clearUserData(user.value.id);
      if (result) {
        console.log("清除成功:", result);
      }
    } catch (error) {
      console.error("清除失败:", error);
    } finally {
      clearing.value = false;
      dialog.show = false;
    }
  };

  // 切换账号
  const switchAccount = () => {
    authStore.logout();
    router.push({ path: "/auth" });

  };

  // 确认退出登录
  const confirmLogout = () => {
    dialog.title = "退出登录";
    dialog.message = "确定要退出登录吗？";
    dialog.confirmColor = "error";
    dialog.onConfirm = handleLogout;
    dialog.show = true;
  };

  // 处理退出登录
  const handleLogout = async () => {
    try {
      // 当前用户未登录或信息不完整
      if (!currentUser.value) {
        snackbar.message = "用户未登录或信息不完整";
        snackbar.color = "error";
        snackbar.show = true;
        return;
      }
      // 调用登出服务
      const response = await localAuthService.logout(currentUser.value?.id);
      // 显示弹窗
      snackbar.message = response.message;
      snackbar.color = response.success ? "success" : "error";
      snackbar.show = true;

      if (response.success) {
        // 重定向到登录页面
        authStore.logout();
        router.push({ path: "/auth" });
      }
      loggingOut.value = true;
    } catch (error) {
      console.error("退出登录失败:", error);
    } finally {
      loggingOut.value = false;
      dialog.show = false;
    }
  };

  return {
    user,
    loading,
    exporting,
    importing,
    clearing,
    switching,
    loggingOut,
    profileForm,
    dialog,
    snackbar,
    initUserData,
    exportUserData,
    importUserData,
    confirmClearData,
    clearUserData,
    switchAccount,
    confirmLogout,
    handleLogout,
  };
}
