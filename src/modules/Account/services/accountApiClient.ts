import type { TResponse } from "@/shared/types/response";
import type { TLoginData, TRegisterData } from "../types/account";

/**
 * 渲染进程中的账号 API 客户端
 * 负责与主进程通信，调用主进程中的业务逻辑
 * 
 * 这是轻量级的客户端，只负责：
 * 1. 数据传输和序列化
 * 2. IPC 通信
 * 3. 错误处理和重试
 * 
 * 所有业务逻辑都在主进程中处理
 */
export class AccountApiClient {
  private static instance: AccountApiClient;

  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): AccountApiClient {
    if (!AccountApiClient.instance) {
      AccountApiClient.instance = new AccountApiClient();
    }
    return AccountApiClient.instance;
  }

  /**
   * 用户注册
   * @param registerData - 注册数据
   * @returns 注册结果
   */
  async register(registerData: TRegisterData): Promise<TResponse> {
    try {
      console.log('🔄 [渲染进程-API] 发送注册请求:', registerData.username);
      
      const response = await window.shared.ipcRenderer.invoke('account:register', {
        username: registerData.username,
        password: registerData.password,
        confirmPassword: registerData.confirmPassword,
        email: registerData.email
      });

      console.log(response.success ? '✅ [渲染进程-API] 注册成功' : '❌ [渲染进程-API] 注册失败:', response.message);
      return response;

    } catch (error) {
      console.error('❌ [渲染进程-API] 注册请求失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "注册请求失败",
        data: null
      };
    }
  }

  /**
   * 用户登录
   * @param loginData - 登录数据
   * @returns 登录结果
   */
  async login(loginData: TLoginData): Promise<TResponse> {
    try {
      console.log('🔄 [渲染进程-API] 发送登录请求:', loginData.username);
      
      const response = await window.shared.ipcRenderer.invoke('account:login', {
        username: loginData.username,
        password: loginData.password,
        remember: loginData.remember
      });

      console.log(response.success ? '✅ [渲染进程-API] 登录成功' : '❌ [渲染进程-API] 登录失败:', response.message);
      return response;

    } catch (error) {
      console.error('❌ [渲染进程-API] 登录请求失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "登录请求失败",
        data: null
      };
    }
  }

  /**
   * 用户登出
   * @param token - 会话令牌
   * @returns 登出结果
   */
  async logout(token: string): Promise<TResponse> {
    try {
      console.log('🔄 [渲染进程-API] 发送登出请求');
      
      const response = await window.shared.ipcRenderer.invoke('account:logout', token);

      console.log(response.success ? '✅ [渲染进程-API] 登出成功' : '❌ [渲染进程-API] 登出失败:', response.message);
      return response;

    } catch (error) {
      console.error('❌ [渲染进程-API] 登出请求失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "登出请求失败",
        data: null
      };
    }
  }

  /**
   * 验证会话
   * @param token - 会话令牌
   * @returns 验证结果
   */
  async validateSession(token: string): Promise<TResponse> {
    try {
      console.log('🔄 [渲染进程-API] 发送会话验证请求');
      
      const response = await window.shared.ipcRenderer.invoke('account:validate-session', token);

      console.log(response.success ? '✅ [渲染进程-API] 会话验证成功' : '❌ [渲染进程-API] 会话验证失败:', response.message);
      return response;

    } catch (error) {
      console.error('❌ [渲染进程-API] 会话验证请求失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "验证请求失败",
        data: null
      };
    }
  }

  /**
   * 获取所有用户
   * @returns 用户列表
   */
  async getAllUsers(): Promise<TResponse> {
    try {
      console.log('🔄 [渲染进程-API] 发送获取用户列表请求');
      
      const response = await window.shared.ipcRenderer.invoke('account:get-all-users');

      console.log(response.success ? '✅ [渲染进程-API] 获取用户列表成功' : '❌ [渲染进程-API] 获取用户列表失败:', response.message);
      return response;

    } catch (error) {
      console.error('❌ [渲染进程-API] 获取用户列表请求失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "获取请求失败",
        data: null
      };
    }
  }

  /**
   * 更新用户信息
   * @param accountId - 账号ID
   * @param updateData - 更新数据
   * @returns 更新结果
   */
  async updateUserInfo(accountId: string, updateData: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatar?: string;
  }): Promise<TResponse> {
    try {
      console.log('🔄 [渲染进程-API] 发送更新用户信息请求:', accountId);
      
      const response = await window.shared.ipcRenderer.invoke('account:update-info', {
        accountId,
        updateData
      });

      console.log(response.success ? '✅ [渲染进程-API] 更新用户信息成功' : '❌ [渲染进程-API] 更新用户信息失败:', response.message);
      return response;

    } catch (error) {
      console.error('❌ [渲染进程-API] 更新用户信息请求失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "更新请求失败",
        data: null
      };
    }
  }

  /**
   * 注销账号
   * @param accountId - 账号ID
   * @returns 注销结果
   */
  async deregisterAccount(accountId: string): Promise<TResponse> {
    try {
      console.log('🔄 [渲染进程-API] 发送注销账号请求:', accountId);
      
      const response = await window.shared.ipcRenderer.invoke('account:deregister', accountId);

      console.log(response.success ? '✅ [渲染进程-API] 注销账号成功' : '❌ [渲染进程-API] 注销账号失败:', response.message);
      return response;

    } catch (error) {
      console.error('❌ [渲染进程-API] 注销账号请求失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "注销请求失败",
        data: null
      };
    }
  }

  /**
   * 修改密码
   * @param accountId - 账号ID
   * @param oldPassword - 旧密码
   * @param newPassword - 新密码
   * @returns 修改结果
   */
  async changePassword(accountId: string, oldPassword: string, newPassword: string): Promise<TResponse> {
    try {
      console.log('🔄 [渲染进程-API] 发送修改密码请求:', accountId);
      
      const response = await window.shared.ipcRenderer.invoke('account:change-password', {
        accountId,
        oldPassword,
        newPassword
      });

      console.log(response.success ? '✅ [渲染进程-API] 修改密码成功' : '❌ [渲染进程-API] 修改密码失败:', response.message);
      return response;

    } catch (error) {
      console.error('❌ [渲染进程-API] 修改密码请求失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "修改密码请求失败",
        data: null
      };
    }
  }
}

// 导出单例实例
export const accountApiClient = AccountApiClient.getInstance();
