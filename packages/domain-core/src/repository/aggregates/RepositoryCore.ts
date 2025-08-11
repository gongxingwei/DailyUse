import { AggregateRoot } from '@dailyuse/utils';

/**
 * 存储库核心基类 - 包含共享属性和基础计算
 */
export abstract class RepositoryCore extends AggregateRoot {
  protected _name: string;
  protected _path: string;
  protected _description?: string;
  protected _type: 'git' | 'local' | 'remote' | 'cloud';
  protected _status: 'active' | 'inactive' | 'archived';
  protected _relatedGoals: string[];
  protected _tags: string[];
  protected _createdAt: Date;
  protected _updatedAt: Date;
  protected _lastAccessedAt?: Date;

  constructor(params: {
    uuid?: string;
    name: string;
    path: string;
    description?: string;
    type?: 'git' | 'local' | 'remote' | 'cloud';
    status?: 'active' | 'inactive' | 'archived';
    relatedGoals?: string[];
    tags?: string[];
    createdAt?: Date;
    updatedAt?: Date;
    lastAccessedAt?: Date;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());

    this._name = params.name;
    this._path = params.path;
    this._description = params.description;
    this._type = params.type || 'local';
    this._status = params.status || 'active';
    this._relatedGoals = params.relatedGoals || [];
    this._tags = params.tags || [];
    this._createdAt = params.createdAt || new Date();
    this._updatedAt = params.updatedAt || new Date();
    this._lastAccessedAt = params.lastAccessedAt;
  }

  // ===== 共享只读属性 =====
  get name(): string {
    return this._name;
  }
  get path(): string {
    return this._path;
  }
  get description(): string | undefined {
    return this._description;
  }
  get type(): 'git' | 'local' | 'remote' | 'cloud' {
    return this._type;
  }
  get status(): 'active' | 'inactive' | 'archived' {
    return this._status;
  }
  get relatedGoals(): string[] {
    return [...this._relatedGoals];
  }
  get tags(): string[] {
    return [...this._tags];
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }
  get lastAccessedAt(): Date | undefined {
    return this._lastAccessedAt;
  }

  // ===== 共享计算属性 =====
  get isActive(): boolean {
    return this._status === 'active';
  }

  get isGitRepository(): boolean {
    return this._type === 'git';
  }

  get isLocalRepository(): boolean {
    return this._type === 'local';
  }

  get hasRelatedGoals(): boolean {
    return this._relatedGoals.length > 0;
  }

  get goalCount(): number {
    return this._relatedGoals.length;
  }

  get hasTags(): boolean {
    return this._tags.length > 0;
  }

  get daysSinceLastAccessed(): number {
    if (!this._lastAccessedAt) return 0;
    const now = new Date();
    const diffTime = now.getTime() - this._lastAccessedAt.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  // ===== 共享验证方法 =====
  protected validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('存储库名称不能为空');
    }
    if (name.length > 100) {
      throw new Error('存储库名称不能超过100个字符');
    }
  }

  protected validatePath(path: string): void {
    if (!path || path.trim().length === 0) {
      throw new Error('存储库路径不能为空');
    }
  }

  // ===== 共享辅助方法 =====
  hasGoal(goalUuid: string): boolean {
    return this._relatedGoals.includes(goalUuid);
  }

  hasTag(tag: string): boolean {
    return this._tags.includes(tag);
  }

  protected updateVersion(): void {
    this._updatedAt = new Date();
  }

  // ===== 序列化方法 =====
  toDTO() {
    return {
      uuid: this.uuid,
      name: this._name,
      path: this._path,
      description: this._description,
      type: this._type,
      status: this._status,
      relatedGoals: [...this._relatedGoals],
      tags: [...this._tags],
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      lastAccessedAt: this._lastAccessedAt,
      // 计算属性
      isActive: this.isActive,
      goalCount: this.goalCount,
      daysSinceLastAccessed: this.daysSinceLastAccessed,
    };
  }

  // ===== 抽象方法（由子类实现）=====
  abstract updateName(newName: string): void;
  abstract updatePath(newPath: string): void;
  abstract addGoal(goalUuid: string): void;
  abstract removeGoal(goalUuid: string): void;
  abstract addTag(tag: string): void;
  abstract removeTag(tag: string): void;
}
