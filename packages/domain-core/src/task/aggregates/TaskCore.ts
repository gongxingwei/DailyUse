import { AggregateRoot } from '@dailyuse/utils';

/**
 * 任务核心基类 - 包含共享属性和基础计算
 */
export abstract class TaskCore extends AggregateRoot {
  protected _title: string;
  protected _description?: string;
  protected _priority: 'low' | 'medium' | 'high' | 'urgent';
  protected _status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  protected _goalUuid?: string;
  protected _assignedTo?: string;
  protected _dueDate?: Date;
  protected _estimatedHours?: number;
  protected _actualHours?: number;
  protected _tags: string[];
  protected _createdAt: Date;
  protected _updatedAt: Date;
  protected _completedAt?: Date;

  constructor(params: {
    uuid?: string;
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    status?: 'todo' | 'in_progress' | 'completed' | 'cancelled';
    goalUuid?: string;
    assignedTo?: string;
    dueDate?: Date;
    estimatedHours?: number;
    actualHours?: number;
    tags?: string[];
    createdAt?: Date;
    updatedAt?: Date;
    completedAt?: Date;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());

    this._title = params.title;
    this._description = params.description;
    this._priority = params.priority || 'medium';
    this._status = params.status || 'todo';
    this._goalUuid = params.goalUuid;
    this._assignedTo = params.assignedTo;
    this._dueDate = params.dueDate;
    this._estimatedHours = params.estimatedHours;
    this._actualHours = params.actualHours;
    this._tags = params.tags || [];
    this._createdAt = params.createdAt || new Date();
    this._updatedAt = params.updatedAt || new Date();
    this._completedAt = params.completedAt;
  }

  // ===== 共享只读属性 =====
  get title(): string {
    return this._title;
  }
  get description(): string | undefined {
    return this._description;
  }
  get priority(): 'low' | 'medium' | 'high' | 'urgent' {
    return this._priority;
  }
  get status(): 'todo' | 'in_progress' | 'completed' | 'cancelled' {
    return this._status;
  }
  get goalUuid(): string | undefined {
    return this._goalUuid;
  }
  get assignedTo(): string | undefined {
    return this._assignedTo;
  }
  get dueDate(): Date | undefined {
    return this._dueDate;
  }
  get estimatedHours(): number | undefined {
    return this._estimatedHours;
  }
  get actualHours(): number | undefined {
    return this._actualHours;
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
  get completedAt(): Date | undefined {
    return this._completedAt;
  }

  // ===== 共享计算属性 =====
  get isTodo(): boolean {
    return this._status === 'todo';
  }

  get isInProgress(): boolean {
    return this._status === 'in_progress';
  }

  get isCompleted(): boolean {
    return this._status === 'completed';
  }

  get isCancelled(): boolean {
    return this._status === 'cancelled';
  }

  get isOverdue(): boolean {
    if (!this._dueDate || this.isCompleted || this.isCancelled) {
      return false;
    }
    return new Date() > this._dueDate;
  }

  get timeUntilDue(): number {
    if (!this._dueDate) return 0;
    return Math.max(0, this._dueDate.getTime() - Date.now());
  }

  get hoursUntilDue(): number {
    return Math.ceil(this.timeUntilDue / (1000 * 60 * 60));
  }

  get duration(): number {
    if (!this._completedAt) return 0;
    return this._completedAt.getTime() - this._createdAt.getTime();
  }

  get hasEstimate(): boolean {
    return this._estimatedHours !== undefined && this._estimatedHours > 0;
  }

  get hasActualTime(): boolean {
    return this._actualHours !== undefined && this._actualHours > 0;
  }

  get isOnTime(): boolean {
    if (!this.hasEstimate || !this.hasActualTime) return true;
    return this._actualHours! <= this._estimatedHours!;
  }

  get timeVariance(): number {
    if (!this.hasEstimate || !this.hasActualTime) return 0;
    return this._actualHours! - this._estimatedHours!;
  }

  get hasTags(): boolean {
    return this._tags.length > 0;
  }

  get isAssigned(): boolean {
    return Boolean(this._assignedTo);
  }

  get isLinkedToGoal(): boolean {
    return Boolean(this._goalUuid);
  }

  // ===== 共享验证方法 =====
  protected validateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('任务标题不能为空');
    }
    if (title.length > 200) {
      throw new Error('任务标题不能超过200个字符');
    }
  }

  protected validatePriority(priority: string): void {
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      throw new Error('无效的优先级');
    }
  }

  protected validateStatus(status: string): void {
    const validStatuses = ['todo', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error('无效的任务状态');
    }
  }

  protected validateHours(hours: number): void {
    if (hours < 0) {
      throw new Error('小时数不能为负数');
    }
    if (hours > 1000) {
      throw new Error('小时数不能超过1000');
    }
  }

  // ===== 共享辅助方法 =====
  hasTag(tag: string): boolean {
    return this._tags.includes(tag);
  }

  hasAnyTag(tags: string[]): boolean {
    return tags.some((tag) => this._tags.includes(tag));
  }

  hasAllTags(tags: string[]): boolean {
    return tags.every((tag) => this._tags.includes(tag));
  }

  // ===== 共享更新方法 =====
  protected updateVersion(): void {
    this._updatedAt = new Date();
  }

  // ===== 序列化方法 =====
  toDTO() {
    return {
      uuid: this.uuid,
      title: this._title,
      description: this._description,
      priority: this._priority,
      status: this._status,
      goalUuid: this._goalUuid,
      assignedTo: this._assignedTo,
      dueDate: this._dueDate,
      estimatedHours: this._estimatedHours,
      actualHours: this._actualHours,
      tags: [...this._tags],
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      completedAt: this._completedAt,
      // 计算属性
      isOverdue: this.isOverdue,
      timeUntilDue: this.timeUntilDue,
      duration: this.duration,
      isOnTime: this.isOnTime,
      timeVariance: this.timeVariance,
    };
  }

  // ===== 抽象方法（由子类实现）=====
  abstract start(): void;
  abstract complete(): void;
  abstract cancel(): void;
  abstract updateTitle(newTitle: string): void;
  abstract updatePriority(newPriority: 'low' | 'medium' | 'high' | 'urgent'): void;
  abstract addTag(tag: string): void;
  abstract removeTag(tag: string): void;
}
