import { AggregateRoot } from '@dailyuse/utils';
import { IRepository } from '../types';

/**
 * Repository 聚合根
 * 管理代码仓库的基本信息和关联的目标
 */
export class Repository extends AggregateRoot implements IRepository {
  private _name: string;
  private _path: string;
  private _description?: string;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _relatedGoals: string[];

  constructor(params: {
    uuid?: string;
    name: string;
    path: string;
    description?: string;
    relatedGoals?: string[];
  }) {
    super(params.uuid);
    this._name = params.name;
    this._path = params.path;
    this._description = params.description;
    this._relatedGoals = params.relatedGoals || [];
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  get name(): string {
    return this._name;
  }

  get path(): string {
    return this._path;
  }

  get description(): string | undefined {
    return this._description;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get relatedGoals(): string[] {
    return [...this._relatedGoals];
  }

  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Repository name cannot be empty');
    }
    this._name = name.trim();
    this._updatedAt = new Date();
  }

  updatePath(path: string): void {
    if (!path || path.trim().length === 0) {
      throw new Error('Repository path cannot be empty');
    }
    this._path = path.trim();
    this._updatedAt = new Date();
  }

  updateDescription(description?: string): void {
    this._description = description;
    this._updatedAt = new Date();
  }

  addGoal(goalId: string): void {
    if (!this._relatedGoals.includes(goalId)) {
      this._relatedGoals.push(goalId);
      this._updatedAt = new Date();
    }
  }

  removeGoal(goalId: string): void {
    const index = this._relatedGoals.indexOf(goalId);
    if (index > -1) {
      this._relatedGoals.splice(index, 1);
      this._updatedAt = new Date();
    }
  }

  hasGoal(goalId: string): boolean {
    return this._relatedGoals.includes(goalId);
  }

  static create(params: { name: string; path: string; description?: string }): Repository {
    return new Repository(params);
  }
}
