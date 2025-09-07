/**
 * Repository Domain Service
 * 仓储领域服务 - 实现核心业务逻辑
 */

import { RepositoryContracts } from '@dailyuse/contracts';
import * as path from 'path';
import * as fs from 'fs/promises';

// 使用类型别名来简化类型引用
type IRepository = RepositoryContracts.IRepository;
type ICreateRepositoryCommand = RepositoryContracts.ICreateRepositoryCommand;
type IUpdateRepositoryCommand = RepositoryContracts.IUpdateRepositoryCommand;
type IGitStatus = RepositoryContracts.IGitStatus;

export class RepositoryDomainService {
  /**
   * 验证仓储名称
   */
  public validateRepositoryName(name: string): void {
    if (!name || name.trim() === '') {
      throw new RepositoryContracts.RepositoryError(
        'Repository name cannot be empty',
        'INVALID_NAME',
      );
    }

    if (name.length < 2) {
      throw new RepositoryContracts.RepositoryError(
        'Repository name must be at least 2 characters',
        'INVALID_NAME',
      );
    }

    if (name.length > 50) {
      throw new RepositoryContracts.RepositoryError(
        'Repository name cannot exceed 50 characters',
        'INVALID_NAME',
      );
    }

    // 检查特殊字符
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(name)) {
      throw new RepositoryContracts.RepositoryError(
        'Repository name contains invalid characters',
        'INVALID_NAME',
      );
    }
  }

  /**
   * 验证仓储路径
   */
  public async validateRepositoryPath(repositoryPath: string): Promise<void> {
    if (!repositoryPath || repositoryPath.trim() === '') {
      throw new RepositoryContracts.PathValidationError(repositoryPath, 'Path cannot be empty');
    }

    try {
      // 检查路径是否存在
      const stats = await fs.stat(repositoryPath);
      if (!stats.isDirectory()) {
        throw new RepositoryContracts.PathValidationError(
          repositoryPath,
          'Path is not a directory',
        );
      }

      // 检查是否有读写权限
      try {
        await fs.access(repositoryPath, fs.constants.R_OK | fs.constants.W_OK);
      } catch {
        throw new RepositoryContracts.PathValidationError(
          repositoryPath,
          'No read/write permission',
        );
      }
    } catch (error) {
      if (error instanceof RepositoryContracts.PathValidationError) {
        throw error;
      }
      throw new RepositoryContracts.PathValidationError(
        repositoryPath,
        'Path does not exist or is not accessible',
      );
    }
  }

  /**
   * 验证仓储实体
   */
  public validateRepository(repository: Partial<IRepository>): void {
    if (!repository.uuid) {
      throw new RepositoryContracts.RepositoryError(
        'Repository UUID is required',
        'INVALID_REPOSITORY',
      );
    }

    if (!repository.name) {
      throw new RepositoryContracts.RepositoryError(
        'Repository name is required',
        'INVALID_REPOSITORY',
      );
    }

    if (!repository.path) {
      throw new RepositoryContracts.RepositoryError(
        'Repository path is required',
        'INVALID_REPOSITORY',
      );
    }

    this.validateRepositoryName(repository.name);
  }

  /**
   * 创建仓储实体
   */
  public createRepository(command: ICreateRepositoryCommand): IRepository {
    // 验证输入
    this.validateRepositoryName(command.name);

    const now = new Date();
    const repository: IRepository = {
      uuid: this.generateUUID(),
      name: command.name.trim(),
      path: path.resolve(command.path),
      description: command.description?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
      relatedGoals: command.relatedGoals || [],
      status: RepositoryContracts.RepositoryStatus.ACTIVE,
      isGitRepo: false, // 将在Git检查后更新
      hasChanges: false,
      lastAccessedAt: now,
    };

    this.validateRepository(repository);
    return repository;
  }

  /**
   * 更新仓储实体
   */
  public updateRepository(current: IRepository, command: IUpdateRepositoryCommand): IRepository {
    const updated: IRepository = {
      ...current,
      updatedAt: new Date(),
    };

    if (command.name !== undefined) {
      this.validateRepositoryName(command.name);
      updated.name = command.name.trim();
    }

    if (command.path !== undefined) {
      updated.path = path.resolve(command.path);
    }

    if (command.description !== undefined) {
      updated.description = command.description.trim() || undefined;
    }

    if (command.relatedGoals !== undefined) {
      updated.relatedGoals = [...command.relatedGoals];
    }

    if (command.status !== undefined) {
      updated.status = command.status;
    }

    this.validateRepository(updated);
    return updated;
  }

  /**
   * 生成UUID
   */
  public generateUUID(): string {
    return `repo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 检查仓储名称冲突
   */
  public checkNameConflict(
    name: string,
    existingRepositories: IRepository[],
    excludeUuid?: string,
  ): void {
    const conflict = existingRepositories.find(
      (repo) => repo.name.toLowerCase() === name.toLowerCase() && repo.uuid !== excludeUuid,
    );

    if (conflict) {
      throw new RepositoryContracts.RepositoryExistsError(name);
    }
  }

  /**
   * 检查路径冲突
   */
  public checkPathConflict(
    repositoryPath: string,
    existingRepositories: IRepository[],
    excludeUuid?: string,
  ): void {
    const normalizedPath = path.resolve(repositoryPath);
    const conflict = existingRepositories.find(
      (repo) => path.resolve(repo.path) === normalizedPath && repo.uuid !== excludeUuid,
    );

    if (conflict) {
      throw new RepositoryContracts.RepositoryError(
        `Path already used by repository: ${conflict.name}`,
        'PATH_CONFLICT',
        { conflictingRepository: conflict.name },
      );
    }
  }

  /**
   * 过滤和排序仓储
   */
  public filterAndSortRepositories(
    repositories: IRepository[],
    query: RepositoryContracts.IRepositoryQuery,
  ): IRepository[] {
    let filtered = [...repositories];

    // 关键字搜索
    if (query.keyword) {
      const keyword = query.keyword.toLowerCase();
      filtered = filtered.filter(
        (repo) =>
          repo.name.toLowerCase().includes(keyword) ||
          repo.description?.toLowerCase().includes(keyword) ||
          repo.path.toLowerCase().includes(keyword),
      );
    }

    // 状态过滤
    if (query.status) {
      filtered = filtered.filter((repo) => repo.status === query.status);
    }

    // 关联目标过滤
    if (query.goalId) {
      filtered = filtered.filter((repo) => repo.relatedGoals?.includes(query.goalId!));
    }

    // Git仓储过滤
    if (query.isGitRepo !== undefined) {
      filtered = filtered.filter((repo) => repo.isGitRepo === query.isGitRepo);
    }

    // 排序
    const sortBy = query.sortBy || 'updatedAt';
    const sortOrder = query.sortOrder || 'desc';

    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'createdAt':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        case 'updatedAt':
          aValue = a.updatedAt.getTime();
          bValue = b.updatedAt.getTime();
          break;
        case 'lastAccessedAt':
          aValue = a.lastAccessedAt?.getTime() || 0;
          bValue = b.lastAccessedAt?.getTime() || 0;
          break;
        default:
          aValue = a.updatedAt.getTime();
          bValue = b.updatedAt.getTime();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }

  /**
   * 应用分页
   */
  public applyPagination<T>(items: T[], offset: number = 0, limit: number = 50): T[] {
    return items.slice(offset, offset + limit);
  }

  /**
   * 计算仓储统计
   */
  public calculateStats(repositories: IRepository[]): RepositoryContracts.IRepositoryStatsResponse {
    const stats: RepositoryContracts.IRepositoryStatsResponse = {
      totalRepositories: repositories.length,
      activeRepositories: 0,
      gitRepositories: 0,
      repositoriesWithChanges: 0,
      statusStats: {
        [RepositoryContracts.RepositoryStatus.ACTIVE]: 0,
        [RepositoryContracts.RepositoryStatus.INACTIVE]: 0,
        [RepositoryContracts.RepositoryStatus.ARCHIVED]: 0,
        [RepositoryContracts.RepositoryStatus.ERROR]: 0,
      },
    };

    repositories.forEach((repo) => {
      // 活跃仓储
      if (repo.status === RepositoryContracts.RepositoryStatus.ACTIVE) {
        stats.activeRepositories++;
      }

      // Git仓储
      if (repo.isGitRepo) {
        stats.gitRepositories++;
      }

      // 有更改的仓储
      if (repo.hasChanges) {
        stats.repositoriesWithChanges++;
      }

      // 状态统计
      if (repo.status) {
        stats.statusStats[repo.status]++;
      }
    });

    return stats;
  }

  /**
   * 更新仓储访问时间
   */
  public updateLastAccessed(repository: IRepository): IRepository {
    return {
      ...repository,
      lastAccessedAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * 检查仓储是否可以删除
   */
  public canDeleteRepository(repository: IRepository): { canDelete: boolean; reason?: string } {
    // 检查是否有关联的目标
    if (repository.relatedGoals && repository.relatedGoals.length > 0) {
      return {
        canDelete: false,
        reason: `Repository is linked to ${repository.relatedGoals.length} goal(s)`,
      };
    }

    // 检查是否有未提交的更改
    if (repository.isGitRepo && repository.hasChanges) {
      return {
        canDelete: false,
        reason: 'Repository has uncommitted changes',
      };
    }

    return { canDelete: true };
  }

  /**
   * 生成仓储唯一标识符
   */
  public generateRepositorySlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // 移除特殊字符
      .replace(/\s+/g, '-') // 空格替换为连字符
      .replace(/-+/g, '-') // 多个连字符合并为一个
      .trim();
  }

  /**
   * 验证Git状态数据
   */
  public validateGitStatus(status: Partial<IGitStatus>): void {
    if (!status.current) {
      throw new RepositoryContracts.GitOperationError(
        'Git status missing current branch',
        'GET_STATUS',
        '',
      );
    }

    // 确保数组字段存在
    const arrayFields = [
      'staged',
      'unstaged',
      'not_added',
      'created',
      'modified',
      'deleted',
      'conflicted',
    ];
    arrayFields.forEach((field) => {
      if (!Array.isArray((status as any)[field])) {
        (status as any)[field] = [];
      }
    });
  }

  /**
   * 检查路径是否为Git仓储
   */
  public async checkIfGitRepository(repositoryPath: string): Promise<boolean> {
    try {
      const gitDir = path.join(repositoryPath, '.git');
      const stats = await fs.stat(gitDir);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }
}
