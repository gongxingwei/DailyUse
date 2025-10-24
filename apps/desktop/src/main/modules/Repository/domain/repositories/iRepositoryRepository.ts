import { Repository } from '../aggregates/repository';

export interface IRepositoryRepository {
  addRepository(accountUuid: string, repository: Repository): Promise<void>;
  updateRepository(accountUuid: string, repository: Repository): Promise<void>;
  removeRepository(accountUuid: string, repositoryId: string): Promise<void>;
  getRepositoryById(accountUuid: string, repositoryId: string): Promise<Repository | null>;
  findAllRepositories(accountUuid: string): Promise<Repository[]>;
}
