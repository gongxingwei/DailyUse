import { RepositoryContracts } from '@dailyuse/contracts';
import {
  Repository,
  type IRepositoryRepository,
  type IResourceRepository,
} from '@dailyuse/domain-server';

export class RepositoryApplicationService {
  constructor(
    private repositoryRepository: IRepositoryRepository,
    private resourceRepository: IResourceRepository,
  ) {}

  // ===== Repository 管理 =====

  async createRepository(
    accountUuid: string,
    request: RepositoryContracts.CreateRepositoryRequestDTO,
  ): Promise<RepositoryContracts.RepositoryDTO> {
    // 构建仓储数据
    const repositoryData: Omit<
      RepositoryContracts.RepositoryDTO,
      'uuid' | 'createdAt' | 'updatedAt'
    > = {
      accountUuid,
      name: request.name,
      description: request.description || '',
      type: request.type,
      path: request.path,
      config: {
        enableGit: request.initializeGit || false,
        autoSync: false,
        defaultLinkedDocName: 'README.md',
        supportedFileTypes: [RepositoryContracts.ResourceType.MARKDOWN],
        maxFileSize: 100 * 1024 * 1024, // 100MB
        enableVersionControl: true,
        ...request.config,
      },
      relatedGoals: request.relatedGoals || [],
      status: RepositoryContracts.RepositoryStatus.ACTIVE,
      stats: {
        totalResources: 0,
        resourcesByType: {
          [RepositoryContracts.ResourceType.MARKDOWN]: 0,
          [RepositoryContracts.ResourceType.IMAGE]: 0,
          [RepositoryContracts.ResourceType.VIDEO]: 0,
          [RepositoryContracts.ResourceType.AUDIO]: 0,
          [RepositoryContracts.ResourceType.PDF]: 0,
          [RepositoryContracts.ResourceType.LINK]: 0,
          [RepositoryContracts.ResourceType.CODE]: 0,
          [RepositoryContracts.ResourceType.OTHER]: 0,
        },
        resourcesByStatus: {
          [RepositoryContracts.ResourceStatus.ACTIVE]: 0,
          [RepositoryContracts.ResourceStatus.ARCHIVED]: 0,
          [RepositoryContracts.ResourceStatus.DELETED]: 0,
          [RepositoryContracts.ResourceStatus.DRAFT]: 0,
        },
        totalSize: 0,
        recentActiveResources: 0,
        favoriteResources: 0,
        lastUpdated: new Date(),
      },
    };

    // 创建仓储领域实体
    const repository = Repository.create({
      accountUuid,
      name: request.name,
      type: request.type,
      path: request.path,
      description: request.description,
      config: repositoryData.config,
    });

    // 保存到仓储
    await this.repositoryRepository.save(repository);

    return repository.toDTO();
  }

  async getRepositories(
    accountUuid: string,
    queryParams: RepositoryContracts.RepositoryQueryParamsDTO,
  ): Promise<RepositoryContracts.RepositoryListResponseDTO> {
    const page = queryParams.pagination?.page || 1;
    const limit = queryParams.pagination?.limit || 10;

    const result = await this.repositoryRepository.findWithPagination({
      accountUuid,
      page,
      limit,
      status: queryParams.status as RepositoryContracts.RepositoryStatus,
      type: queryParams.type as RepositoryContracts.RepositoryType,
      searchTerm: queryParams.keyword,
    });

    const repositories = result.repositories.map((repository) => repository.toDTO());

    return {
      repositories,
      total: result.total,
      page,
      limit,
    };
  }

  async getRepositoryById(
    accountUuid: string,
    uuid: string,
  ): Promise<RepositoryContracts.RepositoryDTO | null> {
    const repository = await this.repositoryRepository.findByUuid(uuid);
    if (!repository || repository.accountUuid !== accountUuid) return null;

    return repository.toDTO();
  }

  async updateRepository(
    accountUuid: string,
    uuid: string,
    request: RepositoryContracts.UpdateRepositoryRequestDTO,
  ): Promise<RepositoryContracts.RepositoryDTO> {
    const repository = await this.repositoryRepository.findByUuid(uuid);
    if (!repository || repository.accountUuid !== accountUuid) {
      throw new Error('Repository not found');
    }

    // 更新仓储
    if (request.name !== undefined) repository.updateName(request.name);
    if (request.description !== undefined) repository.updateDescription(request.description);
    if (request.path !== undefined) repository.updatePath(request.path);
    if (request.config !== undefined) repository.updateConfig(request.config);

    // 更新关联目标
    if (request.relatedGoals !== undefined) {
      repository.updateRelatedGoals(request.relatedGoals);
    }

    // 更新状态
    if (request.status !== undefined) {
      repository.updateStatus(request.status);
    }

    // 保存更新
    await this.repositoryRepository.save(repository);

    return repository.toDTO();
  }

  async deleteRepository(accountUuid: string, uuid: string): Promise<void> {
    const repository = await this.repositoryRepository.findByUuid(uuid);
    if (!repository || repository.accountUuid !== accountUuid) {
      throw new Error('Repository not found');
    }

    if (!repository.canDelete()) {
      throw new Error('Repository cannot be deleted');
    }

    await this.repositoryRepository.delete(uuid);
  }

  // ===== Repository 状态管理 =====

  async activateRepository(
    accountUuid: string,
    uuid: string,
  ): Promise<RepositoryContracts.RepositoryDTO> {
    return this.updateRepositoryStatus(
      accountUuid,
      uuid,
      RepositoryContracts.RepositoryStatus.ACTIVE,
    );
  }

  async archiveRepository(
    accountUuid: string,
    uuid: string,
  ): Promise<RepositoryContracts.RepositoryDTO> {
    return this.updateRepositoryStatus(
      accountUuid,
      uuid,
      RepositoryContracts.RepositoryStatus.ARCHIVED,
    );
  }

  private async updateRepositoryStatus(
    accountUuid: string,
    uuid: string,
    status: RepositoryContracts.RepositoryStatus,
  ): Promise<RepositoryContracts.RepositoryDTO> {
    const repository = await this.repositoryRepository.findByUuid(uuid);
    if (!repository || repository.accountUuid !== accountUuid) {
      throw new Error('Repository not found');
    }

    repository.updateStatus(status);
    await this.repositoryRepository.save(repository);

    return repository.toDTO();
  }

  // ===== Git 操作 =====

  async getGitStatus(
    accountUuid: string,
    repositoryUuid: string,
  ): Promise<RepositoryContracts.GitStatusResponseDTO> {
    const repository = await this.repositoryRepository.findByUuid(repositoryUuid);
    if (!repository || repository.accountUuid !== accountUuid) {
      throw new Error('Repository not found');
    }

    // 这里应该调用 Git 相关的服务
    // 目前返回模拟数据
    return {
      current: 'main',
      ahead: 0,
      behind: 0,
      staged: [],
      unstaged: [],
      not_added: [],
      created: [],
      modified: [],
      deleted: [],
      conflicted: [],
      isClean: true,
      detached: false,
    };
  }

  async commitChanges(
    accountUuid: string,
    repositoryUuid: string,
    request: RepositoryContracts.GitCommitRequestDTO,
  ): Promise<RepositoryContracts.GitCommitDTO> {
    const repository = await this.repositoryRepository.findByUuid(repositoryUuid);
    if (!repository || repository.accountUuid !== accountUuid) {
      throw new Error('Repository not found');
    }

    if (!repository.isGitEnabled) {
      throw new Error('Git is not enabled for this repository');
    }

    // 这里应该调用 Git 相关的服务
    // 目前返回模拟数据
    return {
      hash: `commit-${Date.now()}`,
      message: request.message,
      date: new Date().toISOString(),
      author_name: 'current-user',
      author_email: 'user@example.com',
    };
  }

  // ===== 资源管理 =====

  async getResources(
    accountUuid: string,
    repositoryUuid: string,
    queryParams: RepositoryContracts.ResourceQueryParamsDTO,
  ): Promise<RepositoryContracts.ResourceListResponseDTO> {
    // 首先验证仓储存在
    const repository = await this.repositoryRepository.findByUuid(repositoryUuid);
    if (!repository || repository.accountUuid !== accountUuid) {
      throw new Error('Repository not found');
    }

    const page = queryParams.pagination?.page || 1;
    const limit = queryParams.pagination?.limit || 20;

    // 通过资源仓储获取资源
    const result = await this.resourceRepository.findWithPagination({
      repositoryUuid,
      page,
      limit,
      type: queryParams.type as RepositoryContracts.ResourceType,
      status: queryParams.status as RepositoryContracts.ResourceStatus,
      searchTerm: queryParams.keyword,
      tags: queryParams.tags,
    });

    return {
      resources: result.resources,
      total: result.total,
      page,
      limit,
    };
  }

  async createResource(
    accountUuid: string,
    repositoryUuid: string,
    request: RepositoryContracts.CreateResourceRequestDTO,
  ): Promise<RepositoryContracts.ResourceDTO> {
    // 验证仓储存在
    const repository = await this.repositoryRepository.findByUuid(repositoryUuid);
    if (!repository || repository.accountUuid !== accountUuid) {
      throw new Error('Repository not found');
    }

    const resourceData: Omit<RepositoryContracts.ResourceDTO, 'uuid' | 'createdAt' | 'updatedAt'> =
      {
        repositoryUuid,
        name: request.name,
        type: request.type,
        path: request.path,
        size: request.content
          ? typeof request.content === 'string'
            ? new Blob([request.content]).size
            : request.content.byteLength
          : 0,
        description: request.description,
        author: request.author,
        tags: request.tags || [],
        category: request.category,
        status: RepositoryContracts.ResourceStatus.ACTIVE,
        metadata: request.metadata || {},
      };

    // 创建资源DTO对象并保存
    const resourceDto: RepositoryContracts.ResourceDTO = {
      uuid: '', // 将由仓储层生成
      ...resourceData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.resourceRepository.save(resourceDto);
    return resourceDto;
  }

  async updateResource(
    accountUuid: string,
    resourceUuid: string,
    request: RepositoryContracts.UpdateResourceRequestDTO,
  ): Promise<RepositoryContracts.ResourceDTO> {
    const resource = await this.resourceRepository.findByUuid(resourceUuid);
    if (!resource) {
      throw new Error('Resource not found');
    }

    // 验证仓储归属
    const repository = await this.repositoryRepository.findByUuid(resource.repositoryUuid);
    if (!repository || repository.accountUuid !== accountUuid) {
      throw new Error('Resource not found');
    }

    const updateData: Partial<RepositoryContracts.ResourceDTO> = {};

    if (request.name !== undefined) updateData.name = request.name;
    if (request.description !== undefined) updateData.description = request.description;
    if (request.author !== undefined) updateData.author = request.author;
    if (request.version !== undefined) updateData.version = request.version;
    if (request.tags !== undefined) updateData.tags = request.tags;
    if (request.category !== undefined) updateData.category = request.category;
    if (request.status !== undefined) updateData.status = request.status;
    if (request.metadata !== undefined) updateData.metadata = request.metadata;

    // 获取现有资源并更新
    const existingResource = await this.resourceRepository.findByUuid(resourceUuid);
    if (!existingResource) {
      throw new Error('Resource not found');
    }

    const updatedResource: RepositoryContracts.ResourceDTO = {
      ...existingResource,
      ...updateData,
      updatedAt: new Date(),
    };

    await this.resourceRepository.save(updatedResource);
    return updatedResource;
  }

  async deleteResource(accountUuid: string, resourceUuid: string): Promise<void> {
    const resource = await this.resourceRepository.findByUuid(resourceUuid);
    if (!resource) {
      throw new Error('Resource not found');
    }

    // 验证仓储归属
    const repository = await this.repositoryRepository.findByUuid(resource.repositoryUuid);
    if (!repository || repository.accountUuid !== accountUuid) {
      throw new Error('Resource not found');
    }

    await this.resourceRepository.delete(resourceUuid);
  }

  // ===== 搜索和过滤 =====

  async searchRepositories(
    accountUuid: string,
    queryParams: RepositoryContracts.RepositoryQueryParamsDTO,
  ): Promise<RepositoryContracts.RepositoryListResponseDTO> {
    return this.getRepositories(accountUuid, queryParams);
  }
}
