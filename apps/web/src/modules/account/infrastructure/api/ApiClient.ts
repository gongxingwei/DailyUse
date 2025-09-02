import axios, { type AxiosInstance } from 'axios';
// 使用修正后的axios配置实例
import { publicApiClient } from '../../../../shared/http/instances';
import type {
  CreateAccountDto,
  UpdateAccountDto,
  AccountResponseDto,
} from '../../application/dtos/UserDtos';
import type { Account } from '@dailyuse/domain-client';
import type { TResponse } from '../../../../shared/types/response';
import { type RegistrationRequestDTO, type RegistrationResponseDTO } from '../../../../tempTypes';
/**
 * 用户API客户端
 * 负责与后端API的通信
 */
export class ApiClient {
  private client: AxiosInstance;

  constructor() {
    // 使用配置好的api实例，包含正确的 baseURL 和拦截器
    this.client = publicApiClient;
  }

  async testConnection(): Promise<string> {
    try {
      const response = await this.client.get('health');
      console.log('[API Client]API connection test successful:', response.data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  async register(accountData: RegistrationRequestDTO): Promise<TResponse<RegistrationResponseDTO>> {
    try {
      const response = await this.client.post('/accounts', accountData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // /**
  //  * 获取当前用户信息
  //  */
  // async getCurrentUser(): Promise<UserResponseDto> {
  //   const response = await this.client.get('/users/me');
  //   return response.data;
  // }

  // /**
  //  * 根据ID获取用户
  //  */
  // async getUserById(userId: string): Promise<UserResponseDto> {
  //   const response = await this.client.get(`/users/${userId}`);
  //   return response.data;
  // }

  // /**
  //  * 根据用户名获取用户
  //  */
  // async getUserByUsername(username: string): Promise<UserResponseDto> {
  //   const response = await this.client.get(`/users/username/${username}`);
  //   return response.data;
  // }

  // /**
  //  * 根据邮箱获取用户
  //  */
  // async getUserByEmail(email: string): Promise<UserResponseDto> {
  //   const response = await this.client.get(`/users/email/${encodeURIComponent(email)}`);
  //   return response.data;
  // }

  // /**
  //  * 更新用户资料
  //  */
  // async updateUserProfile(
  //   userId: string,
  //   profileData: UpdateUserProfileDto,
  // ): Promise<UserResponseDto> {
  //   const response = await this.client.put(`/users/${userId}/profile`, profileData);
  //   return response.data;
  // }

  // /**
  //  * 上传用户头像
  //  */
  // async uploadAvatar(userId: string, file: File): Promise<{ avatarUrl: string }> {
  //   const formData = new FormData();
  //   formData.append('avatar', file);

  //   const response = await this.client.post(`/users/${userId}/avatar`, formData, {
  //     headers: {
  //       'Content-Type': 'multipart/form-data',
  //     },
  //   });

  //   return response.data;
  // }

  // /**
  //  * 更新用户头像URL
  //  */
  // async updateAvatarUrl(userId: string, avatarUrl: string): Promise<UserResponseDto> {
  //   const response = await this.client.patch(`/users/${userId}/avatar`, { avatarUrl });
  //   return response.data;
  // }

  // /**
  //  * 停用用户
  //  */
  // async deactivateUser(userId: string): Promise<{ success: boolean; message: string }> {
  //   const response = await this.client.patch(`/users/${userId}/deactivate`);
  //   return response.data;
  // }

  // /**
  //  * 激活用户
  //  */
  // async activateUser(userId: string): Promise<{ success: boolean; message: string }> {
  //   const response = await this.client.patch(`/users/${userId}/activate`);
  //   return response.data;
  // }

  // /**
  //  * 检查用户名可用性
  //  */
  // async checkUsernameAvailability(username: string): Promise<{ available: boolean }> {
  //   const response = await this.client.get(`/users/check-username/${username}`);
  //   return response.data;
  // }

  // /**
  //  * 检查邮箱是否已被使用
  //  */
  // async checkEmailAvailability(email: string): Promise<{ available: boolean }> {
  //   const response = await this.client.get(`/users/check-email/${encodeURIComponent(email)}`);
  //   return response.data;
  // }

  // /**
  //  * 修改密码
  //  */
  // async changePassword(
  //   userId: string,
  //   data: {
  //     currentPassword: string;
  //     newPassword: string;
  //   },
  // ): Promise<{ success: boolean; message: string }> {
  //   const response = await this.client.post(`/users/${userId}/change-password`, data);
  //   return response.data;
  // }

  // /**
  //  * 获取用户统计信息
  //  */
  // async getUserStats(): Promise<{
  //   totalUsers: number;
  //   activeUsers: number;
  //   newUsersToday: number;
  //   profileCompletionRate: number;
  // }> {
  //   const response = await this.client.get('/users/stats');
  //   return response.data;
  // }

  // /**
  //  * 搜索用户
  //  */
  // async searchUsers(params: {
  //   query?: string;
  //   status?: string;
  //   page?: number;
  //   limit?: number;
  // }): Promise<{
  //   users: UserResponseDto[];
  //   total: number;
  //   page: number;
  //   limit: number;
  //   hasMore: boolean;
  // }> {
  //   const response = await this.client.get('/users/search', { params });
  //   return response.data;
  // }
}
