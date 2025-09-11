/**
 * RepositoryService - 仓库聚合的应用服�?
 * 协调仓库业务逻辑和数据访�?
 */

import { Repository } from '../aggregates/Repository';
import { Resource } from '../entities/Resource';
import type { IRepositoryRepository } from '../repositories/IRepositoryRepository';
import type { IResourceRepository } from '../repositories/IResourceRepository';
import { RepositoryContracts } from '@dailyuse/contracts';

// 使用 RepositoryContracts 的类型定�?
type RepositoryDTO = RepositoryContracts.RepositoryDTO;
type ResourceDTO = RepositoryContracts.ResourceDTO;
type CreateRepositoryRequestDTO = RepositoryContracts.CreateRepositoryRequestDTO;
type UpdateRepositoryRequestDTO = RepositoryContracts.UpdateRepositoryRequestDTO;
type CreateResourceRequestDTO = RepositoryContracts.CreateResourceRequestDTO;
type UpdateResourceRequestDTO = RepositoryContracts.UpdateResourceRequestDTO;
type RepositoryType = RepositoryContracts.RepositoryType;
type RepositoryStatus = RepositoryContracts.RepositoryStatus;
type ResourceType = RepositoryContracts.ResourceType;
type ResourceStatus = RepositoryContracts.ResourceStatus;

export class RepositoryService {
  constructor(
    private readonly repositoryRepository: IRepositoryRepository,
    private readonly resourceRepository: IResourceRepository,
  ) {}

  // ============ 仓库管理 ============

  /**
   * 创建新仓�?
   */
  async createRepository(
    accountUuid: string,
    data: CreateRepositoryRequestDTO,
  ): Promise<RepositoryDTO> {
    // 创建仓库实例
    const repository = await Repository.create(data, accountUuid);

    // 保存到数据库
    await this.repositoryRepository.save(repository);

    return repository.toDTO();
  }

  /**
   * 获取仓库详情
   */
  async getRepository(uuid: string): Promise<RepositoryDTO | null> {
    return await this.repositoryRepository.findByUuid(uuid);
  }

  /**
   * 更新仓库信息
   */
  async updateRepository(uuid: string, data: UpdateRepositoryRequestDTO): Promise<RepositoryDTO> {
    const repositoryData = await this.repositoryRepository.findByUuid(uuid);
    if (!repositoryData) {
      throw new Error(`Repository not found: ${uuid}`);
    }

    const repository = Repository.fromDTO(repositoryData);
    repository.update(data);

    await this.repositoryRepository.save(repository);

    return repository.toDTO();
  }

  /**
   * 删除仓库
   */
  async deleteRepository(uuid: string): Promise<void> {
    const repositoryData = await this.repositoryRepository.findByUuid(uuid);
    if (!repositoryData) {
      throw new Error(`Repository not found: ${uuid}`);
    }

    // 检查是否有关联资源
    const resources = await this.resourceRepository.findByRepositoryUuid(uuid);
    if (resources.length > 0) {
      throw new Error('Cannot delete repository with existing resources');
    }

    await this.repositoryRepository.delete(uuid);
  }

  /**
   * 获取账户的仓库列�?
   */
  async getAccountRepositories(
    accountUuid: string,
    pagination?: { page: number; limit: number },
  ): Promise<{
    repositories: RepositoryDTO[];
    total: number;
    page: number;
    limit: number;
  }> {
    if (pagination) {
      return await this.repositoryRepository.findWithPagination({
        accountUuid,
        page: pagination.page,
        limit: pagination.limit,
      });
    }

    const repositories = await this.repositoryRepository.findByAccountUuid(accountUuid);
    return {
      repositories,
      total: repositories.length,
      page: 1,
      limit: repositories.length,
    };
  }

  /**
   * 搜索仓库
   */
  async searchRepositories(accountUuid: string, searchTerm: string): Promise<RepositoryDTO[]> {
    const repositories = await this.repositoryRepository.findByNamePattern(accountUuid, searchTerm);
    return repositories.map((repo) => repo.toDTO());
  }

  // ============ Git 操作 ============

  /**
   * 同步仓库
   */
  async synchronizeRepository(uuid: string): Promise<void> {
    const repositoryData = await this.repositoryRepository.findByUuid(uuid);
    if (!repositoryData) {
      throw new Error(`Repository not found: ${uuid}`);
    }

    const repository = Repository.fromDTO(repositoryData);
    await repository.startSync();

    await this.repositoryRepository.save(repository);
  }

  /**
   * 提交更改
   */
  async commitChanges(uuid: string, message: string): Promise<void> {
    const repositoryData = await this.repositoryRepository.findByUuid(uuid);
    if (!repositoryData) {
      throw new Error(`Repository not found: ${uuid}`);
    }

    const repository = Repository.fromDTO(repositoryData);
    await repository.commitChanges(message);

    await this.repositoryRepository.save(repository);
  }

  /**
   * 推送更�?
   */
  async pushChanges(uuid: string): Promise<void> {
    const repositoryData = await this.repositoryRepository.findByUuid(uuid);
    if (!repositoryData) {
      throw new Error(`Repository not found: ${uuid}`);
    }

    const repository = Repository.fromDTO(repositoryData);
    await repository.pushChanges();

    await this.repositoryRepository.save(repository);
  }

  /**
   * 拉取更改
   */
  async pullChanges(uuid: string): Promise<void> {
    const repositoryData = await this.repositoryRepository.findByUuid(uuid);
    if (!repositoryData) {
      throw new Error(`Repository not found: ${uuid}`);
    }

    const repository = Repository.fromDTO(repositoryData);
    await repository.pullChanges();

    await this.repositoryRepository.save(repository);
  }

  // ============ 资源管理 ============

  /**
   * 添加资源到仓�?
   */
  async addResource(repositoryUuid: string, data: CreateResourceRequestDTO): Promise<ResourceDTO> {
    // 验证仓库存在
    const repositoryData = await this.repositoryRepository.findByUuid(repositoryUuid);
    if (!repositoryData) {
      throw new Error(`Repository not found: ${repositoryUuid}`);
    }

    // 创建资源实例
    const resource = await Resource.create(data, repositoryUuid);

    // 保存到数据库
    await this.resourceRepository.save(resource.toDTO());

    return resource.toDTO();
  }

  /**
   * 获取仓库中的资源
   */
  async getRepositoryResources(
    repositoryUuid: string,
    options?: {
      type?: ResourceType;
      status?: ResourceStatus;
      searchTerm?: string;
      tags?: string[];
      pagination?: { page: number; limit: number };
    },
  ): Promise<{
    resources: ResourceDTO[];
    total: number;
    page: number;
    limit: number;
  }> {
    if (options?.pagination) {
      return await this.resourceRepository.findWithPagination({
        repositoryUuid,
        page: options.pagination.page,
        limit: options.pagination.limit,
        type: options.type,
        status: options.status,
        searchTerm: options.searchTerm,
        tags: options.tags,
      });
    }

    const resources = await this.resourceRepository.findByRepositoryUuid(repositoryUuid);
    return {
      resources,
      total: resources.length,
      page: 1,
      limit: resources.length,
    };
  }

  /**
   * 更新资源
   */
  async updateResource(uuid: string, data: UpdateResourceRequestDTO): Promise<ResourceDTO> {
    const resourceData = await this.resourceRepository.findByUuid(uuid);
    if (!resourceData) {
      throw new Error(`Resource not found: ${uuid}`);
    }

    const resource = Resource.fromDTO(resourceData);
    resource.update(data);

    await this.resourceRepository.save(resource.toDTO());

    return resource.toDTO();
  }

  /**
   * 删除资源
   */
  async deleteResource(uuid: string): Promise<void> {
    const resourceData = await this.resourceRepository.findByUuid(uuid);
    if (!resourceData) {
      throw new Error(`Resource not found: ${uuid}`);
    }

    await this.resourceRepository.delete(uuid);
  }

  /**
   * 移动资源
   */
  async moveResource(uuid: string, newPath: string): Promise<ResourceDTO> {
    const resourceData = await this.resourceRepository.findByUuid(uuid);
    if (!resourceData) {
      throw new Error(`Resource not found: ${uuid}`);
    }

    const resource = Resource.fromDTO(resourceData);
    resource.move(newPath);

    await this.resourceRepository.save(resource.toDTO());

    return resource.toDTO();
  }

  /**
   * 重命名资�?
   */
  async renameResource(uuid: string, newName: string): Promise<ResourceDTO> {
    const resourceData = await this.resourceRepository.findByUuid(uuid);
    if (!resourceData) {
      throw new Error(`Resource not found: ${uuid}`);
    }

    const resource = Resource.fromDTO(resourceData);
    resource.rename(newName);

    await this.resourceRepository.save(resource.toDTO());

    return resource.toDTO();
  }

  // ============ 高级功能 ============

  /**
   * 搜索仓库内容
   */
  async searchContent(repositoryUuid: string, searchTerm: string): Promise<ResourceDTO[]> {
    return await this.resourceRepository.searchContent(repositoryUuid, searchTerm);
  }

  /**
   * 获取仓库统计信息
   */
  async getRepositoryStatistics(repositoryUuid: string): Promise<{
    repository: {
      totalRepositories: number;
      repositoriesByType: Record<RepositoryType, number>;
      repositoriesByStatus: Record<RepositoryStatus, number>;
      totalResources: number;
      totalSize: number;
      lastAccessedAt?: Date;
    };
    resources: {
      totalResources: number;
      resourcesByType: Record<ResourceType, number>;
      resourcesByStatus: Record<ResourceStatus, number>;
      totalSize: number;
      averageSize: number;
      recentActiveCount: number;
      favoriteCount: number;
    };
  }> {
    const [repositoryStats, resourceStats] = await Promise.all([
      this.repositoryRepository.getAccountStats(repositoryUuid),
      this.resourceRepository.getRepositoryStats(repositoryUuid),
    ]);

    return {
      repository: repositoryStats,
      resources: resourceStats,
    };
  }

  /**
   * 导入本地文件夹为仓库
   */
  async importLocalFolder(
    accountUuid: string,
    folderPath: string,
    repositoryName: string,
  ): Promise<RepositoryDTO> {
    // 创建本地仓库
    const repository = await Repository.createLocal(
      {
        name: repositoryName,
        localPath: folderPath,
        description: `Imported from ${folderPath}`,
      },
      accountUuid,
    );

    // 保存仓库
    await this.repositoryRepository.save(repository);

    // 扫描并导入文�?
    await this.scanAndImportFiles(repository.getUuid(), folderPath);

    return repository.toDTO();
  }

  /**
   * 克隆远程仓库
   */
  async cloneRemoteRepository(
    accountUuid: string,
    remoteUrl: string,
    localPath: string,
    repositoryName: string,
  ): Promise<RepositoryDTO> {
    // 创建远程仓库
    const repository = await Repository.createRemote(
      {
        name: repositoryName,
        localPath,
        remoteUrl,
        description: `Cloned from ${remoteUrl}`,
      },
      accountUuid,
    );

    // 保存仓库
    await this.repositoryRepository.save(repository);

    // 执行克隆操作
    await repository.clone();
    await this.repositoryRepository.save(repository);

    // 扫描并导入文�?
    await this.scanAndImportFiles(repository.getUuid(), localPath);

    return repository.toDTO();
  }

  /**
   * 检查仓库完整�?
   */
  async checkRepositoryIntegrity(repositoryUuid: string): Promise<{
    repository: {
      isValid: boolean;
      errors: string[];
    };
    resources: {
      checkedCount: number;
      brokenCount: number;
      brokenResources: string[];
    };
  }> {
    const repositoryData = await this.repositoryRepository.findByUuid(repositoryUuid);
    if (!repositoryData) {
      throw new Error(`Repository not found: ${repositoryUuid}`);
    }

    const repository = Repository.fromDTO(repositoryData);
    const repositoryIntegrity = await repository.checkIntegrity();
    const resourceIntegrity = await this.resourceRepository.checkIntegrity(repositoryUuid);

    return {
      repository: repositoryIntegrity,
      resources: resourceIntegrity,
    };
  }

  // ============ 私有辅助方法 ============

  /**
   * 扫描文件夹并导入文件为资�?
   */
  private async scanAndImportFiles(repositoryUuid: string, folderPath: string): Promise<void> {
    // 这里应该实现文件系统扫描逻辑
    // 暂时留空，实际实现需要文件系统操�?
    // TODO: 实现文件扫描和资源创建逻辑
  }
}
