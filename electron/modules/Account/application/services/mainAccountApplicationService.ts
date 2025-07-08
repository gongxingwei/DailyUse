import { IAccountRepository } from "../../domain/repositories/accountRepository";
import { Account } from "../../domain/aggregates/account";
import type { TResponse } from "@/shared/types/response";
import { RegisterData } from "../../domain/types/account";

/**
 * 主进程中的账号应用服务
 * 专注于账号身份信息管理，不包含认证功能
 * 认证功能已迁移到 Authentication 模块
 */
export class MainAccountApplicationService {
  private static instance: MainAccountApplicationService;
  
  constructor(
    private accountRepository: IAccountRepository
  ) {}

  public static getInstance(
    accountRepository: IAccountRepository
  ): MainAccountApplicationService {
    if (!MainAccountApplicationService.instance) {
      MainAccountApplicationService.instance = new MainAccountApplicationService(
        accountRepository
      );
    }
    return MainAccountApplicationService.instance;
  }

  /**
   * 注册账号（仅创建身份信息，密码在 Authentication 模块处理）
   */
  async register(_registerData: RegisterData): Promise<TResponse<Account>> {
    console.log('⚠️ [主进程-注册] 注册功能需要与 Authentication 模块集成');
    
    // TODO: 实现纯身份信息的账号创建
    return {
      success: false,
      message: '注册功能正在重构中，需要与 Authentication 模块集成',
      data: undefined
    };
  }

  /**
   * 获取所有账号
   */
  async getAllUsers(): Promise<TResponse<Account[]>> {
    try {
      console.log('🔄 [主进程-查询] 开始获取用户列表');
      
      const accounts = await this.accountRepository.findAll();
      
      console.log('✅ [主进程-查询] 获取用户列表完成');
      
      return {
        success: true,
        message: '获取成功',
        data: accounts
      };

    } catch (error) {
      console.error('❌ [主进程-查询] 获取用户列表失败:', error);
      return {
        success: false,
        message: '获取失败',
        data: undefined
      };
    }
  }

  /**
   * 根据ID获取账号
   */
  async getAccountById(accountId: string): Promise<TResponse<Account>> {
    try {
      const account = await this.accountRepository.findById(accountId);
      
      if (!account) {
        return {
          success: false,
          message: '账号不存在',
          data: undefined
        };
      }

      return {
        success: true,
        message: '获取成功',
        data: account
      };

    } catch (error) {
      console.error('❌ [主进程-查询] 获取账号失败:', error);
      return {
        success: false,
        message: '获取账号失败',
        data: undefined
      };
    }
  }

  /**
   * 根据用户名获取账号
   */
  async getAccountByUsername(username: string): Promise<TResponse<Account>> {
    try {
      const account = await this.accountRepository.findByUsername(username);
      
      if (!account) {
        return {
          success: false,
          message: '账号不存在',
          data: undefined
        };
      }

      return {
        success: true,
        message: '获取成功',
        data: account
      };

    } catch (error) {
      console.error('❌ [主进程-查询] 获取账号失败:', error);
      return {
        success: false,
        message: '获取账号失败',
        data: undefined
      };
    }
  }

  /**
   * 更新账号信息
   */
  async updateAccountInfo(
    accountId: string,
    updateData: {
      email?: string;
      phone?: string;
      firstName?: string;
      lastName?: string;
      bio?: string;
      avatar?: string;
    }
  ): Promise<TResponse<Account>> {
    try {
      console.log('🔄 [主进程-更新] 开始更新账号信息流程');
      
      const account = await this.accountRepository.findById(accountId);
      if (!account) {
        return {
          success: false,
          message: '账号不存在',
          data: undefined
        };
      }

      if (updateData.email) {
        account.updateEmail(updateData.email);
      }
      
      if (updateData.phone) {
        account.updatePhone(updateData.phone);
      }

      // TODO: 更新用户实体信息 (firstName, lastName, bio, avatar)

      await this.accountRepository.save(account);

      console.log('✅ [主进程-更新] 账号信息更新成功');

      return {
        success: true,
        message: '账号信息更新成功',
        data: account
      };

    } catch (error) {
      console.error('❌ [主进程-更新] 更新账号信息失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '更新账号信息失败',
        data: undefined
      };
    }
  }

  /**
   * 禁用账号
   */
  async disableAccount(accountId: string): Promise<TResponse> {
    try {
      const account = await this.accountRepository.findById(accountId);
      if (!account) {
        return {
          success: false,
          message: '账号不存在',
          data: undefined
        };
      }

      account.disable();
      await this.accountRepository.save(account);

      // TODO: 发布 AccountDisabledEvent 领域事件
      // 通知 Authentication 模块终止相关会话

      return {
        success: true,
        message: '账号禁用成功',
        data: undefined
      };
    } catch (error) {
      console.error('❌ [主进程-禁用] 禁用账号失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '禁用账号失败',
        data: undefined
      };
    }
  }

  /**
   * 启用账号
   */
  async enableAccount(accountId: string): Promise<TResponse> {
    try {
      const account = await this.accountRepository.findById(accountId);
      if (!account) {
        return {
          success: false,
          message: '账号不存在',
          data: undefined
        };
      }

      account.enable();
      await this.accountRepository.save(account);

      return {
        success: true,
        message: '账号启用成功',
        data: undefined
      };
    } catch (error) {
      console.error('❌ [主进程-启用] 启用账号失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '启用账号失败',
        data: undefined
      };
    }
  }

  /**
   * 验证邮箱
   */
  async verifyEmail(accountId: string): Promise<TResponse> {
    try {
      const account = await this.accountRepository.findById(accountId);
      if (!account) {
        return {
          success: false,
          message: '账号不存在',
          data: undefined
        };
      }

      account.verifyEmail();
      await this.accountRepository.save(account);

      return {
        success: true,
        message: '邮箱验证成功',
        data: undefined
      };

    } catch (error) {
      console.error('❌ [主进程-验证] 邮箱验证失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '邮箱验证失败',
        data: undefined
      };
    }
  }

  /**
   * 验证手机号
   */
  async verifyPhone(accountId: string): Promise<TResponse> {
    try {
      const account = await this.accountRepository.findById(accountId);
      if (!account) {
        return {
          success: false,
          message: '账号不存在',
          data: undefined
        };
      }

      account.verifyPhone();
      await this.accountRepository.save(account);

      return {
        success: true,
        message: '手机号验证成功',
        data: undefined
      };

    } catch (error) {
      console.error('❌ [主进程-验证] 手机号验证失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '手机号验证失败',
        data: undefined
      };
    }
  }
}
