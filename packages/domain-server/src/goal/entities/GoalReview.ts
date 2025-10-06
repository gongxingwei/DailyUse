import { AggregateRoot } from '@dailyuse/utils';
import { Goal, GoalContracts } from '@dailyuse/contracts';

type IGoalReview = GoalContracts.IGoalReview;
type GoalReviewType = GoalContracts.GoalReviewType;
type GoalReviewPersistenceDTO = GoalContracts.GoalReviewPersistenceDTO;
const GoalReviewType = GoalContracts.GoalReviewType;
/**
 * 服务端 GoalReview 实体
 * 实现目标复盘的服务端业务逻辑
 */
export class GoalReview extends AggregateRoot implements IGoalReview {
  private _goalUuid: string;
  private _title: string;
  private _type: GoalReviewType;
  private _reviewDate: Date;
  private _content: {
    achievements: string;
    challenges: string;
    learnings: string;
    nextSteps: string;
    adjustments?: string;
  };
  private _snapshot: {
    snapshotDate: Date;
    overallProgress: number;
    weightedProgress: number;
    completedKeyResults: number;
    totalKeyResults: number;
    keyResultsSnapshot: Array<{
      uuid: string;
      name: string;
      progress: number;
      currentValue: number;
      targetValue: number;
    }>;
  };
  private _rating: {
    progressSatisfaction: number;
    executionEfficiency: number;
    goalReasonableness: number;
  };
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(params: {
    uuid?: string;
    goalUuid: string;
    title: string;
    type?: GoalContracts.GoalReviewType;
    reviewDate?: Date;
    content: {
      achievements: string;
      challenges: string;
      learnings: string;
      nextSteps: string;
      adjustments?: string;
    };
    snapshot: {
      snapshotDate: Date;
      overallProgress: number;
      weightedProgress: number;
      completedKeyResults: number;
      totalKeyResults: number;
      keyResultsSnapshot: Array<{
        uuid: string;
        name: string;
        progress: number;
        currentValue: number;
        targetValue: number;
      }>;
    };
    rating?: {
      progressSatisfaction: number;
      executionEfficiency: number;
      goalReasonableness: number;
    };
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());
    const now = new Date();

    this._goalUuid = params.goalUuid;
    this._title = params.title;
    this._type = params.type || GoalContracts.GoalReviewType.CUSTOM;
    this._reviewDate = params.reviewDate || now;
    this._content = params.content;
    this._snapshot = params.snapshot;
    this._rating = params.rating || {
      progressSatisfaction: 5,
      executionEfficiency: 5,
      goalReasonableness: 5,
    };
    this._createdAt = params.createdAt || now;
    this._updatedAt = params.updatedAt || now;
  }

  // ===== 实现接口属性 =====
  get goalUuid(): string {
    return this._goalUuid;
  }

  get title(): string {
    return this._title;
  }

  get type(): IGoalReview['type'] {
    return this._type;
  }

  get reviewDate(): Date {
    return this._reviewDate;
  }

  get content(): {
    achievements: string;
    challenges: string;
    learnings: string;
    nextSteps: string;
    adjustments?: string;
  } {
    return this._content;
  }

  get snapshot(): {
    snapshotDate: Date;
    overallProgress: number;
    weightedProgress: number;
    completedKeyResults: number;
    totalKeyResults: number;
    keyResultsSnapshot: Array<{
      uuid: string;
      name: string;
      progress: number;
      currentValue: number;
      targetValue: number;
    }>;
  } {
    return this._snapshot;
  }

  get rating(): {
    progressSatisfaction: number;
    executionEfficiency: number;
    goalReasonableness: number;
  } {
    return this._rating;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ===== 计算属性 =====
  get overallRating(): number {
    const total =
      this._rating.progressSatisfaction +
      this._rating.executionEfficiency +
      this._rating.goalReasonableness;
    return Math.round((total / 3) * 10) / 10;
  }

  get isPositiveReview(): boolean {
    return this.overallRating >= 7;
  }

  // ===== 业务方法 =====

  /**
   * 更新复盘（实体内部方法）
   * 封装自身的更新逻辑和验证
   */
  update(updates: {
    title?: string;
    content?: {
      achievements?: string;
      challenges?: string;
      learnings?: string;
      nextSteps?: string;
      adjustments?: string;
    };
    rating?: {
      progressSatisfaction?: number;
      executionEfficiency?: number;
      goalReasonableness?: number;
    };
  }): void {
    if (updates.title !== undefined) {
      if (!updates.title.trim()) {
        throw new Error('复盘标题不能为空');
      }
      if (updates.title.length > 200) {
        throw new Error('复盘标题不能超过200个字符');
      }
      this._title = updates.title;
    }

    if (updates.content) {
      this.updateContent(updates.content);
    }

    if (updates.rating) {
      this.updateRating(updates.rating);
    }

    this._updatedAt = new Date();
  }

  /**
   * 更新复盘内容
   */
  updateContent(content: {
    achievements?: string;
    challenges?: string;
    learnings?: string;
    nextSteps?: string;
    adjustments?: string;
  }): void {
    this._content = {
      ...this._content,
      ...content,
    };
    this._updatedAt = new Date();

    // 触发领域事件
    this.addDomainEvent({
      eventType: 'GoalReviewUpdated',
      aggregateId: this._goalUuid,
      occurredOn: new Date(),
      payload: {
        goalUuid: this._goalUuid,
        reviewUuid: this.uuid,
        changes: content,
      },
    });
  }

  /**
   * 更新评分
   */
  updateRating(rating: {
    progressSatisfaction?: number;
    executionEfficiency?: number;
    goalReasonableness?: number;
  }): void {
    // 验证评分范围
    Object.values(rating).forEach((score) => {
      if (score !== undefined && (score < 1 || score > 10)) {
        throw new Error('评分必须在1-10之间');
      }
    });

    this._rating = {
      ...this._rating,
      ...rating,
    };
    this._updatedAt = new Date();

    // 触发领域事件
    this.addDomainEvent({
      eventType: 'GoalReviewRatingUpdated',
      aggregateId: this._goalUuid,
      occurredOn: new Date(),
      payload: {
        goalUuid: this._goalUuid,
        reviewUuid: this.uuid,
        newRating: this._rating,
        overallRating: this.overallRating,
      },
    });
  }

  /**
   * 验证复盘数据
   */
  validate(): void {
    if (!this._title || this._title.trim().length === 0) {
      throw new Error('复盘标题不能为空');
    }

    if (this._title.length > 200) {
      throw new Error('复盘标题不能超过200个字符');
    }

    if (!this._content.achievements && !this._content.challenges && !this._content.learnings) {
      throw new Error('复盘内容不能完全为空');
    }

    // 验证评分范围
    Object.values(this._rating).forEach((score) => {
      if (score < 1 || score > 10) {
        throw new Error('评分必须在1-10之间');
      }
    });
  }

  // ===== 序列化方法 =====
  static fromDTO(dto: GoalContracts.GoalReviewDTO): GoalReview {
    return new GoalReview({
      uuid: dto.uuid,
      goalUuid: dto.goalUuid,
      title: dto.title,
      type: dto.type,
      reviewDate: new Date(dto.reviewDate),
      content: dto.content,
      snapshot: {
        ...dto.snapshot,
        snapshotDate: new Date(dto.snapshot.snapshotDate),
      },
      rating: dto.rating,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  toDTO(): GoalContracts.GoalReviewDTO {
    return {
      uuid: this.uuid,
      goalUuid: this._goalUuid,
      title: this._title,
      type: this._type,
      reviewDate: this._reviewDate.getTime(),
      content: this._content,
      snapshot: {
        ...this._snapshot,
        snapshotDate: this._snapshot.snapshotDate.getTime(),
      },
      rating: this._rating,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
    };
  }

  toClient(): GoalContracts.GoalReviewClientDTO {
    const dto = this.toDTO();
    return {
      ...dto,
      overallRating: this.overallRating,
      isPositiveReview: this.isPositiveReview,
    };
  }

  // ===== 持久化转换方法 =====

  /**
   * 转换为持久化 DTO（扁平化存储）
   */
  toPersistence(): GoalReviewPersistenceDTO {
    return {
      uuid: this.uuid,
      goalUuid: this._goalUuid,
      // 评审信息
      title: this._title,
      type: this._type,
      reviewDate: this._reviewDate,
      content: JSON.stringify(this._content), // 序列化为 JSON
      rating: JSON.stringify(this._rating), // 序列化为 JSON
      snapshot: JSON.stringify(this._snapshot), // 序列化为 JSON
      // 生命周期
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  /**
   * 从持久化 DTO 创建实例
   */
  static fromPersistence(data: GoalReviewPersistenceDTO): GoalReview {
    // 确保日期字段是 Date 对象
    const reviewDate =
      data.reviewDate instanceof Date ? data.reviewDate : new Date(data.reviewDate);
    const createdAt = data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt);
    const updatedAt = data.updatedAt instanceof Date ? data.updatedAt : new Date(data.updatedAt);

    // 解析 snapshot 并确保其中的日期也是 Date 对象
    const parsedSnapshot =
      typeof data.snapshot === 'string' ? JSON.parse(data.snapshot) : data.snapshot;
    const snapshotDate =
      parsedSnapshot.snapshotDate instanceof Date
        ? parsedSnapshot.snapshotDate
        : new Date(parsedSnapshot.snapshotDate);

    return new GoalReview({
      uuid: data.uuid,
      goalUuid: data.goalUuid,
      title: data.title,
      type: data.type,
      reviewDate: reviewDate,
      content: typeof data.content === 'string' ? JSON.parse(data.content) : data.content,
      snapshot: {
        ...parsedSnapshot,
        snapshotDate: snapshotDate,
      },
      rating: typeof data.rating === 'string' ? JSON.parse(data.rating) : data.rating,
      createdAt: createdAt,
      updatedAt: updatedAt,
    });
  }
}
