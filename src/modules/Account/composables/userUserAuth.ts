import { ref, computed, reactive } from "vue";
import { useRouter } from "vue-router";
//stores
import { useAuthStore } from "@/modules/Account/stores/authStore";
// services
import { authService } from "@/modules/Account/services/authService";
import { sharedDataService } from "../services/sharedDataService";
// types
import type { ILoginForm } from "../types/auth";
import { storeToRefs } from "pinia";

/**
 * 用户认证相关的组合式函数
 * 处理用户登录、快速登录、账号管理等功能
 */
export function useUserAuth() {
  /** 保存的账号信息数据结构 */
  type SavedAccount = {
    username: string; // 用户名
    password?: string; // 可选密码
    avatar?: string; // 可选头像
    remember: boolean; // 是否记住账号
    lastLoginTime: string; // 最后登录时间
    token?: string; // 可选的登录token
  };

  // 基础配置和状态管理
  const router = useRouter();
  const authStore = useAuthStore();
  const formRef = ref(); // 表单引用，用于验证
  const loading = ref(""); // 加载状态，存储正在加载的用户名

  /** 登录表单数据 */
  const loginForm = reactive<ILoginForm>({
    username: "",
    password: "",
    remember: false,
  });

  /** 提示信息配置 */
  const snackbar = reactive({
    show: false, // 是否显示提示
    message: "", // 提示信息
    color: "error", // 提示颜色（error/success）
  });

  // 状态管理相关
  const { savedAccounts } = storeToRefs(authStore); // 所有保存的账号
  const rememberedAccounts = computed(() => authStore.rememberedAccounts); // 已记住的账号列表

  /**
   * 处理本地登录
   * 验证表单、调用登录服务、保存账号信息并跳转
   */
  async function handleLcoalLogin() {
    try {
      // 表单验证
      const { valid } = await formRef.value.validate();
      if (!valid) {
        snackbar.message = "请正确填写所有必填项";
        snackbar.color = "error";
        snackbar.show = true;
        return;
      }

      // 调用登录服务
      const response = await authService.login(loginForm);
      snackbar.message = response.message;
      snackbar.color = response.success ? "success" : "error";
      snackbar.show = true;

      if (response.success) {
        // 登录成功，保存用户信息
        authStore.setUser(response.data);
        // 保存账号信息
        updateSavedAccount(
          loginForm.username,
          loginForm.remember,
          response.token
        );
        // 跳转到首页
        router.push("/");

      }
    } catch (error) {
      console.error("登录失败:", error);
    }
  }
  /**
   * 处理账号选择
   * 当用户从下拉列表选择账号时自动填充记住的密码
   * @param username 选中的用户名
   */
  const handleAccountSelect = (username: string) => {
    const selectedAccount = savedAccounts.value.find(
      (acc) => acc.username === username
    );
    if (selectedAccount && selectedAccount.remember) {
      loginForm.password = selectedAccount.password || "";
      loginForm.remember = true;
    }
  };
  /**
   * 删除保存的账号信息
   * 同时更新后端存储和前端状态
   * @param username 要删除的用户名
   */
  const handleRemoveSavedAccount = async (username: string) => {
    try {
      const response = await sharedDataService.removeSavedAccountInfo(username);
      if (response.success) {
        // 删除本地数据
        authStore.removeSavedAccount(username);
      } else {
        snackbar.message = "删除账号信息失败";
        snackbar.color = "error";
      }
    } catch (error) {
      console.error("清除已选择的账号失败:", error);
    }
  };
  /**
   * 更新或添加账号信息
   * 处理账号信息的保存、更新和排序
   * @param username 用户名
   * @param remember 是否记住账号
   * @param token 可选的登录token
   * @returns 后端响应结果
   */
  const updateSavedAccount = async (
    username: string,
    remember: boolean,
    token?: string
  ) => {
    try {
      const newAccountInfo: SavedAccount = {
        username: username,
        remember: remember,
        lastLoginTime: new Date().toISOString(),
        token: token,
      };

      // 检查账号是否已存在
      const existingAccount = savedAccounts.value.find(
        (acc) => acc.username === username
      );

      let response;
      if (existingAccount) {
        // 更新现有账号信息
        response = await sharedDataService.updateSavedAccountInfo(
          username,
          newAccountInfo
        );
      } else {
        // 添加新账号信息
        response = await sharedDataService.addSavedAccountInfo(
          username,
          newAccountInfo
        );
      }

      if (response.success) {
        // 更新本地数据
        if (existingAccount) {
          const index = savedAccounts.value.findIndex(
            (acc) => acc.username === username
          );
          savedAccounts.value[index] = newAccountInfo;
        } else {
          savedAccounts.value.push(newAccountInfo);
        }
        // 按最后登录时间排序
        savedAccounts.value.sort(
          (a, b) =>
            new Date(b.lastLoginTime).getTime() -
            new Date(a.lastLoginTime).getTime()
        );
      } else {
        console.error("保存账号信息失败");
      }

      return response;
    } catch (error) {
      console.error("更新账号信息失败:", error);
      throw error;
    }
  };
  /**
   * 处理快速登录
   * 使用保存的token进行快速登录，失败时自动清除账号信息
   * @param account 要登录的账号信息
   */
  const handleLocalQuickLogin = async (account: SavedAccount) => {
    try {
      loading.value = account.username;
      // 使用 token 进行登录
      if (!account.token) {
        throw new Error("登录信息已失效，请使用密码登录");
      }

      const response = await authService.loginWithToken(
        account.username,
        account.token
      );

      if (response.success) {
        authStore.setUser(response.data);
        // 更新账号信息
        if (account.username !== response.data.username) {
          throw new Error("请求的用户与返回的用户不匹配");
        }
        await updateSavedAccount(
          account.username,
          account.remember,
          response.token // 用新的token更新保存的账号信息
        );
        // 跳转到首页
        router.push("/");
      } else {
        snackbar.message = response.message || "登录失败";
        snackbar.color = "error";
        snackbar.show = true;
      }
    } catch (error) {
      console.error("快速登录失败:", error);
      snackbar.message =
        error instanceof Error ? error.message : "快速登录失败";
      snackbar.color = "error";
      snackbar.show = true;
      // 清除失效的账号信息
      await handleRemoveSavedAccount(account.username);
    } finally {
      loading.value = "";
    }
  };
  // 返回组合式API的公共接口
  return {
    // 表单相关
    loginForm, // 登录表单数据
    formRef, // 表单引用
    snackbar, // 提示信息
    loading, // 加载状态

    // 数据相关
    savedAccounts, // 所有保存的账号
    rememberedAccounts, // 已记住的账号

    // 方法相关
    handleAccountSelect, // 处理账号选择
    handleRemoveSavedAccount, // 处理账号删除
    handleLcoalLogin, // 处理本地登录
    handleLocalQuickLogin, // 处理快速登录
    updateSavedAccount, // 更新账号信息
  };
}
