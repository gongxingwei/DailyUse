import { IRepositoryRepository } from "../../domain/repositories/iRepositoryRepository";
import { Repository } from "../../domain/aggregates/repository";
import { RepositoryContainer } from "../../infrastructure/di/repositoryContainer";
import { repositoryIpcClient } from "../../infrastructure/ipcs/repositoryIpcClient";

/**
 * 仓库应用服务，负责仓库的增删改查及状态同步
 */
class RepositoryApplicationService {
    private repositoryRepository: IRepositoryRepository;

    constructor(repositoryRepository?: IRepositoryRepository) {
        const container = RepositoryContainer.getInstance();
        this.repositoryRepository = repositoryRepository ?? container.getRepositoryStore();
    }

    /**
     * 同步所有仓库状态到本地 store
     */
    async syncAllState(): Promise<void> {
        try {
            const repositories = await repositoryIpcClient.findAllRepositories();
            console.log("【Repository 模块的状态同步】开始",repositories);
            await this.repositoryRepository.setRepositories(repositories ?? []);
            console.log("【Repository 模块的状态同步】已完成，当前仓库数量:", repositories.length);
        } catch (error) {
            console.error("Error syncing repository state:", error);
        }
    }

    /**
     * 新增仓库
     */
    async addRepository(repository: Repository): Promise<void> {
        await repositoryIpcClient.addRepository(repository);
        await this.syncAllState();
    }

    /**
     * 更新仓库
     */
    async updateRepository(repository: Repository): Promise<void> {
        await repositoryIpcClient.updateRepository(repository);
        await this.syncAllState();
    }

    /**
     * 删除仓库
     */
    async removeRepository(repositoryId: string): Promise<void> {
        await repositoryIpcClient.removeRepository(repositoryId);
        await this.syncAllState();
    }

    /**
     * 获取单个仓库（并同步状态）
     */
    async getRepositoryById(repositoryId: string): Promise<Repository | null> {
        try {
            const repo = await repositoryIpcClient.getRepositoryById(repositoryId);
            await this.syncAllState();
            return repo;
        } catch (error) {
            console.error("Error getting repository by id:", error);
            return null;
        }
    }
}

/**
 * 工厂方法：创建仓库应用服务实例
 */
export function createRepositoryApplicationService(repositoryRepository?: IRepositoryRepository): RepositoryApplicationService {
    return new RepositoryApplicationService(repositoryRepository);
}

/**
 * 单例获取仓库应用服务实例
 */
let _repositoryApplicationService: RepositoryApplicationService | null = null;

export function getRepositoryApplicationService(): RepositoryApplicationService {
    if (!_repositoryApplicationService) {
        _repositoryApplicationService = new RepositoryApplicationService();
    }
    return _repositoryApplicationService;
}
