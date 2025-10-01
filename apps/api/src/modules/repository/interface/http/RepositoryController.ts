import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { RepositoryApplicationService } from '../../application/services/RepositoryApplicationService';
import { RepositoryContracts } from '@dailyuse/contracts';

export class RepositoryController {
  private static repositoryService: RepositoryApplicationService;

  static initialize(repositoryService: RepositoryApplicationService) {
    this.repositoryService = repositoryService;
  }

  /**
   * 从请求中提取用户账户UUID
   */
  private static extractAccountUuid(req: Request): string {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Authentication required');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.decode(token) as any;

    if (!decoded?.accountUuid) {
      throw new Error('Invalid token: missing accountUuid');
    }

    return decoded.accountUuid;
  }

  /**
   * 创建仓储
   * POST /api/v1/repositories
   */
  static async createRepository(req: Request, res: Response) {
    try {
      const accountUuid = RepositoryController.extractAccountUuid(req);
      const request: RepositoryContracts.CreateRepositoryRequestDTO = req.body;

      const repository = await RepositoryController.repositoryService.createRepository(
        accountUuid,
        request,
      );

      res.status(201).json({
        success: true,
        data: repository,
        message: 'Repository created successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create repository',
      });
    }
  }

  /**
   * 获取仓储列表
   * GET /api/v1/repositories
   */
  static async getRepositories(req: Request, res: Response) {
    try {
      const accountUuid = RepositoryController.extractAccountUuid(req);
      console.log('Query Params:', req.query);
      const queryParams: RepositoryContracts.RepositoryQueryParamsDTO = {
        type: req.query.type as RepositoryContracts.RepositoryType,
        status: req.query.status as RepositoryContracts.RepositoryStatus,
        keyword: req.query.keyword as string,
        pagination: {
          page: req.query.page ? parseInt(req.query.page as string) : 1,
          limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        },
      };

      const repositories = await RepositoryController.repositoryService.getRepositories(
        accountUuid,
        queryParams,
      );

      res.json({
        success: true,
        data: repositories,
        message: 'Repositories retrieved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve repositories',
      });
    }
  }

  /**
   * 根据ID获取仓储
   * GET /api/v1/repositories/:id
   */
  static async getRepositoryById(req: Request, res: Response) {
    try {
      const accountUuid = RepositoryController.extractAccountUuid(req);
      const { id } = req.params;
      const repository = await RepositoryController.repositoryService.getRepositoryById(
        accountUuid,
        id,
      );

      if (!repository) {
        return res.status(404).json({
          success: false,
          message: 'Repository not found',
        });
      }

      res.json({
        success: true,
        data: repository,
        message: 'Repository retrieved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve repository',
      });
    }
  }

  /**
   * 更新仓储
   * PUT /api/v1/repositories/:id
   */
  static async updateRepository(req: Request, res: Response) {
    try {
      const accountUuid = RepositoryController.extractAccountUuid(req);
      const { id } = req.params;
      const request: RepositoryContracts.UpdateRepositoryRequestDTO = {
        uuid: id,
        ...req.body,
      };

      const repository = await RepositoryController.repositoryService.updateRepository(
        accountUuid,
        id,
        request,
      );

      res.json({
        success: true,
        data: repository,
        message: 'Repository updated successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update repository',
      });
    }
  }

  /**
   * 删除仓储
   * DELETE /api/v1/repositories/:id
   */
  static async deleteRepository(req: Request, res: Response) {
    try {
      const accountUuid = RepositoryController.extractAccountUuid(req);
      const { id } = req.params;

      await RepositoryController.repositoryService.deleteRepository(accountUuid, id);

      res.json({
        success: true,
        message: 'Repository deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete repository',
      });
    }
  }

  /**
   * 激活仓储
   * POST /api/v1/repositories/:id/activate
   */
  static async activateRepository(req: Request, res: Response) {
    try {
      const accountUuid = RepositoryController.extractAccountUuid(req);
      const { id } = req.params;
      const repository = await RepositoryController.repositoryService.activateRepository(
        accountUuid,
        id,
      );

      res.json({
        success: true,
        data: repository,
        message: 'Repository activated successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to activate repository',
      });
    }
  }

  /**
   * 归档仓储
   * POST /api/v1/repositories/:id/archive
   */
  static async archiveRepository(req: Request, res: Response) {
    try {
      const accountUuid = RepositoryController.extractAccountUuid(req);
      const { id } = req.params;
      const repository = await RepositoryController.repositoryService.archiveRepository(
        accountUuid,
        id,
      );

      res.json({
        success: true,
        data: repository,
        message: 'Repository archived successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to archive repository',
      });
    }
  }

  /**
   * 获取Git状态
   * GET /api/v1/repositories/:id/git/status
   */
  static async getGitStatus(req: Request, res: Response) {
    try {
      const accountUuid = RepositoryController.extractAccountUuid(req);
      const { id } = req.params;
      const status = await RepositoryController.repositoryService.getGitStatus(accountUuid, id);

      res.json({
        success: true,
        data: status,
        message: 'Git status retrieved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get git status',
      });
    }
  }

  /**
   * Git提交
   * POST /api/v1/repositories/:id/git/commit
   */
  static async commitChanges(req: Request, res: Response) {
    try {
      const accountUuid = RepositoryController.extractAccountUuid(req);
      const { id } = req.params;
      const request: RepositoryContracts.GitCommitRequestDTO = req.body;

      const commit = await RepositoryController.repositoryService.commitChanges(
        accountUuid,
        id,
        request,
      );

      res.json({
        success: true,
        data: commit,
        message: 'Changes committed successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to commit changes',
      });
    }
  }

  /**
   * 获取资源列表
   * GET /api/v1/repositories/:id/resources
   */
  static async getResources(req: Request, res: Response) {
    try {
      const accountUuid = RepositoryController.extractAccountUuid(req);
      const { id } = req.params;
      const queryParams: RepositoryContracts.ResourceQueryParamsDTO = {
        type: req.query.type as RepositoryContracts.ResourceType,
        status: req.query.status as RepositoryContracts.ResourceStatus,
        keyword: req.query.keyword as string,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        pagination: {
          page: req.query.page ? parseInt(req.query.page as string) : 1,
          limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        },
      };

      const resources = await RepositoryController.repositoryService.getResources(
        accountUuid,
        id,
        queryParams,
      );

      res.json({
        success: true,
        data: resources,
        message: 'Resources retrieved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve resources',
      });
    }
  }

  /**
   * 创建资源
   * POST /api/v1/repositories/:id/resources
   */
  static async createResource(req: Request, res: Response) {
    try {
      const accountUuid = RepositoryController.extractAccountUuid(req);
      const { id } = req.params;
      const request: RepositoryContracts.CreateResourceRequestDTO = {
        repositoryUuid: id,
        ...req.body,
      };

      const resource = await RepositoryController.repositoryService.createResource(
        accountUuid,
        id,
        request,
      );

      res.status(201).json({
        success: true,
        data: resource,
        message: 'Resource created successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create resource',
      });
    }
  }

  /**
   * 更新资源
   * PUT /api/v1/resources/:resourceId
   */
  static async updateResource(req: Request, res: Response) {
    try {
      const accountUuid = RepositoryController.extractAccountUuid(req);
      const { resourceId } = req.params;
      const request: RepositoryContracts.UpdateResourceRequestDTO = {
        uuid: resourceId,
        ...req.body,
      };

      const resource = await RepositoryController.repositoryService.updateResource(
        accountUuid,
        resourceId,
        request,
      );

      res.json({
        success: true,
        data: resource,
        message: 'Resource updated successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update resource',
      });
    }
  }

  /**
   * 删除资源
   * DELETE /api/v1/resources/:resourceId
   */
  static async deleteResource(req: Request, res: Response) {
    try {
      const accountUuid = RepositoryController.extractAccountUuid(req);
      const { resourceId } = req.params;

      await RepositoryController.repositoryService.deleteResource(accountUuid, resourceId);

      res.json({
        success: true,
        message: 'Resource deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete resource',
      });
    }
  }
}
