import type { IRepositoryRepository } from '@dailyuse/domain-server';
import { RepositoryContainer } from '../../infrastructure/di/RepositoryContainer';
import { RepositoryDomainService } from '@dailyuse/domain-server';
import type { RepositoryContracts } from '@dailyuse/contracts';

/**
 * Repository 应用服务
 * 负责协调领域服务和仓储，处理业务用例
 *
 * 架构职责：
 * - 委托给 DomainService 处理业务逻辑
 * - 协调多个领域服务
 * - 事务管理
 * - DTO 转换（Domain ↔ Contracts）
 */
export class RepositoryApplicationService {
  private static instance: RepositoryApplicationService;
  private domainService: RepositoryDomainService;
  private repositoryRepository: IRepositoryRepository;

  private constructor(repositoryRepository: IRepositoryRepository) {
    this.domainService = new RepositoryDomainService(repositoryRepository);
    this.repositoryRepository = repositoryRepository;
  }

  /**
   * 创建应用服务实例（支持依赖注入）
   */
  static async createInstance(
    repositoryRepository?: IRepositoryRepository,
  ): Promise<RepositoryApplicationService> {
    const container = RepositoryContainer.getInstance();
    const repo = repositoryRepository || container.getRepositoryAggregateRepository();

    RepositoryApplicationService.instance = new RepositoryApplicationService(repo);
    return RepositoryApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static async getInstance(): Promise<RepositoryApplicationService> {
    if (!RepositoryApplicationService.instance) {
      RepositoryApplicationService.instance = await RepositoryApplicationService.createInstance();
    }
    return RepositoryApplicationService.instance;
  }

  // ===== Repository 管理 =====

  /**
   * 创建仓库
   */
  async createRepository(params: {
    accountUuid: string;
    name: string;
    type: RepositoryContracts.RepositoryType;
    path: string;
    description?: string;
    config?: Partial<RepositoryContracts.RepositoryConfig>;
    initializeGit?: boolean;
  }): Promise<RepositoryContracts.RepositoryClientDTO> {
    // 委托给领域服务处理业务逻辑
    const repository = await this.domainService.createRepository(params);

    // 转换为 DTO
    return repository.toClientDTO();
  }

  /**
   * 获取仓库详情
   */
  async getRepository(
    uuid: string,
    options?: { includeChildren?: boolean },
  ): Promise<RepositoryContracts.RepositoryClientDTO | null> {
    // 委托给领域服务处理
    const repository = await this.domainService.getRepository(uuid, options);

    return repository ? repository.toClientDTO() : null;
  }

  /**
   * 获取账户的所有仓库
   */
  async getRepositoriesByAccount(
    accountUuid: string,
    options?: { includeChildren?: boolean },
  ): Promise<RepositoryContracts.RepositoryClientDTO[]> {
    // 委托给领域服务处理
    const repositories = await this.domainService.getRepositoriesByAccount(accountUuid, options);

    // 转换为 DTO 数组
    return repositories.map((repo) => repo.toClientDTO());
  }

  /**
   * 通过路径查找仓库
   */
  async getRepositoryByPath(path: string): Promise<RepositoryContracts.RepositoryClientDTO | null> {
    // 委托给领域服务处理
    const repository = await this.domainService.getRepositoryByPath(path);

    return repository ? repository.toClientDTO() : null;
  }

  /**
   * 更新仓库配置
   */
  async updateRepositoryConfig(
    uuid: string,
    config: Partial<RepositoryContracts.RepositoryConfig>,
  ): Promise<RepositoryContracts.RepositoryClientDTO> {
    // 委托给领域服务处理业务逻辑
    const repository = await this.domainService.updateRepositoryConfig(uuid, config);

    return repository.toClientDTO();
  }

  /**
   * 删除仓库
   */
  async deleteRepository(uuid: string, options?: { deleteFiles?: boolean }): Promise<void> {
    // 委托给领域服务处理
    await this.domainService.deleteRepository(uuid, options);
  }

  // ===== Repository 状态管理 =====

  /**
   * 归档仓库
   */
  async archiveRepository(uuid: string): Promise<void> {
    // 委托给领域服务处理
    await this.domainService.archiveRepository(uuid);
  }

  /**
   * 激活仓库
   */
  async activateRepository(uuid: string): Promise<void> {
    // 委托给领域服务处理
    await this.domainService.activateRepository(uuid);
  }

  // ===== Git 管理 =====

  /**
   * 启用 Git
   */
  async enableGit(uuid: string, remoteUrl?: string): Promise<void> {
    // 委托给领域服务处理
    await this.domainService.enableGit(uuid, remoteUrl);
  }

  /**
   * 禁用 Git
   */
  async disableGit(uuid: string): Promise<void> {
    // 委托给领域服务处理
    await this.domainService.disableGit(uuid);
  }

  /**
   * 同步仓库
   */
  async syncRepository(uuid: string, type: 'pull' | 'push' | 'both', force = false): Promise<void> {
    // 委托给领域服务处理
    await this.domainService.syncRepository(uuid, type, force);
  }

  // ===== 统计与关联 =====

  /**
   * 更新统计信息
   */
  async updateRepositoryStats(uuid: string): Promise<void> {
    // 委托给领域服务处理
    await this.domainService.updateRepositoryStats(uuid);
  }

  /**
   * 添加关联目标
   */
  async addRelatedGoal(repositoryUuid: string, goalUuid: string): Promise<void> {
    // 委托给领域服务处理
    await this.domainService.addRelatedGoal(repositoryUuid, goalUuid);
  }

  /**
   * 移除关联目标
   */
  async removeRelatedGoal(repositoryUuid: string, goalUuid: string): Promise<void> {
    // 委托给领域服务处理
    await this.domainService.removeRelatedGoal(repositoryUuid, goalUuid);
  }
}
