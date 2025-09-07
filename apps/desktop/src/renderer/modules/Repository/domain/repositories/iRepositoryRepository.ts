import { Repository } from "../aggregates/repository";

export interface IRepositoryRepository {
    addRepository(repository: Repository): Promise<void>;
    updateRepository(repository: Repository): Promise<void>;
    removeRepository(repositoryId: string): Promise<void>;
    getRepositoryById(repositoryId: string): Promise<Repository | null>;
    setRepositories(repositories: Repository[]): Promise<void>;
}
