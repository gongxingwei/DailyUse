import { AuthCredential } from "../domain/aggregates/authCredential";
import { Password } from "../domain/valueObjects/password";
import { IAuthCredentialRepository } from "../domain/repositories/authenticationRepository";
import { IAccountRepository } from "../../Account/domain/repositories/accountRepository";
import type { TResponse } from "../../../shared/types/response";

/**
 * 认证应用服务
 * 基于新的 DDD 架构，处理认证相关的业务逻辑
 */
export class AuthenticationApplicationService {
  private static instance: AuthenticationApplicationService;

  constructor(
    private readonly authCredentialRepository: IAuthCredentialRepository,
    private readonly accountRepository: IAccountRepository
  ) {}

  public static getInstance(
    authCredentialRepository: IAuthCredentialRepository,
    accountRepository: IAccountRepository
  ): AuthenticationApplicationService {
    if (!AuthenticationApplicationService.instance) {
      AuthenticationApplicationService.instance = new AuthenticationApplicationService(
        authCredentialRepository,
        accountRepository
      );
    }
    return AuthenticationApplicationService.instance;
  }

  /**
   * 验证用户凭证
   */
  async verifyCredentials(accountId: string, password: string): Promise<TResponse<boolean>> {
    try {
      // 查找认证凭证
      const credential = await this.authCredentialRepository.findByAccountId(accountId);
      
      if (!credential) {
        return {
          success: false,
          message: '认证凭证不存在',
          data: false
        };
      }

      // 验证密码
      const isValid = credential.verifyPassword(password);
      
      if (isValid) {
        // 更新最后认证时间
        credential.updateLastAuthTime();
        await this.authCredentialRepository.save(credential);
      }

      return {
        success: true,
        message: isValid ? '验证成功' : '密码不正确',
        data: isValid
      };

    } catch (error) {
      console.error('验证凭证失败:', error);
      return {
        success: false,
        message: '验证失败',
        data: false
      };
    }
  }

  /**
   * 修改密码
   */
  async changePassword(accountId: string, oldPassword: string, newPassword: string): Promise<TResponse> {
    try {
      // 1. 验证账号存在
      const account = await this.accountRepository.findById(accountId);
      if (!account) {
        return {
          success: false,
          message: '账号不存在',
          data: null
        };
      }

      // 2. 查找认证凭证
      const credential = await this.authCredentialRepository.findByAccountId(accountId);
      if (!credential) {
        return {
          success: false,
          message: '认证凭证不存在',
          data: null
        };
      }

      // 3. 验证旧密码
      if (!credential.verifyPassword(oldPassword)) {
        return {
          success: false,
          message: '原密码不正确',
          data: null
        };
      }

      // 4. 更新密码
      const newPasswordObj = Password.create(newPassword);
      credential.updatePassword(newPasswordObj);

      // 5. 保存更改
      await this.authCredentialRepository.save(credential);

      return {
        success: true,
        message: '密码修改成功',
        data: null
      };

    } catch (error) {
      console.error('修改密码失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '修改密码失败',
        data: null
      };
    }
  }

  /**
   * 创建认证凭证
   */
  async createCredential(accountId: string, password: string): Promise<TResponse<AuthCredential>> {
    try {
      // 检查是否已存在凭证
      const existingCredential = await this.authCredentialRepository.findByAccountId(accountId);
      if (existingCredential) {
        return {
          success: false,
          message: '认证凭证已存在',
          data: null
        };
      }

      // 创建密码对象
      const passwordObj = Password.create(password);
      
      // 创建认证凭证
      const credential = AuthCredential.create(accountId, passwordObj);

      // 保存凭证
      await this.authCredentialRepository.save(credential);

      return {
        success: true,
        message: '认证凭证创建成功',
        data: credential
      };

    } catch (error) {
      console.error('创建认证凭证失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '创建认证凭证失败',
        data: null
      };
    }
  }

  /**
   * 删除认证凭证
   */
  async deleteCredential(accountId: string): Promise<TResponse> {
    try {
      const credential = await this.authCredentialRepository.findByAccountId(accountId);
      if (!credential) {
        return {
          success: false,
          message: '认证凭证不存在',
          data: null
        };
      }

      await this.authCredentialRepository.delete(credential.id);

      return {
        success: true,
        message: '认证凭证删除成功',
        data: null
      };

    } catch (error) {
      console.error('删除认证凭证失败:', error);
      return {
        success: false,
        message: '删除认证凭证失败',
        data: null
      };
    }
  }

  /**
   * 重置密码
   */
  async resetPassword(accountId: string, newPassword: string): Promise<TResponse> {
    try {
      // 查找认证凭证
      const credential = await this.authCredentialRepository.findByAccountId(accountId);
      if (!credential) {
        return {
          success: false,
          message: '认证凭证不存在',
          data: null
        };
      }

      // 重置密码
      const newPasswordObj = Password.create(newPassword);
      credential.updatePassword(newPasswordObj);

      // 保存更改
      await this.authCredentialRepository.save(credential);

      return {
        success: true,
        message: '密码重置成功',
        data: null
      };

    } catch (error) {
      console.error('重置密码失败:', error);
      return {
        success: false,
        message: '重置密码失败',
        data: null
      };
    }
  }
}
