import { ref, computed, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
//stores
import { useAuthStore } from "@/modules/Account/stores/authStore";
// services
import { localUserService } from "@/modules/Account/services/localUserService";
import { remoteUserService } from "../services/remoteUserService";
import { remoteAuthService } from "../services/remoteAuthService";
import { loginSessionService } from "../services/loginSessionService";
// types
import type { TLoginData, TRegisterData } from "../types/account";
import type { SessionUser } from "../services/loginSessionService";

/**
 * 用户认证相关的组合式函数
 * @param emit 可选的事件发射函数
 */
export function useUserAuth(emit?: {
  (e: "register-success"): void;
  (e: "remote-register-success"): void;
}) {
  // 基础配置和状态管理
  const router = useRouter();
  const authStore = useAuthStore();
  const formRef = ref(); // 表单引用，用于验证
  const loading = ref(""); // 加载状态，存储正在加载的用户名

  /** 登录表单数据 */
  const loginForm = reactive<TLoginData>({
    username: "",
    password: "",
    remember: false,
  });
  /** 注册表单数据 */
  const registerForm = reactive<TRegisterData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  /** 提示信息配置 */
  const snackbar = reactive({
    show: false, // 是否显示提示
    message: "", // 提示信息
    color: "error", // 提示颜色（error/success）
  });

  // 使用会话服务获取记住的用户列表
  const rememberedUsers = ref<SessionUser[]>([]);
  const isLoadingUsers = ref(false);

  /**
   * 获取记住密码的用户列表
   */
  const loadRememberedUsers = async () => {
    try {
      isLoadingUsers.value = true;
      const result = await loginSessionService.getRememberedUsers();
      if (result.success) {
        rememberedUsers.value = result.data || [];
      } else {
        console.error("获取记住的用户失败:", result.message);
      }
    } catch (error) {
      console.error("获取记住的用户失败:", error);
    } finally {
      isLoadingUsers.value = false;
    }
  };

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
      const response = await localUserService.login(loginForm);
      snackbar.message = response.message;
      snackbar.color = response.success ? "success" : "error";
      snackbar.show = true;

      if (response.success) {
        // 登录成功，保存用户信息
        authStore.setUser(response.data);
        // 创建或更新会话信息
        await loginSessionService.createSession({
          username: loginForm.username,
          password: loginForm.remember ? loginForm.password : undefined,
          accountType: "local",
          rememberMe: loginForm.remember,
          autoLogin: false, // 可以根据需要添加自动登录选项
        });
        // 重新加载记住的用户列表
        await loadRememberedUsers();
        router.push("/");
      }
    } catch (error) {
      console.error("登录失败:", error);
    }
  }

  async function handleLocalRegister() {
    try {
      const { valid } = await formRef.value.validate(); // v-form 的 validate 方法会返回一个对象，包含 valid 和 errors 属性
      if (!valid) {
        snackbar.message = "请填写所有必填项";
        snackbar.color = "error";
        snackbar.show = true;
        return;
      }

      const response = await localUserService.register(registerForm);

      snackbar.message = response.message || "xxx";
      snackbar.color = response.success ? "success" : "error";
      snackbar.show = true;

      if (response.success) {
        formRef.value.reset(); // 重置表单

        // 注册成功后可以选择自动创建会话
        if (registerForm.username && registerForm.password) {
          await loginSessionService.createSession({
            username: registerForm.username,
            password: registerForm.password,
            accountType: "local",
            rememberMe: false, // 默认记住新注册的用户
            autoLogin: false,
          });

          // 重新加载记住的用户列表
          await loadRememberedUsers();
        }
        emit?.("register-success");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      snackbar.message =
        error instanceof Error ? error.message : "系统错误，请稍后重试";
      snackbar.color = "error";
      snackbar.show = true;
    }
  }

  /**
   * 处理账号选择
   * 当用户从下拉列表选择账号时自动填充记住的密码
   * @param username 选中的用户名
   */
  const handleAccountSelect = async (username: string) => {
    const selectedUser = rememberedUsers.value.find(
      (user) => user.username === username
    );

    if (selectedUser) {
      loginForm.username = username;
      loginForm.remember = true;

      // 检查是否有保存的密码，如果有则可以使用快速登录
      const isRemembered = await loginSessionService.isPasswordRemembered(
        username,
        "local"
      );

      if (isRemembered) {
        // 可以显示快速登录选项
        snackbar.message = "检测到已保存的登录信息，可以使用快速登录";
        snackbar.color = "success";
        snackbar.show = true;
      }
    }
  };

  /**
   * 处理快速登录 - 使用会话服务
   * @param user 要登录的用户信息
   */
  const handleLocalQuickLogin = async (username: string) => {
    try {
      loading.value = username;

      // 使用会话服务的快速登录
      const sessionResult = await loginSessionService.quickLogin(
        username,
        "local"
      );

      if (sessionResult.success) {
        // 登录成功，保存用户信息
        authStore.setUser(sessionResult.data);
        // 重新加载记住的用户列表
        await loadRememberedUsers();
        router.push("/");
      } else {
        snackbar.message = sessionResult.message || "快速登录失败";
        snackbar.color = "error";
        snackbar.show = true;
      }
    } catch (error) {
      console.error("快速登录失败:", error);
      snackbar.message = "快速登录失败，请重试";
      snackbar.color = "error";
      snackbar.show = true;
    }
  };
  /**
   * 删除保存的账号信息
   * 同时更新后端存储和前端状态
   * @param username 要删除的用户名
   */
  const handleRemoveSavedAccount = async (username: string) => {
    try {
      const result = await loginSessionService.removeSession(username, "local");
      if (result.success) {
        // 重新加载记住的用户列表
        await loadRememberedUsers();

        snackbar.message = "删除账号信息成功";
        snackbar.color = "success";
        snackbar.show = true;
      } else {
        snackbar.message = result.message || "删除账号信息失败";
        snackbar.color = "error";
        snackbar.show = true;
      }
    } catch (error) {
      console.error("删除账号失败:", error);
      snackbar.message = "删除账号失败，请重试";
      snackbar.color = "error";
      snackbar.show = true;
    }
  };

  /**
   * 用户登出 - 使用会话服务
   * @param keepRemembered 是否保留记住的信息
   */
  const handleLocalLogout = async (keepRemembered: boolean = true) => {
    try {
      const currentUser = authStore.currentUser;
      if (currentUser) {
        // 使用会话服务登出
        const result = await loginSessionService.logout(
          currentUser.username,
          "local",
          keepRemembered
        );

        if (result.success) {
          // 清除本地用户状态
          authStore.logout();

          // 如果不保留记住的信息，重新加载用户列表
          if (!keepRemembered) {
            await loadRememberedUsers();
          }

          router.push("/login");

          snackbar.message = "退出登录成功";
          snackbar.color = "success";
          snackbar.show = true;
        } else {
          snackbar.message = result.message || "退出登录失败";
          snackbar.color = "error";
          snackbar.show = true;
        }
      }
    } catch (error) {
      console.error("退出登录失败:", error);
      snackbar.message = "退出登录失败，请重试";
      snackbar.color = "error";
      snackbar.show = true;
    }
  };

  /**
   * 检查自动登录 - 应用启动时调用
   */
  const checkAutoLogin = async () => {
    try {
      const result = await loginSessionService.getAutoLoginInfo();
      if (result.success && result.data) {
        const autoLoginInfo = result.data;

        // 尝试自动登录
        if (autoLoginInfo.hasPassword) {

        }
      }
    } catch (error) {
      console.error("检查自动登录失败:", error);
    }
  };

  /**
   * 清除所有会话数据
   */
  // const clearAllSessions = async () => {
  //   try {
  //     const result = await loginSessionService.clearAllSessions();
  //     if (result.success) {
  //       await loadRememberedUsers();

  //       snackbar.message = "清除所有会话成功";
  //       snackbar.color = "success";
  //       snackbar.show = true;
  //     } else {
  //       snackbar.message = result.message || "清除会话失败";
  //       snackbar.color = "error";
  //       snackbar.show = true;
  //     }
  //   } catch (error) {
  //     console.error("清除所有会话失败:", error);
  //   }
  // };

  /**
   * 处理远程登录
   * 验证表单、调用登录服务、保存账号信息并跳转
   */
  async function handleRemoteLogin() {
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
      const response = await remoteAuthService.login(loginForm);
      snackbar.message = response.message;
      snackbar.color = response.success ? "success" : "error";
      snackbar.show = true;

      if (response.success) {

        // 登录成功，保存用户信息
        if (!response.data) {
          throw new Error("登录成功，但未返回用户数据");
        }
        authStore.setUser(response.data.userWithoutPassword);
        await loadRememberedUsers();
        router.push("/");
      }
    } catch (error) {
      console.error("登录失败:", error);
    }
  }

  /**
   * 处理远程注册
   * 验证表单、调用注册服务、保存账号信息并跳转
   */
  async function handleRemoteRegister() {
    try {
      const { valid } = await formRef.value.validate(); // v-form 的 validate 方法会返回一个对象，包含 valid 和 errors 属性
      if (!valid) {
        snackbar.message = "请填写所有必填项";
        snackbar.color = "error";
        snackbar.show = true;
        return;
      }

      const response = await remoteUserService.register(registerForm);

      snackbar.message = response.message || "xxx";
      snackbar.color = response.success ? "success" : "error";
      snackbar.show = true;

      if (response.success) {
        formRef.value.reset(); // 重置表单
        emit?.("remote-register-success");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      snackbar.message =
        error instanceof Error ? error.message : "系统错误，请稍后重试";
      snackbar.color = "error";
      snackbar.show = true;
    }
  }

  async function handleRemoteLogout() {
    try {
      const currentUser = authStore.currentUser;
      if (currentUser) {
        // 在会话记录中更新状态
        await loginSessionService.logout(
          currentUser.username,
          "online",
          false
        );
        // 使用远程服务登出
        const result = await remoteAuthService.logout();

        if (result.success) {
          // 清除本地用户状态
          authStore.logout();

          // 重新加载记住的用户列表
          await loadRememberedUsers();

          router.push("/auth");

          snackbar.message = "退出登录成功";
          snackbar.color = "success";
          snackbar.show = true;
        } else {
          snackbar.message = result.message || "退出登录失败";
          snackbar.color = "error";
          snackbar.show = true;
        }
      }
    } catch (error) {
      console.error("退出登录失败:", error);
      snackbar.message = "退出登录失败，请重试";
      snackbar.color = "error";
      snackbar.show = true;
    }
  }

  async function handleRemoteQuickLogin(username: string, accountType: 'online' | 'local' = 'online') {
    const response = await remoteAuthService.quickLogin(username, accountType);
    try {
      if (response.success) {
        snackbar.message = "快速登录成功";
        snackbar.color = "success";
        snackbar.show = true;
        
        // 登录成功，保存用户信息
        if (!response.data) {
          throw new Error("快速登录成功，但未返回用户数据");
        }
        const user = response.data.userWithoutPassword;

        authStore.setUser(response.data.userWithoutPassword);
        await loadRememberedUsers();
        router.push("/");

      } else {
        snackbar.message = response.message || "快速登录失败";
        snackbar.color = "error";
        snackbar.show = true;
      }
    } catch (error) {
      console.error("快速登录失败:", error);
      snackbar.message = "快速登录失败，请重试";
      snackbar.color = "error";
      snackbar.show = true;
    }
    
  }
  // 初始化时加载记住的用户
  onMounted(() => {
    loadRememberedUsers();
  });
  // 返回组合式API的公共接口
  return {
    // 表单相关
    loginForm, // 登录表单数据
    registerForm, // 注册表单数据
    formRef, // 表单引用
    snackbar, // 提示信息
    loading, // 加载状态

    // 数据相关
    rememberedUsers,
    isLoadingUsers,

    // 方法相关
    handleAccountSelect, // 处理账号选择
    handleRemoveSavedAccount, // 处理账号删除
    handleLcoalLogin, // 处理本地登录
    handleLocalRegister, // 处理本地注册
    handleLocalQuickLogin, // 处理快速登录
    handleRemoteLogin, // 处理远程登录
    handleRemoteRegister, // 处理远程注册
    handleRemoteQuickLogin, // 处理远程快速登录

    handleLocalLogout, // 处理登出
    handleRemoteLogout, // 处理远程登出
    checkAutoLogin, // 检查自动登录
    loadRememberedUsers, // 加载记住的用户列表
    // clearAllSessions, // 清除所有会话数据
  };
}
