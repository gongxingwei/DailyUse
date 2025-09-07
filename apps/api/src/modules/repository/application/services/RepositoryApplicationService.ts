/**
 * Repository Application Service
 * 仓储应用层服务 - 协调业务流程
 */

import path from 'path';
import { RepositoryContracts } from '@dailyuse/contracts';
import { RepositoryDomainService } from '../../domain/services/RepositoryDomainService.js';

// 使用类型别名来简化类型引用
type IRepository = RepositoryContracts.IRepository;
type ICreateRepositoryCommand = RepositoryContracts.ICreateRepositoryCommand;
type IUpdateRepositoryCommand = RepositoryContracts.IUpdateRepositoryCommand;
type IDeleteRepositoryCommand = RepositoryContracts.IDeleteRepositoryCommand;
type IRepositoryQuery = RepositoryContracts.IRepositoryQuery;
type IRepositoryQueryResponse = RepositoryContracts.IRepositoryQueryResponse;
type IRepositoryStatsResponse = RepositoryContracts.IRepositoryStatsResponse;
type IGitInitCommand = RepositoryContracts.IGitInitCommand;
type IGitAddCommand = RepositoryContracts.IGitAddCommand;
type IGitCommitCommand = RepositoryContracts.IGitCommitCommand;
type IGitBranchCommand = RepositoryContracts.IGitBranchCommand;
type IGitStatus = RepositoryContracts.IGitStatus;
type IGitLogResponse = RepositoryContracts.IGitLogResponse;
type IGitCommit = RepositoryContracts.IGitCommit;

export class RepositoryApplicationService {
  constructor(private readonly repositoryDomainService: RepositoryDomainService) {}

  /**
   * 创建仓储
   */
  async createRepository(command: ICreateRepositoryCommand): Promise<IRepository> {
    try {
      // 验证路径
      await this.repositoryDomainService.validateRepositoryPath(command.path);

      // 检查名称冲突 (TODO: 从存储获取现有仓储)
      // const existingRepositories = await this.repositoryRepository.getAll();
      // this.repositoryDomainService.checkNameConflict(command.name, existingRepositories);
      // this.repositoryDomainService.checkPathConflict(command.path, existingRepositories);

      // 创建仓储实体
      const repository = this.repositoryDomainService.createRepository(command);

      // 检查是否为Git仓储
      const isGitRepo = await this.repositoryDomainService.checkIfGitRepository(command.path);
      repository.isGitRepo = isGitRepo;

      // 如果需要初始化Git并且当前不是Git仓储
      if (command.initializeGit && !isGitRepo) {
        await this.initGitRepository({ repositoryPath: command.path });
        repository.isGitRepo = true;
      }

      // 保存到存储 (TODO: 实现仓储接口)
      // await this.repositoryRepository.save(repository);

      // 发布事件 (TODO: 实现事件发布)
      // await this.eventBus.publish(new RepositoryCreatedEvent({
      //   repositoryId: repository.uuid,
      //   repository
      // }));

      console.log('TODO: Save repository to storage', repository);

      return repository;
    } catch (error) {
      throw new RepositoryContracts.RepositoryError(
        `Failed to create repository: ${(error as Error).message}`,
        'CREATE_REPOSITORY_FAILED',
        { command, error },
      );
    }
  }

  /**
   * 更新仓储
   */
  async updateRepository(command: IUpdateRepositoryCommand): Promise<IRepository> {
    try {
      // 获取现有仓储 (TODO: 从存储获取)
      // const currentRepository = await this.repositoryRepository.getById(command.uuid);
      // if (!currentRepository) {
      //   throw new RepositoryContracts.RepositoryNotFoundError(command.uuid);
      // }

      // 模拟现有仓储
      const currentRepository: IRepository = {
        uuid: command.uuid,
        name: 'Test Repository',
        path: '/path/to/repo',
        createdAt: new Date(),
        updatedAt: new Date(),
        status: RepositoryContracts.RepositoryStatus.ACTIVE,
      };

      // 验证路径（如果有更改）
      if (command.path && command.path !== currentRepository.path) {
        await this.repositoryDomainService.validateRepositoryPath(command.path);

        // 检查路径冲突 (TODO: 获取其他仓储)
        // const existingRepositories = await this.repositoryRepository.getAll();
        // this.repositoryDomainService.checkPathConflict(command.path, existingRepositories, command.uuid);
      }

      // 检查名称冲突（如果有更改）
      if (command.name && command.name !== currentRepository.name) {
        // const existingRepositories = await this.repositoryRepository.getAll();
        // this.repositoryDomainService.checkNameConflict(command.name, existingRepositories, command.uuid);
      }

      // 更新仓储实体
      const updatedRepository = this.repositoryDomainService.updateRepository(
        currentRepository,
        command,
      );

      // 如果路径发生变化，重新检查Git状态
      if (command.path && command.path !== currentRepository.path) {
        const isGitRepo = await this.repositoryDomainService.checkIfGitRepository(command.path);
        updatedRepository.isGitRepo = isGitRepo;
      }

      // 保存到存储 (TODO: 实现)
      // await this.repositoryRepository.save(updatedRepository);

      // 发布事件 (TODO: 实现)
      // await this.eventBus.publish(new RepositoryUpdatedEvent({
      //   repositoryId: updatedRepository.uuid,
      //   repository: updatedRepository,
      //   changes: command
      // }));

      console.log('TODO: Update repository in storage', updatedRepository);

      return updatedRepository;
    } catch (error) {
      throw new RepositoryContracts.RepositoryError(
        `Failed to update repository: ${(error as Error).message}`,
        'UPDATE_REPOSITORY_FAILED',
        { command, error },
      );
    }
  }

  /**
   * 删除仓储
   */
  async deleteRepository(command: IDeleteRepositoryCommand): Promise<void> {
    try {
      // 获取仓储 (TODO: 从存储获取)
      // const repository = await this.repositoryRepository.getById(command.uuid);
      // if (!repository) {
      //   throw new RepositoryContracts.RepositoryNotFoundError(command.uuid);
      // }

      // 模拟现有仓储
      const repository: IRepository = {
        uuid: command.uuid,
        name: 'Test Repository',
        path: '/path/to/repo',
        createdAt: new Date(),
        updatedAt: new Date(),
        status: RepositoryContracts.RepositoryStatus.ACTIVE,
        relatedGoals: [],
      };

      // 检查是否可以删除
      const canDelete = this.repositoryDomainService.canDeleteRepository(repository);
      if (!canDelete.canDelete) {
        throw new RepositoryContracts.RepositoryError(
          `Cannot delete repository: ${canDelete.reason}`,
          'DELETE_REPOSITORY_FORBIDDEN',
        );
      }

      // 如果需要删除文件 (TODO: 实现文件删除逻辑)
      if (command.deleteFiles) {
        // await this.fileService.deleteDirectory(repository.path);
        console.log('TODO: Delete repository files', repository.path);
      }

      // 从存储中删除 (TODO: 实现)
      // await this.repositoryRepository.delete(command.uuid);

      // 发布事件 (TODO: 实现)
      // await this.eventBus.publish(new RepositoryDeletedEvent({
      //   repositoryId: command.uuid
      // }));

      console.log('TODO: Delete repository from storage', command.uuid);
    } catch (error) {
      throw new RepositoryContracts.RepositoryError(
        `Failed to delete repository: ${(error as Error).message}`,
        'DELETE_REPOSITORY_FAILED',
        { command, error },
      );
    }
  }

  /**
   * 获取仓储
   */
  async getRepository(uuid: string): Promise<IRepository | null> {
    try {
      // TODO: 从存储获取
      // const repository = await this.repositoryRepository.getById(uuid);
      // if (repository) {
      //   // 更新最后访问时间
      //   const updated = this.repositoryDomainService.updateLastAccessed(repository);
      //   await this.repositoryRepository.save(updated);
      //   return updated;
      // }
      // return null;

      console.log('TODO: Get repository from storage', uuid);
      return null;
    } catch (error) {
      throw new RepositoryContracts.RepositoryError(
        `Failed to get repository: ${(error as Error).message}`,
        'GET_REPOSITORY_FAILED',
        { uuid, error },
      );
    }
  }

  /**
   * 获取所有仓储
   */
  async getAllRepositories(): Promise<IRepository[]> {
    try {
      // TODO: 从存储获取
      // return await this.repositoryRepository.getAll();

      console.log('TODO: Get all repositories from storage');
      return [];
    } catch (error) {
      throw new RepositoryContracts.RepositoryError(
        `Failed to get all repositories: ${(error as Error).message}`,
        'GET_ALL_REPOSITORIES_FAILED',
        { error },
      );
    }
  }

  /**
   * 查询仓储
   */
  async queryRepositories(query: IRepositoryQuery): Promise<IRepositoryQueryResponse> {
    try {
      // 获取所有仓储 (TODO: 优化为数据库查询)
      const allRepositories = await this.getAllRepositories();

      // 过滤和排序
      const filtered = this.repositoryDomainService.filterAndSortRepositories(
        allRepositories,
        query,
      );

      // 应用分页
      const offset = query.offset || 0;
      const limit = query.limit || 50;
      const paged = this.repositoryDomainService.applyPagination(filtered, offset, limit);

      return {
        repositories: paged,
        total: filtered.length,
        offset,
        limit,
      };
    } catch (error) {
      throw new RepositoryContracts.RepositoryError(
        `Failed to query repositories: ${(error as Error).message}`,
        'QUERY_REPOSITORIES_FAILED',
        { query, error },
      );
    }
  }

  /**
   * 按名称获取仓储
   */
  async getRepositoryByName(name: string): Promise<IRepository | null> {
    try {
      // TODO: 优化为数据库查询
      const allRepositories = await this.getAllRepositories();
      return allRepositories.find((repo) => repo.name === name) || null;
    } catch (error) {
      throw new RepositoryContracts.RepositoryError(
        `Failed to get repository by name: ${(error as Error).message}`,
        'GET_REPOSITORY_BY_NAME_FAILED',
        { name, error },
      );
    }
  }

  /**
   * 按路径获取仓储
   */
  async getRepositoryByPath(repositoryPath: string): Promise<IRepository | null> {
    try {
      // TODO: 优化为数据库查询
      const allRepositories = await this.getAllRepositories();
      const normalizedPath = path.resolve(repositoryPath);
      return allRepositories.find((repo) => path.resolve(repo.path) === normalizedPath) || null;
    } catch (error) {
      throw new RepositoryContracts.RepositoryError(
        `Failed to get repository by path: ${(error as Error).message}`,
        'GET_REPOSITORY_BY_PATH_FAILED',
        { path: repositoryPath, error },
      );
    }
  }

  /**
   * 获取关联目标的仓储
   */
  async getRepositoriesByGoal(goalId: string): Promise<IRepository[]> {
    try {
      // TODO: 优化为数据库查询
      const allRepositories = await this.getAllRepositories();
      return allRepositories.filter((repo) => repo.relatedGoals?.includes(goalId));
    } catch (error) {
      throw new RepositoryContracts.RepositoryError(
        `Failed to get repositories by goal: ${(error as Error).message}`,
        'GET_REPOSITORIES_BY_GOAL_FAILED',
        { goalId, error },
      );
    }
  }

  /**
   * 获取仓储统计
   */
  async getRepositoryStats(): Promise<IRepositoryStatsResponse> {
    try {
      const allRepositories = await this.getAllRepositories();
      return this.repositoryDomainService.calculateStats(allRepositories);
    } catch (error) {
      throw new RepositoryContracts.RepositoryError(
        `Failed to get repository stats: ${(error as Error).message}`,
        'GET_REPOSITORY_STATS_FAILED',
        { error },
      );
    }
  }

  /**
   * 验证仓储路径
   */
  async validateRepositoryPath(path: string): Promise<boolean> {
    try {
      await this.repositoryDomainService.validateRepositoryPath(path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 检查仓储是否存在
   */
  async repositoryExists(name: string): Promise<boolean> {
    try {
      const repository = await this.getRepositoryByName(name);
      return repository !== null;
    } catch (error) {
      throw new RepositoryContracts.RepositoryError(
        `Failed to check repository existence: ${(error as Error).message}`,
        'CHECK_REPOSITORY_EXISTS_FAILED',
        { name, error },
      );
    }
  }

  // ============ Git相关方法 ============

  /**
   * 初始化Git仓储
   */
  async initGitRepository(command: IGitInitCommand): Promise<void> {
    try {
      // TODO: 实现Git初始化
      // await this.gitService.initRepository(command);

      console.log('TODO: Initialize Git repository', command);
    } catch (error) {
      throw new RepositoryContracts.GitOperationError(
        `Failed to initialize Git repository: ${(error as Error).message}`,
        'INIT',
        command.repositoryPath,
      );
    }
  }

  /**
   * 获取Git状态
   */
  async getGitStatus(repositoryPath: string): Promise<IGitStatus | null> {
    try {
      // 检查是否为Git仓储
      const isGitRepo = await this.repositoryDomainService.checkIfGitRepository(repositoryPath);
      if (!isGitRepo) {
        return null;
      }

      // TODO: 实现Git状态获取
      // const status = await this.gitService.getStatus(repositoryPath);
      // this.repositoryDomainService.validateGitStatus(status);
      // return status;

      console.log('TODO: Get Git status', repositoryPath);
      return null;
    } catch (error) {
      throw new RepositoryContracts.GitOperationError(
        `Failed to get Git status: ${(error as Error).message}`,
        'GET_STATUS',
        repositoryPath,
      );
    }
  }

  /**
   * 添加文件到Git
   */
  async addFilesToGit(command: IGitAddCommand): Promise<void> {
    try {
      // TODO: 实现Git添加文件
      // await this.gitService.addFiles(command);

      console.log('TODO: Add files to Git', command);
    } catch (error) {
      throw new RepositoryContracts.GitOperationError(
        `Failed to add files to Git: ${(error as Error).message}`,
        'ADD',
        command.repositoryPath,
      );
    }
  }

  /**
   * Git提交
   */
  async commitToGit(command: IGitCommitCommand): Promise<IGitCommit> {
    try {
      // TODO: 实现Git提交
      // const commit = await this.gitService.commit(command);

      // 创建模拟提交对象
      const commit: IGitCommit = {
        hash: `commit-${Date.now()}`,
        date: new Date().toISOString(),
        message: command.message,
        author_name: 'Unknown',
        author_email: 'unknown@example.com',
      };

      console.log('TODO: Commit to Git', command);
      return commit;
    } catch (error) {
      throw new RepositoryContracts.GitOperationError(
        `Failed to commit to Git: ${(error as Error).message}`,
        'COMMIT',
        command.repositoryPath,
      );
    }
  }

  /**
   * 获取Git提交历史
   */
  async getGitLog(repositoryPath: string, limit?: number): Promise<IGitLogResponse> {
    try {
      // TODO: 实现Git日志获取
      // return await this.gitService.getLog(repositoryPath, limit);

      console.log('TODO: Get Git log', repositoryPath, limit);
      return { commits: [] };
    } catch (error) {
      throw new RepositoryContracts.GitOperationError(
        `Failed to get Git log: ${(error as Error).message}`,
        'GET_LOG',
        repositoryPath,
      );
    }
  }
}
