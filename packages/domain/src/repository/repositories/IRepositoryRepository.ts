import { Repository } from '../aggregates/Repository';

export interface IRepositoryRepository {
  findById(id: string): Promise<Repository | null>;
  findByName(name: string): Promise<Repository | null>;
  findByPath(path: string): Promise<Repository | null>;
  findByGoalId(goalId: string): Promise<Repository[]>;
  findAll(): Promise<Repository[]>;
  save(repository: Repository): Promise<void>;
  delete(repositoryId: string): Promise<void>;
}
