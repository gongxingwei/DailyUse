import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { RepositoryApplicationService } from '../../../application/services/RepositoryApplicationService';
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
const logger = createLogger('RepositoryController');

export class RepositoryController {
  private static repositoryService: RepositoryApplicationService | null = null;
  private static responseBuilder = createResponseBuilder();

  /**
   * 获取应用服务实例（懒加载）
   */
  private static async getRepositoryService(): Promise<RepositoryApplicationService> {
    if (!RepositoryController.repositoryService) {
      RepositoryController.repositoryService = await RepositoryApplicationService.getInstance();
    }
    return RepositoryController.repositoryService;
  }

  /**
   * 从请求中提取用户账户UUID
   */
  private static extractAccountUuid(req: Request): string {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      logger.warn('Authentication attempt without Bearer token');
      throw new Error('Authentication required');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.decode(token) as any;

    if (!decoded?.accountUuid) {
      logger.warn('Invalid token: missing accountUuid');
      throw new Error('Invalid token: missing accountUuid');
    }

    return decoded.accountUuid;
  }

  /**
   * 创建仓库
   * @route POST /api/repositories
   */
  static async createRepository(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = RepositoryController.extractAccountUuid(req);
      const service = await RepositoryController.getRepositoryService();

      logger.info('Creating repository', { accountUuid, name: req.body.name });

      const repository = await service.createRepository({
        accountUuid,
        name: req.body.name,
        type: req.body.type,
        path: req.body.path,
        description: req.body.description,
        config: req.body.config,
        initializeGit: req.body.initializeGit,
      });

      logger.info('Repository created successfully', {
        repositoryUuid: repository.uuid,
        accountUuid,
      });

      return RepositoryController.responseBuilder.sendSuccess(
        res,
        repository, // ApplicationService 已经返回 DTO
        'Repository created successfully',
        201,
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Invalid UUID')) {
          logger.error('Validation error creating repository');
          return RepositoryController.responseBuilder.sendError(res, {
            code: ResponseCode.VALIDATION_ERROR,
            message: error.message,
          });
        }
        if (error.message.includes('Authentication')) {
          logger.warn('Authentication error creating repository');
          return RepositoryController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: error.message,
          });
        }
        if (error.message.includes('already in use')) {
          logger.error('Repository path conflict');
          return RepositoryController.responseBuilder.sendError(res, {
            code: ResponseCode.CONFLICT,
            message: error.message,
          });
        }
      }

      logger.error('Error creating repository', { error });
      return RepositoryController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to create repository',
      });
    }
  }

  /**
   * 获取仓库列表
   * @route GET /api/repositories
   */
  static async getRepositories(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = RepositoryController.extractAccountUuid(req);
      const service = await RepositoryController.getRepositoryService();

      logger.info('Fetching repositories', { accountUuid });

      const includeChildren = req.query.includeChildren === 'true';
      const repositories = await service.getRepositoriesByAccount(accountUuid, {
        includeChildren,
      });

      logger.info('Repositories fetched successfully', {
        accountUuid,
        count: repositories.length,
      });

      return RepositoryController.responseBuilder.sendSuccess(
        res,
        repositories, // ApplicationService 已经返回 DTO 数组
        'Repositories retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        logger.warn('Authentication error fetching repositories');
        return RepositoryController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: error.message,
        });
      }

      logger.error('Error fetching repositories', { error });
      return RepositoryController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to fetch repositories',
      });
    }
  }

  /**
   * 获取仓库详情
   * @route GET /api/repositories/:id
   */
  static async getRepository(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = RepositoryController.extractAccountUuid(req);
      const service = await RepositoryController.getRepositoryService();
      const { id } = req.params;

      logger.info('Fetching repository', { accountUuid, repositoryUuid: id });

      const includeChildren = req.query.includeChildren === 'true';
      const repository = await service.getRepository(id, { includeChildren });

      if (!repository) {
        logger.warn('Repository not found', { repositoryUuid: id });
        return RepositoryController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Repository not found',
        });
      }

      // 验证仓库所有权
      if (repository.accountUuid !== accountUuid) {
        logger.warn('Unauthorized repository access attempt', {
          accountUuid,
          repositoryUuid: id,
        });
        return RepositoryController.responseBuilder.sendError(res, {
          code: ResponseCode.FORBIDDEN,
          message: 'You do not have permission to access this repository',
        });
      }

      logger.info('Repository fetched successfully', { repositoryUuid: id });

      return RepositoryController.responseBuilder.sendSuccess(
        res,
        repository, // ApplicationService 已经返回 DTO
        'Repository retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication')) {
        logger.warn('Authentication error fetching repository');
        return RepositoryController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: error.message,
        });
      }

      logger.error('Error fetching repository', { error });
      return RepositoryController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to fetch repository',
      });
    }
  }

  /**
   * 更新仓库配置
   * @route PUT /api/repositories/:id
   */
  static async updateRepository(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = RepositoryController.extractAccountUuid(req);
      const service = await RepositoryController.getRepositoryService();
      const { id } = req.params;

      logger.info('Updating repository', { accountUuid, repositoryUuid: id });

      // 先获取仓库验证权限
      const repository = await service.getRepository(id);
      if (!repository) {
        logger.warn('Repository not found for update', { repositoryUuid: id });
        return RepositoryController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Repository not found',
        });
      }

      if (repository.accountUuid !== accountUuid) {
        logger.warn('Unauthorized repository update attempt', {
          accountUuid,
          repositoryUuid: id,
        });
        return RepositoryController.responseBuilder.sendError(res, {
          code: ResponseCode.FORBIDDEN,
          message: 'You do not have permission to update this repository',
        });
      }

      const updated = await service.updateRepositoryConfig(id, req.body);

      logger.info('Repository updated successfully', { repositoryUuid: id });

      return RepositoryController.responseBuilder.sendSuccess(
        res,
        updated, // ApplicationService 已经返回 DTO
        'Repository updated successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Authentication')) {
          logger.warn('Authentication error updating repository');
          return RepositoryController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: error.message,
          });
        }
        if (error.message.includes('not found')) {
          logger.warn('Repository not found during update');
          return RepositoryController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: error.message,
          });
        }
      }

      logger.error('Error updating repository', { error });
      return RepositoryController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to update repository',
      });
    }
  }

  /**
   * 删除仓库
   * @route DELETE /api/repositories/:id
   */
  static async deleteRepository(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = RepositoryController.extractAccountUuid(req);
      const service = await RepositoryController.getRepositoryService();
      const { id } = req.params;

      logger.info('Deleting repository', { accountUuid, repositoryUuid: id });

      // 先获取仓库验证权限
      const repository = await service.getRepository(id);
      if (!repository) {
        logger.warn('Repository not found for deletion', { repositoryUuid: id });
        return RepositoryController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Repository not found',
        });
      }

      if (repository.accountUuid !== accountUuid) {
        logger.warn('Unauthorized repository deletion attempt', {
          accountUuid,
          repositoryUuid: id,
        });
        return RepositoryController.responseBuilder.sendError(res, {
          code: ResponseCode.FORBIDDEN,
          message: 'You do not have permission to delete this repository',
        });
      }

      const deleteFiles = req.body.deleteFiles === true;
      await service.deleteRepository(id, { deleteFiles });

      logger.info('Repository deleted successfully', { repositoryUuid: id });

      return RepositoryController.responseBuilder.sendSuccess(
        res,
        null,
        'Repository deleted successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Authentication')) {
          logger.warn('Authentication error deleting repository');
          return RepositoryController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: error.message,
          });
        }
        if (error.message.includes('not found')) {
          logger.warn('Repository not found during deletion');
          return RepositoryController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: error.message,
          });
        }
      }

      logger.error('Error deleting repository', { error });
      return RepositoryController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to delete repository',
      });
    }
  }

  /**
   * 同步仓库（从远程拉取更新）
   * @route POST /api/repositories/:id/sync
   */
  static async syncRepository(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = RepositoryController.extractAccountUuid(req);
      const service = await RepositoryController.getRepositoryService();
      const { id } = req.params;

      logger.info('Syncing repository', { accountUuid, repositoryUuid: id });

      // 验证仓库所有权
      const repository = await service.getRepository(id);
      if (!repository) {
        logger.warn('Repository not found for sync', { repositoryUuid: id });
        return RepositoryController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Repository not found',
        });
      }

      if (repository.accountUuid !== accountUuid) {
        logger.warn('Unauthorized repository sync attempt', {
          accountUuid,
          repositoryUuid: id,
        });
        return RepositoryController.responseBuilder.sendError(res, {
          code: ResponseCode.FORBIDDEN,
          message: 'You do not have permission to sync this repository',
        });
      }

      const result = await service.syncRepository(id, req.body);

      logger.info('Repository synced successfully', { repositoryUuid: id });

      return RepositoryController.responseBuilder.sendSuccess(
        res,
        result,
        'Repository synced successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Authentication')) {
          logger.warn('Authentication error syncing repository');
          return RepositoryController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: error.message,
          });
        }
        if (error.message.includes('not found')) {
          logger.warn('Repository not found during sync');
          return RepositoryController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: error.message,
          });
        }
      }

      logger.error('Error syncing repository', { error });
      return RepositoryController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to sync repository',
      });
    }
  }

  /**
   * 扫描仓库（扫描文件系统并更新资源）
   * @route POST /api/repositories/:id/scan
   * 注意：DomainService 目前只有 syncRepository 方法，暂时使用它代替
   */
  static async scanRepository(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = RepositoryController.extractAccountUuid(req);
      const service = await RepositoryController.getRepositoryService();
      const { id } = req.params;

      logger.info('Scanning repository', { accountUuid, repositoryUuid: id });

      // 验证仓库所有权
      const repository = await service.getRepository(id);
      if (!repository) {
        logger.warn('Repository not found for scan', { repositoryUuid: id });
        return RepositoryController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Repository not found',
        });
      }

      if (repository.accountUuid !== accountUuid) {
        logger.warn('Unauthorized repository scan attempt', {
          accountUuid,
          repositoryUuid: id,
        });
        return RepositoryController.responseBuilder.sendError(res, {
          code: ResponseCode.FORBIDDEN,
          message: 'You do not have permission to scan this repository',
        });
      }

      // TODO: 等待 DomainService 实现 scanRepository 方法
      // 目前使用 syncRepository 作为临时实现
      // syncRepository 参数: 'pull' | 'push' | 'both'
      await service.syncRepository(id, 'pull'); // 使用 pull 作为扫描的临时替代

      logger.info('Repository scanned successfully', { repositoryUuid: id });

      return RepositoryController.responseBuilder.sendSuccess(
        res,
        null, // scanRepository 暂无返回值
        'Repository scanned successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Authentication')) {
          logger.warn('Authentication error scanning repository');
          return RepositoryController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: error.message,
          });
        }
        if (error.message.includes('not found')) {
          logger.warn('Repository not found during scan');
          return RepositoryController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: error.message,
          });
        }
      }

      logger.error('Error scanning repository', { error });
      return RepositoryController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Failed to scan repository',
      });
    }
  }
}
