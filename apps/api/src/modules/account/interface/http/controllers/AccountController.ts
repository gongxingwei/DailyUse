import type { Request, Response } from 'express';
import { AccountApplicationService } from '../../../application/services/AccountApplicationService';
import { Account } from '@dailyuse/domain-server';
import {
  ok,
  badRequest,
  notFound,
  error as apiError,
  businessError,
} from '../../../../../shared/utils/apiResponse';

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
  static async createAccount(req: Request, res: Response): Promise<void> {
    try {
      const accountService = await AccountApplicationService.getInstance();
      const result = await accountService.createAccountByUsernameAndPwd(req.body);

      ok(res, result, '账户创建成功');
    } catch (error) {
      console.error('Create account error:', error);
      apiError(res, error instanceof Error ? error.message : '账户创建失败');
    }
  }

  /**
   * 根据ID获取账户
   */
  static async getAccountById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        badRequest(res, '账户ID不能为空');
        return;
      }

      const accountService = await AccountController.getAccountService();
      const result = await accountService.getAccountById(id);

      if (!result) {
        notFound(res, '账户不存在');
        return;
      }

      ok(res, result, '获取账户成功');
    } catch (error) {
      console.error('Get account by ID error:', error);
      apiError(res, error instanceof Error ? error.message : '获取账户失败');
    }
  }

  /**
   * 根据用户名获取账户
   */
  static async getAccountByUsername(req: Request, res: Response): Promise<void> {
    try {
      const { username } = req.params;

      if (!username) {
        badRequest(res, '用户名不能为空');
        return;
      }

      const accountService = await AccountController.getAccountService();
      const result = await accountService.getAccountByUsername(username);

      if (!result) {
        notFound(res, '账户不存在');
        return;
      }

      ok(res, result, '获取账户成功');
    } catch (error) {
      console.error('Get account by username error:', error);
      apiError(res, error instanceof Error ? error.message : '获取账户失败');
    }
  }

  /**
   * 更新账户
   */
  static async updateAccount(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        badRequest(res, '账户ID不能为空');
        return;
      }

      const accountService = await AccountController.getAccountService();
      const result = await accountService.updateAccount(id, req.body);

      if (!result) {
        notFound(res, '账户不存在');
        return;
      }

      ok(res, result, '账户更新成功');
    } catch (error) {
      console.error('Update account error:', error);
      apiError(res, error instanceof Error ? error.message : '账户更新失败');
    }
  }

  /**
   * 激活账户
   */
  static async activateAccount(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        badRequest(res, '账户ID不能为空');
        return;
      }

      const accountService = await AccountController.getAccountService();
      const result = await accountService.activateAccount(id);

      if (!result) {
        businessError(res, '账户不存在或激活失败', 'ACCOUNT_ACTIVATION_FAILED');
        return;
      }

      ok(res, null, '账户激活成功');
    } catch (error) {
      console.error('Activate account error:', error);
      apiError(res, error instanceof Error ? error.message : '账户激活失败');
    }
  }

  /**
   * 停用账户
   */
  static async deactivateAccount(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        badRequest(res, '账户ID不能为空');
        return;
      }

      const accountService = await AccountController.getAccountService();
      const result = await accountService.deactivateAccount(id);

      if (!result) {
        businessError(res, '账户不存在或停用失败', 'ACCOUNT_DEACTIVATION_FAILED');
        return;
      }

      ok(res, null, '账户停用成功');
    } catch (error) {
      console.error('Deactivate account error:', error);
      apiError(res, error instanceof Error ? error.message : '账户停用失败');
    }
  }

  /**
   * 暂停账户
   */
  static async suspendAccount(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        badRequest(res, '账户ID不能为空');
        return;
      }

      const accountService = await AccountController.getAccountService();
      const result = await accountService.suspendAccount(id);

      if (!result) {
        businessError(res, '账户不存在或暂停失败', 'ACCOUNT_SUSPENSION_FAILED');
        return;
      }

      ok(res, null, '账户暂停成功');
    } catch (error) {
      console.error('Suspend account error:', error);
      apiError(res, error instanceof Error ? error.message : '账户暂停失败');
    }
  }

  /**
   * 验证邮箱
   */
  static async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { token } = req.body;

      if (!id || !token) {
        badRequest(res, '账户ID和验证令牌不能为空', [
          {
            field: !id ? 'id' : 'token',
            code: 'REQUIRED_FIELD',
            message: !id ? '账户ID不能为空' : '验证令牌不能为空',
          },
        ]);
        return;
      }

      const accountService = await AccountController.getAccountService();
      const result = await accountService.verifyEmail(id, token);

      if (!result) {
        businessError(res, '邮箱验证失败，令牌无效或已过期', 'EMAIL_VERIFICATION_FAILED');
        return;
      }

      ok(res, null, '邮箱验证成功');
    } catch (error) {
      console.error('Verify email error:', error);
      apiError(res, error instanceof Error ? error.message : '邮箱验证失败');
    }
  }

  /**
   * 验证手机号
   */
  static async verifyPhone(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { code } = req.body;

      if (!id || !code) {
        badRequest(res, '账户ID和验证码不能为空', [
          {
            field: !id ? 'id' : 'code',
            code: 'REQUIRED_FIELD',
            message: !id ? '账户ID不能为空' : '验证码不能为空',
          },
        ]);
        return;
      }

      const accountService = await AccountController.getAccountService();
      const result = await accountService.verifyPhone(id, code);

      if (!result) {
        businessError(res, '手机号验证失败，验证码无效或已过期', 'PHONE_VERIFICATION_FAILED');
        return;
      }

      ok(res, null, '手机号验证成功');
    } catch (error) {
      console.error('Verify phone error:', error);
      apiError(res, error instanceof Error ? error.message : '手机号验证失败');
    }
  }

  /**
   * 获取账户列表（分页）
   */
  static async getAllAccounts(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const accountService = await AccountController.getAccountService();
      const result = await accountService.getAllAccounts(page, limit);

      ok(res, result, '获取账户列表成功');
    } catch (error) {
      console.error('Get all accounts error:', error);
      apiError(res, error instanceof Error ? error.message : '获取账户列表失败');
    }
  }

  /**
   * 搜索账户
   */
  static async searchAccounts(req: Request, res: Response): Promise<void> {
    try {
      // TODO: 实现搜索功能
      businessError(res, '搜索功能暂未实现', 'SEARCH_NOT_IMPLEMENTED');
    } catch (error) {
      console.error('Search accounts error:', error);
      apiError(res, error instanceof Error ? error.message : '搜索账户失败');
    }
  }

  /**
   * 删除账户（软删除）
   */
  static async deleteAccount(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        badRequest(res, '账户ID不能为空');
        return;
      }

      const accountService = await AccountController.getAccountService();
      const result = await accountService.deleteAccount(id);

      if (!result) {
        businessError(res, '账户不存在或删除失败', 'ACCOUNT_DELETION_FAILED');
        return;
      }

      ok(res, null, '账户删除成功');
    } catch (error) {
      console.error('Delete account error:', error);
      apiError(res, error instanceof Error ? error.message : '账户删除失败');
    }
  }
}
