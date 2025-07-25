import { IRepositoryRepository } from "../../domain/repositories/iRepositoryRepository";
import { Repository } from "../../domain/aggregates/repository";
import { SqliteRepositoryRepository } from "../../infrastructure/repositories/sqliteRepositoryRepository";
import { repositoryContainer } from "../../infrastructure/di/repositoryContainer";

export class RepositoryApplicationService {
  private static _repositoryApplicationService: RepositoryApplicationService;
  private repositoryRepository: IRepositoryRepository;

  constructor(repositoryRepository?: IRepositoryRepository) {
    this.repositoryRepository =
      repositoryRepository || new SqliteRepositoryRepository();
  }

  static createRepositoryApplicationService(
    repositoryRepository?: IRepositoryRepository
  ): RepositoryApplicationService {
    const repoRepository =
      repositoryRepository ||
      repositoryContainer.getSqliteRepositoryRepository();
    return new RepositoryApplicationService(repoRepository);
  }

  static getRepositoryApplicationService(): RepositoryApplicationService {
    if (!this._repositoryApplicationService) {
      this._repositoryApplicationService =
        RepositoryApplicationService.createRepositoryApplicationService();
    }
    return this._repositoryApplicationService;
  }

  async add(accountUuid: string, repository: Repository): Promise<void> {
    await this.repositoryRepository.addRepository(accountUuid, repository);
  }

  async update(accountUuid: string, repository: Repository): Promise<void> {
    await this.repositoryRepository.updateRepository(accountUuid, repository);
  }

  async remove(accountUuid: string, repositoryId: string): Promise<void> {
    await this.repositoryRepository.removeRepository(accountUuid, repositoryId);
  }

  async findById(
    accountUuid: string,
    repositoryId: string
  ): Promise<Repository | null> {
    return await this.repositoryRepository.getRepositoryById(
      accountUuid,
      repositoryId
    );
  }

  async findAll(accountUuid: string): Promise<Repository[]> {
    // Assuming the repository repository has a method to find all repositories
    return await this.repositoryRepository.findAllRepositories(accountUuid);
  }
}
