import type { Request, Response } from 'express';
import { AccountApplicationService } from '../../../application/services/AccountApplicationService';
import { Account } from '@dailyuse/domain-server';

// 定义响应类型
type TResponse<T = any> = {
  success: boolean;
  message: string;
  data?: T;
};

export class AccountController {
  /**
   * 获取账户应用服务实例
   * @returns Promise<AccountApplicationService>
   */
  private static async getAccountService(): Promise<AccountApplicationService> {
    return await AccountApplicationService.getInstance();
  }

  /**
   * 创建账户
   */
  static async createAccount(req: Request, res: Response<TResponse>): Promise<void> {
    try {
      const accountService = await AccountApplicationService.getInstance();
      const result = await accountService.createAccountByUsernameAndPwd(req.body);

      res.status(201).json({
        success: true,
        message: '账户创建成功',
        data: result,
      });
    } catch (error) {
      console.error('Create account error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '账户创建失败',
      });
    }
  }

  /**
   * 根据ID获取账户
   */
  static async getAccountById(req: Request, res: Response<TResponse>): Promise<void> {
    try {
      const { id } = req.params;
      const accountService = await AccountController.getAccountService();
      const result = await accountService.getAccountById(id);

      if (!result) {
        res.status(404).json({
          success: false,
          message: '账户不存在',
        });
        return;
      }

      res.json({
        success: true,
        message: '获取账户成功',
        data: result,
      });
    } catch (error) {
      console.error('Get account by ID error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '获取账户失败',
      });
    }
  }

  /**
   * 根据用户名获取账户
   */
  static async getAccountByUsername(req: Request, res: Response<TResponse>): Promise<void> {
    try {
      const { username } = req.params;
      const accountService = await AccountController.getAccountService();
      const result = await accountService.getAccountByUsername(username);

      if (!result) {
        res.status(404).json({
          success: false,
          message: '账户不存在',
        });
        return;
      }

      res.json({
        success: true,
        message: '获取账户成功',
        data: result,
      });
    } catch (error) {
      console.error('Get account by username error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '获取账户失败',
      });
    }
  }

  /**
   * 更新账户
   */
  static async updateAccount(req: Request, res: Response<TResponse>): Promise<void> {
    try {
      const { id } = req.params;
      const accountService = await AccountController.getAccountService();
      const result = await accountService.updateAccount(id, req.body);

      if (!result) {
        res.status(404).json({
          success: false,
          message: '账户不存在',
        });
        return;
      }

      res.json({
        success: true,
        message: '账户更新成功',
        data: result,
      });
    } catch (error) {
      console.error('Update account error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '账户更新失败',
      });
    }
  }

  /**
   * 激活账户
   */
  static async activateAccount(req: Request, res: Response<TResponse>): Promise<void> {
    try {
      const { id } = req.params;
      const accountService = await AccountController.getAccountService();
      const result = await accountService.activateAccount(id);

      if (!result) {
        res.status(404).json({
          success: false,
          message: '账户不存在或激活失败',
        });
        return;
      }

      res.json({
        success: true,
        message: '账户激活成功',
      });
    } catch (error) {
      console.error('Activate account error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '账户激活失败',
      });
    }
  }

  /**
   * 停用账户
   */
  static async deactivateAccount(req: Request, res: Response<TResponse>): Promise<void> {
    try {
      const { id } = req.params;
      const accountService = await AccountController.getAccountService();
      const result = await accountService.deactivateAccount(id);

      if (!result) {
        res.status(404).json({
          success: false,
          message: '账户不存在或停用失败',
        });
        return;
      }

      res.json({
        success: true,
        message: '账户停用成功',
      });
    } catch (error) {
      console.error('Deactivate account error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '账户停用失败',
      });
    }
  }

  /**
   * 暂停账户
   */
  static async suspendAccount(req: Request, res: Response<TResponse>): Promise<void> {
    try {
      const { id } = req.params;
      const accountService = await AccountController.getAccountService();
      const result = await accountService.suspendAccount(id);

      if (!result) {
        res.status(404).json({
          success: false,
          message: '账户不存在或暂停失败',
        });
        return;
      }

      res.json({
        success: true,
        message: '账户暂停成功',
      });
    } catch (error) {
      console.error('Suspend account error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '账户暂停失败',
      });
    }
  }

  /**
   * 验证邮箱
   */
  static async verifyEmail(req: Request, res: Response<TResponse>): Promise<void> {
    try {
      const { id } = req.params;
      const { token } = req.body;

      const accountService = await AccountController.getAccountService();
      const result = await accountService.verifyEmail(id, token);

      if (!result) {
        res.status(400).json({
          success: false,
          message: '邮箱验证失败，令牌无效或已过期',
        });
        return;
      }

      res.json({
        success: true,
        message: '邮箱验证成功',
      });
    } catch (error) {
      console.error('Verify email error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '邮箱验证失败',
      });
    }
  }

  /**
   * 验证手机号
   */
  static async verifyPhone(req: Request, res: Response<TResponse>): Promise<void> {
    try {
      const { id } = req.params;
      const { code } = req.body;

      const accountService = await AccountController.getAccountService();
      const result = await accountService.verifyPhone(id, code);

      if (!result) {
        res.status(400).json({
          success: false,
          message: '手机号验证失败，验证码无效或已过期',
        });
        return;
      }

      res.json({
        success: true,
        message: '手机号验证成功',
      });
    } catch (error) {
      console.error('Verify phone error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '手机号验证失败',
      });
    }
  }

  /**
   * 获取账户列表（分页）
   */
  static async getAllAccounts(req: Request, res: Response<TResponse>): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const accountService = await AccountController.getAccountService();
      const result = await accountService.getAllAccounts(page, limit);

      res.json({
        success: true,
        message: '获取账户列表成功',
        data: result,
      });
    } catch (error) {
      console.error('Get all accounts error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '获取账户列表失败',
      });
    }
  }

  /**
   * 搜索账户
   */
  static async searchAccounts(req: Request, res: Response<TResponse>): Promise<void> {
    try {
      res.status(501).json({
        success: false,
        message: '搜索功能暂未实现',
      });
    } catch (error) {
      console.error('Search accounts error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '搜索账户失败',
      });
    }
  }

  /**
   * 删除账户（软删除）
   */
  static async deleteAccount(req: Request, res: Response<TResponse>): Promise<void> {
    try {
      const { id } = req.params;
      const accountService = await AccountController.getAccountService();
      const result = await accountService.deleteAccount(id);

      if (!result) {
        res.status(404).json({
          success: false,
          message: '账户不存在或删除失败',
        });
        return;
      }

      res.json({
        success: true,
        message: '账户删除成功',
      });
    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '账户删除失败',
      });
    }
  }
}
