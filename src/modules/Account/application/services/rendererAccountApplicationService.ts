import { ref } from 'vue';
import type { TResponse } from '@/shared/types/response';
import type { User, AccountRegistrationRequest, AccountDeactivationRequest } from '../../domain/types/account';

/**
 * 渲染进程账号应用服务
 * 负责账号注册、管理和注销功能
 */
export class RendererAccountApplicationService {
  private static instance: RendererAccountApplicationService;

  // 响应式状态
  public currentUser = ref<User | null>(null);
  public isLoading = ref(false);
  public error = ref<string | null>(null);

  constructor() {
    this.initializeEventListeners();
  }

  public static getInstance(): RendererAccountApplicationService {
    if (!RendererAccountApplicationService.instance) {
      RendererAccountApplicationService.instance = new RendererAccountApplicationService();
    }
    return RendererAccountApplicationService.instance;
  }

  /**
   * 初始化事件监听器
   */
  private initializeEventListeners(): void {
    // 监听账号状态变化事件
    if (window.electronAPI?.onAccountStatusChanged) {
      window.electronAPI.onAccountStatusChanged((userData: User) => {
        this.currentUser.value = userData;
      });
    }

    // 监听账号注销完成事件
    if (window.electronAPI?.onAccountDeactivated) {
      window.electronAPI.onAccountDeactivated(() => {
        this.currentUser.value = null;
      });
    }
  }

  /**
   * 注册新账号
   */
  async registerAccount(registrationData: AccountRegistrationRequest): Promise<TResponse<User>> {
    this.isLoading.value = true;
    this.error.value = null;

    try {
      const response = await window.electronAPI.accountRegister(registrationData);
      
      if (response.success && response.data) {
        console.log('📝 [AccountService] 账号注册成功，等待认证凭证设置');
        // 注册成功后，Authentication 模块会自动弹出认证凭证设置
      } else {
        this.error.value = response.message || '注册失败';
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '注册账号时发生未知错误';
      this.error.value = errorMessage;
      console.error('📝 [AccountService] 注册账号失败:', error);
      
      return {
        success: false,
        message: errorMessage,
        data: undefined
      };
    } finally {
      this.isLoading.value = false;
    }
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<TResponse<User>> {
    try {
      const response = await window.electronAPI.accountGetCurrent();
      
      if (response.success && response.data) {
        this.currentUser.value = response.data;
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取用户信息失败';
      console.error('👤 [AccountService] 获取当前用户失败:', error);
      
      return {
        success: false,
        message: errorMessage,
        data: undefined
      };
    }
  }

  /**
   * 更新用户信息
   */
  async updateUserInfo(userData: Partial<User>): Promise<TResponse<User>> {
    this.isLoading.value = true;
    this.error.value = null;

    try {
      const response = await window.electronAPI.accountUpdate(userData);
      
      if (response.success && response.data) {
        this.currentUser.value = response.data;
      } else {
        this.error.value = response.message || '更新失败';
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新用户信息失败';
      this.error.value = errorMessage;
      console.error('📝 [AccountService] 更新用户信息失败:', error);
      
      return {
        success: false,
        message: errorMessage,
        data: undefined
      };
    } finally {
      this.isLoading.value = false;
    }
  }

  /**
   * 请求账号注销
   */
  async requestAccountDeactivation(deactivationData: AccountDeactivationRequest): Promise<TResponse> {
    this.isLoading.value = true;
    this.error.value = null;

    try {
      const response = await window.electronAPI.accountDeactivate(deactivationData);
      
      if (response.success) {
        console.log('🗑️ [AccountService] 账号注销请求已发送，等待认证确认');
        // 注销请求发送后，Authentication 模块会弹出确认对话框
      } else {
        this.error.value = response.message || '注销请求失败';
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '请求账号注销失败';
      this.error.value = errorMessage;
      console.error('🗑️ [AccountService] 请求账号注销失败:', error);
      
      return {
        success: false,
        message: errorMessage,
        data: undefined
      };
    } finally {
      this.isLoading.value = false;
    }
  }

  /**
   * 清理状态
   */
  clearState(): void {
    this.currentUser.value = null;
    this.error.value = null;
    this.isLoading.value = false;
  }

  /**
   * 验证用户名
   */
  validateUsername(username: string): { valid: boolean; message?: string } {
    if (!username) {
      return { valid: false, message: '用户名不能为空' };
    }
    
    if (username.length < 3) {
      return { valid: false, message: '用户名至少需要3个字符' };
    }
    
    if (username.length > 20) {
      return { valid: false, message: '用户名不能超过20个字符' };
    }
    
    if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
      return { valid: false, message: '用户名只能包含字母、数字、下划线和中文' };
    }

    return { valid: true };
  }

  /**
   * 验证邮箱
   */
  validateEmail(email: string): { valid: boolean; message?: string } {
    if (!email) {
      return { valid: true }; // 邮箱是可选的
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, message: '请输入有效的邮箱地址' };
    }

    return { valid: true };
  }

  /**
   * 验证手机号
   */
  validatePhone(phone: string): { valid: boolean; message?: string } {
    if (!phone) {
      return { valid: true }; // 手机号是可选的
    }
    
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return { valid: false, message: '请输入有效的手机号码' };
    }

    return { valid: true };
  }
}

// 导出单例实例
export const accountApplicationService = RendererAccountApplicationService.getInstance();
