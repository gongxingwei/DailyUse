import { AggregateRoot } from '@dailyuse/utils';

/**
 * Goal核心基类 - 包含共享属性和基础计算
 */
export abstract class GoalCore extends AggregateRoot {
  protected _name: string;
  protected _description?: string;
  protected _color: string;
  protected _dirUuid?: string;
  protected _startTime: Date;
  protected _endTime: Date;
  protected _note?: string;
  protected _status: 'active' | 'completed' | 'paused' | 'archived';
  protected _createdAt: Date;
  protected _updatedAt: Date;
  protected _version: number;

  constructor(params: {
    uuid?: string;
    name: string;
    description?: string;
    color: string;
    dirUuid?: string;
    startTime?: Date;
    endTime?: Date;
    note?: string;
    status?: 'active' | 'completed' | 'paused' | 'archived';
    createdAt?: Date;
    updatedAt?: Date;
    version?: number;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());
    const now = new Date();

    this._name = params.name || '';
    this._description = params.description;
    this._color = params.color || '#FF5733';
    this._dirUuid = params.dirUuid;
    this._startTime = params.startTime || now;
    this._endTime = params.endTime || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30天后
    this._note = params.note;
    this._status = params.status || 'active';
    this._createdAt = params.createdAt || now;
    this._updatedAt = params.updatedAt || now;
    this._version = params.version || 0;
  }

  // ===== 共享只读属性 =====
  get name(): string {
    return this._name;
  }
  get description(): string | undefined {
    return this._description;
  }
  get color(): string {
    return this._color;
  }
  get dirUuid(): string | undefined {
    return this._dirUuid;
  }
  get startTime(): Date {
    return this._startTime;
  }
  get endTime(): Date {
    return this._endTime;
  }
  get note(): string | undefined {
    return this._note;
  }
  get status(): 'active' | 'completed' | 'paused' | 'archived' {
    return this._status;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }
  get version(): number {
    return this._version;
  }

  // ===== 共享计算属性 =====
  get duration(): number {
    return this._endTime.getTime() - this._startTime.getTime();
  }

  get durationInDays(): number {
    return Math.ceil(this.duration / (1000 * 60 * 60 * 24));
  }

  get isActive(): boolean {
    return this._status === 'active';
  }

  get isCompleted(): boolean {
    return this._status === 'completed';
  }

  get isPaused(): boolean {
    return this._status === 'paused';
  }

  get isArchived(): boolean {
    return this._status === 'archived';
  }

  get isOverdue(): boolean {
    return new Date() > this._endTime && this._status === 'active';
  }

  get timeRemaining(): number {
    const now = new Date();
    return Math.max(0, this._endTime.getTime() - now.getTime());
  }

  get daysRemaining(): number {
    return Math.ceil(this.timeRemaining / (1000 * 60 * 60 * 24));
  }

  // ===== 共享验证方法 =====
  protected validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('目标名称不能为空');
    }
    if (name.length > 100) {
      throw new Error('目标名称不能超过100个字符');
    }
  }

  protected validateTimeRange(startTime: Date, endTime: Date): void {
    if (startTime.getTime() >= endTime.getTime()) {
      throw new Error('开始时间必须早于结束时间');
    }
  }

  protected validateColor(color: string): void {
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!colorRegex.test(color)) {
      throw new Error('颜色格式不正确');
    }
  }

  // ===== 共享辅助方法 =====
  protected updateVersion(): void {
    this._version++;
    this._updatedAt = new Date();
  }

  // ===== 序列化方法 =====
  toDTO() {
    return {
      uuid: this.uuid,
      name: this._name,
      description: this._description,
      color: this._color,
      dirUuid: this._dirUuid,
      startTime: this._startTime,
      endTime: this._endTime,
      note: this._note,
      status: this._status,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      version: this._version,
      // 计算属性
      duration: this.duration,
      durationInDays: this.durationInDays,
      isOverdue: this.isOverdue,
      timeRemaining: this.timeRemaining,
      daysRemaining: this.daysRemaining,
    };
  }

  // ===== 抽象方法（由子类实现）=====
  abstract pause(): void;
  abstract activate(): void;
  abstract complete(): void;
  abstract archive(): void;
}
