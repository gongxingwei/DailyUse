import type { Request, Response } from 'express';
import { AccountApplicationService } from '../../../application/services/AccountApplicationService';
import {
  type ApiResponse,
  type SuccessResponse,
  type ErrorResponse,
  ResponseCode,
  createResponseBuilder,
  getHttpStatusCode,
} from '@dailyuse/contracts';
import { createLogger } from '@dailyuse/utils';

// 创建 logger 实例
const logger = createLogger('AccountController');

export class AccountController {
  private static responseBuilder = createResponseBuilder();

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
  static async createAccount(req: Request, res: Response): Promise<Response> {
    try {
      const accountService = await AccountApplicationService.getInstance();
      const result = await accountService.createAccountByUsernameAndPwd(req.body);

      logger.info('Account created successfully', { username: req.body.username });

      return AccountController.responseBuilder.sendSuccess(
        res,
        result,
        'Account created successfully',
        201,
      );
    } catch (error) {
      logger.error('Create account error', error);

      // 分类错误
      if (error instanceof Error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          return AccountController.responseBuilder.sendError(res, {
            code: ResponseCode.CONFLICT,
            message: error.message,
          });
        }
        if (error.message.includes('invalid') || error.message.includes('required')) {
          return AccountController.responseBuilder.sendError(res, {
            code: ResponseCode.VALIDATION_ERROR,
            message: error.message,
          });
        }
      }

      return AccountController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : '账户创建失败',
      });
    }
  }

  /**
   * 根据ID获取账户
   */
  static async getAccountById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return AccountController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: '账户ID不能为空',
        });
      }

      const accountService = await AccountController.getAccountService();
      const result = await accountService.getAccountById(id);

      if (!result) {
        return AccountController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: '账户不存在',
        });
      }

      logger.info('Account retrieved successfully', { accountId: id });
      return AccountController.responseBuilder.sendSuccess(
        res,
        result,
        'Account retrieved successfully',
      );
    } catch (error) {
      logger.error('Get account by ID error', error);
      return AccountController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : '获取账户失败',
      });
    }
  }

  /**
   * 根据用户名获取账户
   */
  static async getAccountByUsername(req: Request, res: Response): Promise<Response> {
    try {
      const { username } = req.params;

      if (!username) {
        return AccountController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: '用户名不能为空',
        });
      }

      const accountService = await AccountController.getAccountService();
      const result = await accountService.getAccountByUsername(username);

      if (!result) {
        return AccountController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: '账户不存在',
        });
      }

      logger.info('Account retrieved by username', { username });
      return AccountController.responseBuilder.sendSuccess(
        res,
        result,
        'Account retrieved successfully',
      );
    } catch (error) {
      logger.error('Get account by username error', error);
      return AccountController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : '获取账户失败',
      });
    }
  }

  /**
   * 更新账户
   */
  static async updateAccount(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return AccountController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: '账户ID不能为空',
        });
      }

      const accountService = await AccountController.getAccountService();
      const result = await accountService.updateAccount(id, req.body);

      if (!result) {
        return AccountController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: '账户不存在',
        });
      }

      logger.info('Account updated successfully', { accountId: id });
      return AccountController.responseBuilder.sendSuccess(
        res,
        result,
        'Account updated successfully',
      );
    } catch (error) {
      logger.error('Update account error', error);

      if (error instanceof Error && error.message.includes('not found')) {
        return AccountController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: error.message,
        });
      }

      return AccountController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : '账户更新失败',
      });
    }
  }

  /**
   * 激活账户
   */
  static async activateAccount(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return AccountController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: '账户ID不能为空',
        });
      }

      const accountService = await AccountController.getAccountService();
      const result = await accountService.activateAccount(id);

      if (!result) {
        return AccountController.responseBuilder.sendError(res, {
          code: ResponseCode.BUSINESS_ERROR,
          message: '账户不存在或激活失败',
        });
      }

      logger.info('Account activated successfully', { accountId: id });
      return AccountController.responseBuilder.sendSuccess(
        res,
        null,
        'Account activated successfully',
      );
    } catch (error) {
      logger.error('Activate account error', error);
      return AccountController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : '账户激活失败',
      });
    }
  }

  /**
   * 停用账户
   */
  static async deactivateAccount(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return AccountController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: '账户ID不能为空',
        });
      }

      const accountService = await AccountController.getAccountService();
      const result = await accountService.deactivateAccount(id);

      if (!result) {
        return AccountController.responseBuilder.sendError(res, {
          code: ResponseCode.BUSINESS_ERROR,
          message: '账户不存在或停用失败',
        });
      }

      logger.info('Account deactivated successfully', { accountId: id });
      return AccountController.responseBuilder.sendSuccess(
        res,
        null,
        'Account deactivated successfully',
      );
    } catch (error) {
      logger.error('Deactivate account error', error);
      return AccountController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : '账户停用失败',
      });
    }
  }

  /**
   * 暂停账户
   */
  static async suspendAccount(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return AccountController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: '账户ID不能为空',
        });
      }

      const accountService = await AccountController.getAccountService();
      const result = await accountService.suspendAccount(id);

      if (!result) {
        return AccountController.responseBuilder.sendError(res, {
          code: ResponseCode.BUSINESS_ERROR,
          message: '账户不存在或暂停失败',
        });
      }

      logger.info('Account suspended successfully', { accountId: id });
      return AccountController.responseBuilder.sendSuccess(
        res,
        null,
        'Account suspended successfully',
      );
    } catch (error) {
      logger.error('Suspend account error', error);
      return AccountController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : '账户暂停失败',
      });
    }
  }

  /**
   * 验证邮箱
   */
  static async verifyEmail(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { token } = req.body;

      if (!id || !token) {
        return AccountController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: '账户ID和验证令牌不能为空',
        });
      }

      const accountService = await AccountController.getAccountService();
      const result = await accountService.verifyEmail(id, token);

      if (!result) {
        return AccountController.responseBuilder.sendError(res, {
          code: ResponseCode.BUSINESS_ERROR,
          message: '邮箱验证失败，令牌无效或已过期',
        });
      }

      logger.info('Email verified successfully', { accountId: id });
      return AccountController.responseBuilder.sendSuccess(
        res,
        null,
        'Email verified successfully',
      );
    } catch (error) {
      logger.error('Verify email error', error);
      return AccountController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : '邮箱验证失败',
      });
    }
  }

  /**
   * 验证手机号
   */
  static async verifyPhone(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { code } = req.body;

      if (!id || !code) {
        return AccountController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: '账户ID和验证码不能为空',
        });
      }

      const accountService = await AccountController.getAccountService();
      const result = await accountService.verifyPhone(id, code);

      if (!result) {
        return AccountController.responseBuilder.sendError(res, {
          code: ResponseCode.BUSINESS_ERROR,
          message: '手机号验证失败，验证码无效或已过期',
        });
      }

      logger.info('Phone verified successfully', { accountId: id });
      return AccountController.responseBuilder.sendSuccess(
        res,
        null,
        'Phone verified successfully',
      );
    } catch (error) {
      logger.error('Verify phone error', error);
      return AccountController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : '手机号验证失败',
      });
    }
  }

  /**
   * 获取账户列表（分页）
   */
  static async getAllAccounts(req: Request, res: Response): Promise<Response> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const accountService = await AccountController.getAccountService();
      const result = await accountService.getAllAccounts(page, limit);

      logger.info('Account list retrieved', { page, limit, total: result.data.total });
      return AccountController.responseBuilder.sendSuccess(
        res,
        result,
        'Account list retrieved successfully',
      );
    } catch (error) {
      logger.error('Get all accounts error', error);
      return AccountController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : '获取账户列表失败',
      });
    }
  }

  /**
   * 搜索账户
   */
  static async searchAccounts(req: Request, res: Response): Promise<Response> {
    try {
      // TODO: 实现搜索功能
      return AccountController.responseBuilder.sendError(res, {
        code: ResponseCode.BUSINESS_ERROR,
        message: '搜索功能暂未实现',
      });
    } catch (error) {
      logger.error('Search accounts error', error);
      return AccountController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : '搜索账户失败',
      });
    }
  }

  /**
   * 删除账户（软删除）
   */
  static async deleteAccount(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return AccountController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: '账户ID不能为空',
        });
      }

      const accountService = await AccountController.getAccountService();
      const result = await accountService.deleteAccount(id);

      if (!result) {
        return AccountController.responseBuilder.sendError(res, {
          code: ResponseCode.BUSINESS_ERROR,
          message: '账户不存在或删除失败',
        });
      }

      logger.info('Account deleted successfully', { accountId: id });
      return AccountController.responseBuilder.sendSuccess(
        res,
        null,
        'Account deleted successfully',
      );
    } catch (error) {
      logger.error('Delete account error', error);
      return AccountController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : '账户删除失败',
      });
    }
  }
}
