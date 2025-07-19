import { IRepositoryRepository } from "../../domain/repositories/iRepositoryRepository";
import { IRepository } from "../../domain/types";
import { Repository } from "../../domain/aggregates/repository";
import { RepositoryContainer } from "../../infrastructure/di/repositoryContainer";
import { repositoryIpcClient } from "../../infrastructure/ipcs/repositoryIpcClient";

class RepositoryApplicationService {
    private repositoryRepository: IRepositoryRepository;

    constructor(repositoryRepository?: IRepositoryRepository) {
        const container = RepositoryContainer.getInstance();
        this.repositoryRepository = repositoryRepository || container.getRepositoryStore();
    }


    async syncAllState() {
        try {
            const repositories = await repositoryIpcClient.findAllRepositories();
            if (repositories && repositories.length > 0) {
                    await this.repositoryRepository.setRepositories(repositories);
            }
            console.log("【Repository 模块的状态同步】已完成，当前仓库数量:", repositories.length);
        } catch (error) {
            console.error("Error syncing repository state:", error);
        }
    }

    async addRepository(repository: Repository): Promise<void> {
        await this.repositoryRepository.addRepository(repository);
    }

    async updateRepository(repository: Repository): Promise<void> {
        await this.repositoryRepository.updateRepository(repository);
    }

    async removeRepository(repositoryId: string): Promise<void> {
        await this.repositoryRepository.removeRepository(repositoryId);
    }

    async getRepositoryById(repositoryId: string): Promise<Repository | null> {
        return await this.repositoryRepository.getRepositoryById(repositoryId);
    }
}

export function createRepositoryApplicationService(repositoryRepository?: IRepositoryRepository): RepositoryApplicationService {
    return new RepositoryApplicationService(repositoryRepository);
}

let _repositoryApplicationService: RepositoryApplicationService | null = null;

export function getRepositoryApplicationService(): RepositoryApplicationService {
    if (!_repositoryApplicationService) {
        _repositoryApplicationService = new RepositoryApplicationService();
    }
    return _repositoryApplicationService;
}