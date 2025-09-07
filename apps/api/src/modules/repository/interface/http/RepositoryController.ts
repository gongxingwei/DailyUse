/**
 * Repository HTTP Controller
 * 仓储HTTP控制器 - 处理REST API请求
 */

import type { Request, Response } from 'express';
import { RepositoryContracts } from '@dailyuse/contracts';
import { RepositoryApplicationService } from '../../application/services/RepositoryApplicationService.js';

// 使用类型别名来简化类型引用
type ICreateRepositoryCommand = RepositoryContracts.ICreateRepositoryCommand;
type IUpdateRepositoryCommand = RepositoryContracts.IUpdateRepositoryCommand;
type IDeleteRepositoryCommand = RepositoryContracts.IDeleteRepositoryCommand;
type IRepositoryQuery = RepositoryContracts.IRepositoryQuery;
type IGitInitCommand = RepositoryContracts.IGitInitCommand;
type IGitAddCommand = RepositoryContracts.IGitAddCommand;
type IGitCommitCommand = RepositoryContracts.IGitCommitCommand;

export class RepositoryController {
  constructor(private readonly repositoryApplicationService: RepositoryApplicationService) {}

  /**
   * 创建仓储
   * POST /api/v1/repositories
   */
  async createRepository(req: Request, res: Response): Promise<void> {
    try {
      const command: ICreateRepositoryCommand = req.body;

      // 基本验证
      if (!command.name || !command.path) {
        res.status(400).json({
          error: 'INVALID_REQUEST',
          message: 'Repository name and path are required',
        });
        return;
      }

      const repository = await this.repositoryApplicationService.createRepository(command);
      res.status(201).json({ repository });
    } catch (error) {
      console.error('Failed to create repository:', error);

      if (error instanceof RepositoryContracts.RepositoryError) {
        res.status(400).json({
          error: error.code,
          message: error.message,
          details: error.details,
        });
      } else {
        res.status(500).json({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create repository',
        });
      }
    }
  }

  /**
   * 获取所有仓储
   * GET /api/v1/repositories
   */
  async getAllRepositories(req: Request, res: Response): Promise<void> {
    try {
      const repositories = await this.repositoryApplicationService.getAllRepositories();
      res.json({ repositories });
    } catch (error) {
      console.error('Failed to get all repositories:', error);
      res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get repositories',
      });
    }
  }

  /**
   * 根据ID获取仓储
   * GET /api/v1/repositories/:uuid
   */
  async getRepository(req: Request, res: Response): Promise<void> {
    try {
      const { uuid } = req.params;

      if (!uuid) {
        res.status(400).json({
          error: 'INVALID_REQUEST',
          message: 'Repository UUID is required',
        });
        return;
      }

      const repository = await this.repositoryApplicationService.getRepository(uuid);

      if (!repository) {
        res.status(404).json({
          error: 'REPOSITORY_NOT_FOUND',
          message: 'Repository not found',
        });
        return;
      }

      res.json({ repository });
    } catch (error) {
      console.error('Failed to get repository:', error);
      res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get repository',
      });
    }
  }

  /**
   * 更新仓储
   * PUT /api/v1/repositories/:uuid
   */
  async updateRepository(req: Request, res: Response): Promise<void> {
    try {
      const { uuid } = req.params;
      const command: IUpdateRepositoryCommand = {
        uuid,
        ...req.body,
      };

      if (!uuid) {
        res.status(400).json({
          error: 'INVALID_REQUEST',
          message: 'Repository UUID is required',
        });
        return;
      }

      const repository = await this.repositoryApplicationService.updateRepository(command);
      res.json({ repository });
    } catch (error) {
      console.error('Failed to update repository:', error);

      if (error instanceof RepositoryContracts.RepositoryError) {
        res.status(400).json({
          error: error.code,
          message: error.message,
          details: error.details,
        });
      } else {
        res.status(500).json({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update repository',
        });
      }
    }
  }

  /**
   * 删除仓储
   * DELETE /api/v1/repositories/:uuid
   */
  async deleteRepository(req: Request, res: Response): Promise<void> {
    try {
      const { uuid } = req.params;
      const { deleteFiles } = req.query;

      if (!uuid) {
        res.status(400).json({
          error: 'INVALID_REQUEST',
          message: 'Repository UUID is required',
        });
        return;
      }

      const command: IDeleteRepositoryCommand = {
        uuid,
        deleteFiles: deleteFiles === 'true',
      };

      await this.repositoryApplicationService.deleteRepository(command);
      res.status(204).send();
    } catch (error) {
      console.error('Failed to delete repository:', error);

      if (error instanceof RepositoryContracts.RepositoryError) {
        res.status(400).json({
          error: error.code,
          message: error.message,
          details: error.details,
        });
      } else {
        res.status(500).json({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete repository',
        });
      }
    }
  }

  /**
   * 查询仓储
   * GET /api/v1/repositories/query
   */
  async queryRepositories(req: Request, res: Response): Promise<void> {
    try {
      const query: IRepositoryQuery = {
        keyword: req.query.searchText as string,
        status: req.query.status as RepositoryContracts.RepositoryStatus,
        goalId: req.query.goalId as string,
        isGitRepo: req.query.isGitRepo ? req.query.isGitRepo === 'true' : undefined,
        sortBy: req.query.sortBy as 'name' | 'createdAt' | 'updatedAt' | 'lastAccessedAt',
        sortOrder: req.query.sortDirection as 'asc' | 'desc',
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };

      const result = await this.repositoryApplicationService.queryRepositories(query);
      res.json(result);
    } catch (error) {
      console.error('Failed to query repositories:', error);
      res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to query repositories',
      });
    }
  }

  /**
   * 根据名称获取仓储
   * GET /api/v1/repositories/by-name/:name
   */
  async getRepositoryByName(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.params;

      if (!name) {
        res.status(400).json({
          error: 'INVALID_REQUEST',
          message: 'Repository name is required',
        });
        return;
      }

      const repository = await this.repositoryApplicationService.getRepositoryByName(name);

      if (!repository) {
        res.status(404).json({
          error: 'REPOSITORY_NOT_FOUND',
          message: 'Repository not found',
        });
        return;
      }

      res.json({ repository });
    } catch (error) {
      console.error('Failed to get repository by name:', error);
      res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get repository by name',
      });
    }
  }

  /**
   * 根据路径获取仓储
   * POST /api/v1/repositories/by-path
   */
  async getRepositoryByPath(req: Request, res: Response): Promise<void> {
    try {
      const { path } = req.body;

      if (!path) {
        res.status(400).json({
          error: 'INVALID_REQUEST',
          message: 'Repository path is required',
        });
        return;
      }

      const repository = await this.repositoryApplicationService.getRepositoryByPath(path);

      if (!repository) {
        res.status(404).json({
          error: 'REPOSITORY_NOT_FOUND',
          message: 'Repository not found',
        });
        return;
      }

      res.json({ repository });
    } catch (error) {
      console.error('Failed to get repository by path:', error);
      res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get repository by path',
      });
    }
  }

  /**
   * 根据目标获取相关仓储
   * GET /api/v1/repositories/by-goal/:goalId
   */
  async getRepositoriesByGoal(req: Request, res: Response): Promise<void> {
    try {
      const { goalId } = req.params;

      if (!goalId) {
        res.status(400).json({
          error: 'INVALID_REQUEST',
          message: 'Goal ID is required',
        });
        return;
      }

      const repositories = await this.repositoryApplicationService.getRepositoriesByGoal(goalId);
      res.json({ repositories });
    } catch (error) {
      console.error('Failed to get repositories by goal:', error);
      res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get repositories by goal',
      });
    }
  }

  /**
   * 获取仓储统计
   * GET /api/v1/repositories/stats
   */
  async getRepositoryStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.repositoryApplicationService.getRepositoryStats();
      res.json(stats);
    } catch (error) {
      console.error('Failed to get repository stats:', error);
      res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get repository stats',
      });
    }
  }

  /**
   * 验证仓储路径
   * POST /api/v1/repositories/validate-path
   */
  async validatePath(req: Request, res: Response): Promise<void> {
    try {
      const { path } = req.body;

      if (!path) {
        res.status(400).json({
          error: 'INVALID_REQUEST',
          message: 'Path is required',
        });
        return;
      }

      const isValid = await this.repositoryApplicationService.validateRepositoryPath(path);
      res.json({ isValid });
    } catch (error) {
      console.error('Failed to validate path:', error);
      res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to validate path',
      });
    }
  }

  /**
   * 检查仓储是否存在
   * GET /api/v1/repositories/exists/:name
   */
  async repositoryExists(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.params;

      if (!name) {
        res.status(400).json({
          error: 'INVALID_REQUEST',
          message: 'Repository name is required',
        });
        return;
      }

      const exists = await this.repositoryApplicationService.repositoryExists(name);
      res.json({ exists });
    } catch (error) {
      console.error('Failed to check repository existence:', error);
      res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to check repository existence',
      });
    }
  }

  // ============ Git 相关端点 ============

  /**
   * 初始化Git仓储
   * POST /api/v1/repositories/:uuid/git/init
   */
  async initGit(req: Request, res: Response): Promise<void> {
    try {
      const { uuid } = req.params;

      if (!uuid) {
        res.status(400).json({
          error: 'INVALID_REQUEST',
          message: 'Repository UUID is required',
        });
        return;
      }

      // 获取仓储以获取路径
      const repository = await this.repositoryApplicationService.getRepository(uuid);
      if (!repository) {
        res.status(404).json({
          error: 'REPOSITORY_NOT_FOUND',
          message: 'Repository not found',
        });
        return;
      }

      const command: IGitInitCommand = {
        repositoryPath: repository.path,
      };

      await this.repositoryApplicationService.initGitRepository(command);
      res.status(204).send();
    } catch (error) {
      console.error('Failed to initialize Git:', error);

      if (error instanceof RepositoryContracts.GitOperationError) {
        res.status(400).json({
          error: error.code,
          message: error.message,
          operation: error.operation,
          repositoryPath: error.repositoryPath,
        });
      } else {
        res.status(500).json({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to initialize Git',
        });
      }
    }
  }

  /**
   * 获取Git状态
   * GET /api/v1/repositories/:uuid/git/status
   */
  async getGitStatus(req: Request, res: Response): Promise<void> {
    try {
      const { uuid } = req.params;

      if (!uuid) {
        res.status(400).json({
          error: 'INVALID_REQUEST',
          message: 'Repository UUID is required',
        });
        return;
      }

      // 获取仓储以获取路径
      const repository = await this.repositoryApplicationService.getRepository(uuid);
      if (!repository) {
        res.status(404).json({
          error: 'REPOSITORY_NOT_FOUND',
          message: 'Repository not found',
        });
        return;
      }

      const status = await this.repositoryApplicationService.getGitStatus(repository.path);
      res.json({ status });
    } catch (error) {
      console.error('Failed to get Git status:', error);
      res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get Git status',
      });
    }
  }

  /**
   * 添加文件到Git
   * POST /api/v1/repositories/:uuid/git/add
   */
  async addToGit(req: Request, res: Response): Promise<void> {
    try {
      const { uuid } = req.params;
      const { files } = req.body;

      if (!uuid) {
        res.status(400).json({
          error: 'INVALID_REQUEST',
          message: 'Repository UUID is required',
        });
        return;
      }

      // 获取仓储以获取路径
      const repository = await this.repositoryApplicationService.getRepository(uuid);
      if (!repository) {
        res.status(404).json({
          error: 'REPOSITORY_NOT_FOUND',
          message: 'Repository not found',
        });
        return;
      }

      const command: IGitAddCommand = {
        repositoryPath: repository.path,
        files: files || ['.'], // 默认添加所有文件
      };

      await this.repositoryApplicationService.addFilesToGit(command);
      res.status(204).send();
    } catch (error) {
      console.error('Failed to add files to Git:', error);

      if (error instanceof RepositoryContracts.GitOperationError) {
        res.status(400).json({
          error: error.code,
          message: error.message,
          operation: error.operation,
          repositoryPath: error.repositoryPath,
        });
      } else {
        res.status(500).json({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add files to Git',
        });
      }
    }
  }

  /**
   * Git提交
   * POST /api/v1/repositories/:uuid/git/commit
   */
  async commitToGit(req: Request, res: Response): Promise<void> {
    try {
      const { uuid } = req.params;
      const { message } = req.body;

      if (!uuid) {
        res.status(400).json({
          error: 'INVALID_REQUEST',
          message: 'Repository UUID is required',
        });
        return;
      }

      if (!message) {
        res.status(400).json({
          error: 'INVALID_REQUEST',
          message: 'Commit message is required',
        });
        return;
      }

      // 获取仓储以获取路径
      const repository = await this.repositoryApplicationService.getRepository(uuid);
      if (!repository) {
        res.status(404).json({
          error: 'REPOSITORY_NOT_FOUND',
          message: 'Repository not found',
        });
        return;
      }

      const command: IGitCommitCommand = {
        repositoryPath: repository.path,
        message,
      };

      const commit = await this.repositoryApplicationService.commitToGit(command);
      res.json({ commit });
    } catch (error) {
      console.error('Failed to commit to Git:', error);

      if (error instanceof RepositoryContracts.GitOperationError) {
        res.status(400).json({
          error: error.code,
          message: error.message,
          operation: error.operation,
          repositoryPath: error.repositoryPath,
        });
      } else {
        res.status(500).json({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to commit to Git',
        });
      }
    }
  }

  /**
   * 获取Git提交历史
   * GET /api/v1/repositories/:uuid/git/log
   */
  async getGitLog(req: Request, res: Response): Promise<void> {
    try {
      const { uuid } = req.params;
      const { limit } = req.query;

      if (!uuid) {
        res.status(400).json({
          error: 'INVALID_REQUEST',
          message: 'Repository UUID is required',
        });
        return;
      }

      // 获取仓储以获取路径
      const repository = await this.repositoryApplicationService.getRepository(uuid);
      if (!repository) {
        res.status(404).json({
          error: 'REPOSITORY_NOT_FOUND',
          message: 'Repository not found',
        });
        return;
      }

      const logLimit = limit ? parseInt(limit as string) : undefined;
      const log = await this.repositoryApplicationService.getGitLog(repository.path, logLimit);
      res.json(log);
    } catch (error) {
      console.error('Failed to get Git log:', error);
      res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get Git log',
      });
    }
  }
}
