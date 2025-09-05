/**
 * 账户管理相关API服务
 */

import { api } from '../instances';
import type { RequestOptions, PaginatedData, UploadOptions } from '../core/types';
import type {
  FrontendAccountInfo,
  FrontendCreateAccountRequest,
  FrontendUpdateAccountRequest,
  FrontendAccountQueryParams,
  EmailVerifyRequest,
  PhoneVerifyRequest,
} from '@dailyuse/contracts';

// 重新导出常用类型
export type AccountInfo = FrontendAccountInfo;
export type CreateAccountRequest = FrontendCreateAccountRequest;
export type UpdateAccountRequest = FrontendUpdateAccountRequest;
export type AccountQueryParams = FrontendAccountQueryParams;
export type { EmailVerifyRequest, PhoneVerifyRequest };

/**
 * 账户管理API服务
 */
export class AccountService {
  /**
   * 创建账户
   */
  static async createAccount(
    data: CreateAccountRequest,
    options?: RequestOptions,
  ): Promise<AccountInfo> {
    return api.post('/accounts', data, options);
  }

  /**
   * 根据ID获取账户
   */
  static async getAccountById(id: string, options?: RequestOptions): Promise<AccountInfo> {
    return api.get(`/accounts/${id}`, options);
  }

  /**
   * 根据用户名获取账户
   */
  static async getAccountByUsername(
    username: string,
    options?: RequestOptions,
  ): Promise<AccountInfo> {
    return api.get(`/accounts/username/${username}`, options);
  }

  /**
   * 更新账户信息
   */
  static async updateAccount(
    id: string,
    data: UpdateAccountRequest,
    options?: RequestOptions,
  ): Promise<AccountInfo> {
    return api.put(`/accounts/${id}`, data, options);
  }

  /**
   * 激活账户
   */
  static async activateAccount(id: string, options?: RequestOptions): Promise<void> {
    return api.post(`/accounts/${id}/activate`, {}, options);
  }

  /**
   * 停用账户
   */
  static async deactivateAccount(id: string, options?: RequestOptions): Promise<void> {
    return api.post(`/accounts/${id}/deactivate`, {}, options);
  }

  /**
   * 暂停账户
   */
  static async suspendAccount(id: string, options?: RequestOptions): Promise<void> {
    return api.post(`/accounts/${id}/suspend`, {}, options);
  }

  /**
   * 验证邮箱
   */
  static async verifyEmail(
    id: string,
    data: EmailVerifyRequest,
    options?: RequestOptions,
  ): Promise<void> {
    return api.post(`/accounts/${id}/verify-email`, data, options);
  }

  /**
   * 验证手机号
   */
  static async verifyPhone(
    id: string,
    data: PhoneVerifyRequest,
    options?: RequestOptions,
  ): Promise<void> {
    return api.post(`/accounts/${id}/verify-phone`, data, options);
  }

  /**
   * 获取账户列表（分页）
   */
  static async getAccounts(
    params?: Partial<AccountQueryParams>,
    options?: RequestOptions,
  ): Promise<PaginatedData<AccountInfo>> {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    const url = queryString ? `/accounts?${queryString}` : '/accounts';
    return api.get(url, options);
  }

  /**
   * 搜索账户
   */
  static async searchAccounts(keyword: string, options?: RequestOptions): Promise<AccountInfo[]> {
    return api.get(`/accounts/search?q=${encodeURIComponent(keyword)}`, options);
  }

  /**
   * 删除账户（软删除）
   */
  static async deleteAccount(id: string, options?: RequestOptions): Promise<void> {
    return api.delete(`/accounts/${id}`, options);
  }

  /**
   * 上传头像
   */
  static async uploadAvatar(
    id: string,
    file: File,
    options?: UploadOptions,
  ): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('avatar', file);

    return api.upload(`/accounts/${id}/avatar`, formData, {
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
      ...options,
    });
  }
}
