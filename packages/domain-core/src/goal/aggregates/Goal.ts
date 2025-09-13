import { AggregateRoot } from '@dailyuse/utils';
import { type GoalContracts } from '@dailyuse/contracts';
import type { IGoal, IKeyResult, IGoalRecord, IGoalReview } from '@dailyuse/contracts';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';
import { KeyResultCore } from '../entities/KeyResult';
import { GoalRecordCore } from '../entities/GoalRecord';
import { GoalReview } from '../entities/GoalReview';

/**
 * Goal核心基类 - 包含共享属性和基础计算
 */
export abstract class GoalCore extends AggregateRoot implements IGoal {
  protected _name: string;
  protected _description?: string;
  protected _color: string;
  protected _dirUuid?: string;
  protected _startTime: Date;
  protected _endTime: Date;
  protected _note?: string;
  keyResults: KeyResultCore[];
  records: GoalRecordCore[];
  reviews: GoalReview[];
  protected _analysis: {
    motive: string;
    feasibility: string;
    importanceLevel: ImportanceLevel;
    urgencyLevel: UrgencyLevel;
  };
  protected _lifecycle: {
    createdAt: Date;
    updatedAt: Date;
    status: 'active' | 'completed' | 'paused' | 'archived';
  };
  protected _metadata: {
    tags: string[];
    category: string;
  };
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
    motive?: string;
    feasibility?: string;
    importanceLevel?: ImportanceLevel;
    urgencyLevel?: UrgencyLevel;
    status?: 'active' | 'completed' | 'paused' | 'archived';
    createdAt?: Date;
    updatedAt?: Date;
    keyResults?: IKeyResult[];
    records?: IGoalRecord[];
    reviews?: IGoalReview[];
    tags?: string[];
    category?: string;
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
    this._lifecycle = {
      createdAt: params.createdAt || now,
      updatedAt: params.updatedAt || now,
      status: params.status || 'active',
    };
    this._analysis = {
      motive: params.motive || '',
      feasibility: params.feasibility || '',
      importanceLevel: params.importanceLevel || ImportanceLevel.Moderate,
      urgencyLevel: params.urgencyLevel || UrgencyLevel.Medium,
    };
    this._metadata = {
      tags: params.tags || [],
      category: params.category || '',
    };

    // 子类需要在构造函数中自行处理实体对象的创建
    this.keyResults = [];
    this.records = [];
    this.reviews = (params.reviews || []).map((dto) => new GoalReview(dto));
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
  get analysis(): {
    motive: string;
    feasibility: string;
    importanceLevel: ImportanceLevel;
    urgencyLevel: UrgencyLevel;
  } {
    return this._analysis;
  }

  get lifecycle(): {
    createdAt: Date;
    updatedAt: Date;
    status: 'active' | 'completed' | 'paused' | 'archived';
  } {
    return this._lifecycle;
  }

  get metadata(): {
    tags: string[];
    category: string;
  } {
    return this._metadata;
  }

  get status(): 'active' | 'completed' | 'paused' | 'archived' {
    return this._lifecycle.status;
  }
  get createdAt(): Date {
    return this._lifecycle.createdAt;
  }
  get updatedAt(): Date {
    return this._lifecycle.updatedAt;
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
    return this._lifecycle.status === 'active';
  }

  get isCompleted(): boolean {
    return this._lifecycle.status === 'completed';
  }

  get isPaused(): boolean {
    return this._lifecycle.status === 'paused';
  }

  get isArchived(): boolean {
    return this._lifecycle.status === 'archived';
  }

  get isOverdue(): boolean {
    return new Date() > this._endTime && this._lifecycle.status === 'active';
  }

  get timeRemaining(): number {
    const now = new Date();
    return Math.max(0, this._endTime.getTime() - now.getTime());
  }

  get daysRemaining(): number {
    return Math.ceil(this.timeRemaining / (1000 * 60 * 60 * 24));
  }

  get overallProgress(): number {
    if (this.keyResults.length === 0) return 0;

    const totalWeight = this.keyResults.reduce((sum, kr) => sum + kr.weight, 0);
    if (totalWeight === 0) return 0;

    const weightedProgress = this.keyResults.reduce((sum, kr) => {
      const progress = Math.min(kr.currentValue / kr.targetValue, 1) * 100;
      return sum + progress * kr.weight;
    }, 0);

    return weightedProgress / totalWeight;
  }

  get weightedProgress(): number {
    return this.overallProgress;
  }

  get completedKeyResults(): number {
    return this.keyResults.filter((kr) => kr.currentValue >= kr.targetValue).length;
  }

  get totalKeyResults(): number {
    return this.keyResults.length;
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

  // ===== 共享业务方法 =====

  /**
   * 更新目标信息
   */
  updateInfo(params: {
    name?: string;
    description?: string;
    color?: string;
    dirUuid?: string;
    startTime?: Date;
    endTime?: Date;
    note?: string;
    analysis?: {
      motive?: string;
      feasibility?: string;
      importanceLevel?: ImportanceLevel;
      urgencyLevel?: UrgencyLevel;
    };
    metadata?: {
      tags?: string[];
      category?: string;
    };
  }): void {
    if (params.name !== undefined) {
      this.validateName(params.name);
      this._name = params.name;
    }

    if (params.description !== undefined) {
      this._description = params.description;
    }

    if (params.color !== undefined) {
      this.validateColor(params.color);
      this._color = params.color;
    }

    if (params.dirUuid !== undefined) {
      this._dirUuid = params.dirUuid;
    }

    if (params.startTime !== undefined || params.endTime !== undefined) {
      const newStartTime = params.startTime || this._startTime;
      const newEndTime = params.endTime || this._endTime;
      this.validateTimeRange(newStartTime, newEndTime);
      this._startTime = newStartTime;
      this._endTime = newEndTime;
    }

    if (params.note !== undefined) {
      this._note = params.note;
    }

    if (params.analysis) {
      this._analysis = {
        ...this._analysis,
        ...params.analysis,
      };
    }

    if (params.metadata) {
      this._metadata = {
        ...this._metadata,
        ...params.metadata,
      };
    }

    this.updateVersion();
  }

  /**
   * 添加关键结果（抽象方法，由子类实现）
   */
  abstract addKeyResult(keyResult: IKeyResult): void;

  /**
   * 更新关键结果进度（抽象方法，由子类实现）
   */
  abstract updateKeyResultProgress(keyResultUuid: string, increment: number, note?: string): void;

  /**
   * 添加复盘
   */
  addReview(review: IGoalReview): void {
    // 将DTO转换为实体对象
    const reviewEntity = new GoalReview(review);
    this.reviews.push(reviewEntity);
    this.updateVersion();
  }

  // ===== 共享辅助方法 =====
  protected updateVersion(): void {
    this._version++;
    this._lifecycle.updatedAt = new Date();
  }

  // ===== 序列化方法 =====
  toDTO(): GoalContracts.GoalDTO {
    return {
      uuid: this.uuid,
      name: this._name,
      description: this._description,
      color: this._color,
      dirUuid: this._dirUuid,
      startTime: this._startTime.getTime(),
      endTime: this._endTime.getTime(),
      note: this._note,
      analysis: this._analysis,
      lifecycle: {
        createdAt: this._lifecycle.createdAt.getTime(),
        updatedAt: this._lifecycle.updatedAt.getTime(),
        status: this._lifecycle.status,
      },
      metadata: this._metadata,
      version: this._version,
    };
  }

  static fromDTO(dto: GoalContracts.GoalDTO): GoalCore {
    throw new Error('Method not implemented. Use subclass implementations.');
  }

  // ===== 抽象方法（由子类实现）=====
  abstract pause(): void;
  abstract activate(): void;
  abstract complete(): void;
  abstract archive(): void;
}
