import { Repository } from '../aggregates/Repository';
import { IRepositoryRepository } from '../repositories/IRepositoryRepository';

export class RepositoryService {
  constructor(private repositoryRepository: IRepositoryRepository) {}

  async createRepository(params: {
    name: string;
    path: string;
    description?: string;
  }): Promise<Repository> {
    // Check if repository with same name or path already exists
    const existingByName = await this.repositoryRepository.findByName(params.name);
    if (existingByName) {
      throw new Error('Repository with this name already exists');
    }

    const existingByPath = await this.repositoryRepository.findByPath(params.path);
    if (existingByPath) {
      throw new Error('Repository with this path already exists');
    }

    const repository = Repository.create(params);
    await this.repositoryRepository.save(repository);
    return repository;
  }

  async updateRepository(
    repositoryId: string,
    params: {
      name?: string;
      path?: string;
      description?: string;
    },
  ): Promise<void> {
    const repository = await this.repositoryRepository.findById(repositoryId);
    if (!repository) {
      throw new Error('Repository not found');
    }

    if (params.name !== undefined) {
      // Check if new name conflicts with existing repositories
      const existingByName = await this.repositoryRepository.findByName(params.name);
      if (existingByName && existingByName.uuid !== repositoryId) {
        throw new Error('Repository with this name already exists');
      }
      repository.updateName(params.name);
    }

    if (params.path !== undefined) {
      // Check if new path conflicts with existing repositories
      const existingByPath = await this.repositoryRepository.findByPath(params.path);
      if (existingByPath && existingByPath.uuid !== repositoryId) {
        throw new Error('Repository with this path already exists');
      }
      repository.updatePath(params.path);
    }

    if (params.description !== undefined) {
      repository.updateDescription(params.description);
    }

    await this.repositoryRepository.save(repository);
  }

  async linkRepositoryToGoal(repositoryId: string, goalId: string): Promise<void> {
    const repository = await this.repositoryRepository.findById(repositoryId);
    if (!repository) {
      throw new Error('Repository not found');
    }

    repository.addGoal(goalId);
    await this.repositoryRepository.save(repository);
  }

  async unlinkRepositoryFromGoal(repositoryId: string, goalId: string): Promise<void> {
    const repository = await this.repositoryRepository.findById(repositoryId);
    if (!repository) {
      throw new Error('Repository not found');
    }

    repository.removeGoal(goalId);
    await this.repositoryRepository.save(repository);
  }

  async getRepositoriesByGoal(goalId: string): Promise<Repository[]> {
    return this.repositoryRepository.findByGoalId(goalId);
  }

  async getAllRepositories(): Promise<Repository[]> {
    return this.repositoryRepository.findAll();
  }

  async deleteRepository(repositoryId: string): Promise<void> {
    const repository = await this.repositoryRepository.findById(repositoryId);
    if (!repository) {
      throw new Error('Repository not found');
    }

    await this.repositoryRepository.delete(repositoryId);
  }

  async getRepositoryById(repositoryId: string): Promise<Repository> {
    const repository = await this.repositoryRepository.findById(repositoryId);
    if (!repository) {
      throw new Error('Repository not found');
    }
    return repository;
  }
}
