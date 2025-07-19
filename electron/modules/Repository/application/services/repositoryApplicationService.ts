import { IRepositoryRepository } from "../../domain/repositories/iRepositoryRepository";
import { Repository } from "../../domain/aggregates/repository";
import { SqliteRepositoryRepository } from "../../infrastructure/repositories/sqliteRepositoryRepository";

class RepositoryApplicationService {
    private repositoryRepository: IRepositoryRepository;

    constructor(repositoryRepository?: IRepositoryRepository) {
        this.repositoryRepository = repositoryRepository || new SqliteRepositoryRepository();
    }

    async add(repository: Repository): Promise<void> {
        await this.repositoryRepository.addRepository(repository);
    }

    async update(repository: Repository): Promise<void> {
        await this.repositoryRepository.updateRepository(repository);
    }

    async remove(id: string): Promise<void> {
        await this.repositoryRepository.removeRepository(id);
    }

    async findById(id: string): Promise<Repository | null> {
        return await this.repositoryRepository.getRepositoryById(id);
    }

    async findAll(): Promise<Repository[]> {
        // Assuming the repository repository has a method to find all repositories
        return await this.repositoryRepository.findAllRepositories();
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