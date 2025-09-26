import { RepositoryContracts } from '@dailyuse/contracts';
import { randomUUID } from 'node:crypto';
import {
  Repository,
  type IRepositoryRepository,
  type IResourceRepository,
} from '@dailyuse/domain-server';
import { RepositoryContainer } from '../../infrastructure/di/RepositoryContainer';

export class RepositoryApplicationService {
  private static instance: RepositoryApplicationService;
  private repositoryRepository: IRepositoryRepository;
  private resourceRepository: IResourceRepository;

  constructor(
    repositoryRepository: IRepositoryRepository,
    resourceRepository: IResourceRepository,
  ) {
    this.repositoryRepository = repositoryRepository;
    this.resourceRepository = resourceRepository;
  }

  /**
   * 创建实例时注入依赖，支持默认选项
   */
  static async createInstance(
    repositoryRepository?: IRepositoryRepository,
    resourceRepository?: IResourceRepository,
  ): Promise<RepositoryApplicationService> {
    const container = RepositoryContainer.getInstance();
    const finalRepositoryRepository =
      repositoryRepository || (await container.getPrismaRepositoryRepository());
    const finalResourceRepository =
      resourceRepository || (await container.getPrismaResourceRepository());

    this.instance = new RepositoryApplicationService(
      finalRepositoryRepository,
      finalResourceRepository,
    );
    return this.instance;
  }

  /**
   * 获取服务实例
   */
  static async getInstance(): Promise<RepositoryApplicationService> {
    if (!this.instance) {
      RepositoryApplicationService.instance = await RepositoryApplicationService.createInstance();
    }
    return this.instance;
  }

  // ===== Repository 管理 =====

  async createRepository(
    accountUuid: string,
    request: RepositoryContracts.CreateRepositoryRequestDTO,
  ): Promise<RepositoryContracts.RepositoryDTO> {
    // 创建仓储领域实体
    const repository = Repository.create({
      accountUuid,
      name: request.name,
      type: request.type,
      path: request.path,
      description: request.description,
      config: {
        enableGit: request.initializeGit || false,
        autoSync: false,
        defaultLinkedDocName: 'README.md',
        supportedFileTypes: [RepositoryContracts.ResourceType.MARKDOWN],
        maxFileSize: 100 * 1024 * 1024, // 100MB
        enableVersionControl: true,
        ...request.config,
      },
    });

    // 保存到仓储
    await this.repositoryRepository.save(repository);

    // 保存后重新读取，确保包含数据库实际持久化后的完整信息（含关联、时间戳等）
    const created = await this.repositoryRepository.findByUuid(repository.getUuid());
    if (!created) {
      throw new Error('Failed to retrieve created repository');
    }

    console.log(`✅ Repository created successfully: ${created.uuid} - ${created.name}`);
    return created;
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

    const repositories = result.repositories; // Repository层已经返回DTO

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

    return repository; // Repository层已经返回DTO
  }

  async updateRepository(
    accountUuid: string,
    uuid: string,
    request: RepositoryContracts.UpdateRepositoryRequestDTO,
  ): Promise<RepositoryContracts.RepositoryDTO> {
    const repositoryDto = await this.repositoryRepository.findByUuid(uuid);
    if (!repositoryDto || repositoryDto.accountUuid !== accountUuid) {
      throw new Error('Repository not found');
    }

    // 从DTO重建域对象进行业务逻辑操作
    const repository = Repository.fromDTO(repositoryDto);

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

    // 返回更新后的DTO
    const updatedRepository = await this.repositoryRepository.findByUuid(uuid);
    if (!updatedRepository) {
      throw new Error('Failed to retrieve updated repository');
    }

    console.log(
      `✅ Repository updated successfully: ${updatedRepository.uuid} - ${updatedRepository.name}`,
    );
    return updatedRepository;
  }

  async deleteRepository(accountUuid: string, uuid: string): Promise<void> {
    const repositoryDto = await this.repositoryRepository.findByUuid(uuid);
    if (!repositoryDto || repositoryDto.accountUuid !== accountUuid) {
      throw new Error('Repository not found');
    }

    // 重建域对象进行业务逻辑验证
    const repository = Repository.fromDTO(repositoryDto);
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
    const repositoryDto = await this.repositoryRepository.findByUuid(uuid);
    if (!repositoryDto || repositoryDto.accountUuid !== accountUuid) {
      throw new Error('Repository not found');
    }

    // 重建域对象进行状态更新
    const repository = Repository.fromDTO(repositoryDto);
    repository.updateStatus(status);
    await this.repositoryRepository.save(repository);

    // 返回更新后的DTO
    const updatedRepository = await this.repositoryRepository.findByUuid(uuid);
    if (!updatedRepository) {
      throw new Error('Failed to retrieve updated repository');
    }

    return updatedRepository;
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
    const repositoryDto = await this.repositoryRepository.findByUuid(repositoryUuid);
    if (!repositoryDto || repositoryDto.accountUuid !== accountUuid) {
      throw new Error('Repository not found');
    }

    // 检查Git配置
    if (!repositoryDto.config?.enableGit) {
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
        // 计算内容大小（Node环境下不使用Blob）
        size: request.content
          ? typeof request.content === 'string'
            ? Buffer.byteLength(request.content)
            : ((request.content as ArrayBuffer | Uint8Array).byteLength ?? 0)
          : 0,
        description: request.description,
        author: request.author,
        tags: request.tags || [],
        category: request.category,
        status: RepositoryContracts.ResourceStatus.ACTIVE,
        metadata: request.metadata || {},
      };

    // 为资源生成UUID，保存并返回持久化后的完整DTO
    const resourceUuidGenerated = randomUUID();
    const resourceDto: RepositoryContracts.ResourceDTO = {
      uuid: resourceUuidGenerated,
      ...resourceData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.resourceRepository.save(resourceDto);

    // 读取持久化后的完整数据确保包含所有数据库生成的字段
    const created = await this.resourceRepository.findByUuid(resourceUuidGenerated);
    if (!created) {
      throw new Error('Failed to retrieve created resource');
    }

    console.log(`✅ Resource created successfully: ${created.uuid} - ${created.name}`);
    return created;
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

    // 读取持久化后的完整数据
    const persisted = await this.resourceRepository.findByUuid(resourceUuid);
    if (!persisted) {
      throw new Error('Failed to retrieve updated resource');
    }

    console.log(`✅ Resource updated successfully: ${persisted.uuid} - ${persisted.name}`);
    return persisted;
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
