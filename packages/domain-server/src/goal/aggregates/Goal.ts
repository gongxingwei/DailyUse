import { GoalCore, GoalDirCore } from '@dailyuse/domain-core';
import {
  type GoalContracts,
  type IGoal,
  type IGoalDir,
  ImportanceLevel,
  UrgencyLevel,
} from '@dailyuse/contracts';

/**
 * 服务端 Goal 实体
 * 继承核心 Goal 类，添加服务端特有功能
 */
export class Goal extends GoalCore {
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
    keyResults?: any[];
    records?: any[];
    reviews?: any[];
    tags?: string[];
    category?: string;
    version?: number;
  }) {
    super(params);
  }

  // ===== 服务端特有方法 =====

  /**
   * 暂停目标
   */
  pause(): void {
    if (this._lifecycle.status === 'completed') {
      throw new Error('已完成的目标不能暂停');
    }
    if (this._lifecycle.status === 'archived') {
      throw new Error('已归档的目标不能暂停');
    }

    this._lifecycle.status = 'paused';
    this.updateVersion();

    // 触发领域事件
    this.addDomainEvent({
      eventType: 'GoalStatusChanged',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        accountUuid: '', // 需要从上下文获取
        goalId: this.uuid,
        oldStatus: this._lifecycle.status,
        newStatus: 'paused',
      },
    });
  }

  /**
   * 激活目标
   */
  activate(): void {
    if (this._lifecycle.status === 'completed') {
      throw new Error('已完成的目标不能重新激活');
    }

    this._lifecycle.status = 'active';
    this.updateVersion();

    // 触发领域事件
    this.addDomainEvent({
      eventType: 'GoalStatusChanged',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        accountUuid: '', // 需要从上下文获取
        goalId: this.uuid,
        oldStatus: this._lifecycle.status,
        newStatus: 'active',
      },
    });
  }

  /**
   * 完成目标
   */
  complete(): void {
    if (this._lifecycle.status === 'completed') {
      throw new Error('目标已经完成');
    }
    if (this._lifecycle.status === 'archived') {
      throw new Error('已归档的目标不能完成');
    }

    this._lifecycle.status = 'completed';
    this.updateVersion();

    // 触发领域事件
    this.addDomainEvent({
      eventType: 'GoalCompleted',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        accountUuid: '', // 需要从上下文获取
        goalId: this.uuid,
        completedAt: new Date(),
        finalProgress: this.overallProgress,
        keyResultsCompleted: this.completedKeyResults,
        totalKeyResults: this.totalKeyResults,
      },
    });
  }

  /**
   * 归档目标
   */
  archive(): void {
    this._lifecycle.status = 'archived';
    this.updateVersion();

    // 触发领域事件
    this.addDomainEvent({
      eventType: 'GoalStatusChanged',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        accountUuid: '', // 需要从上下文获取
        goalId: this.uuid,
        oldStatus: this._lifecycle.status,
        newStatus: 'archived',
      },
    });
  }

  /**
   * 检查是否可以删除
   */
  canDelete(): boolean {
    // 只有草稿状态或者已归档的目标可以删除
    return this._lifecycle.status === 'archived';
  }

  /**
   * 删除目标
   */
  delete(): void {
    if (!this.canDelete()) {
      throw new Error('只有已归档的目标可以删除');
    }

    // 触发领域事件
    this.addDomainEvent({
      eventType: 'GoalDeleted',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        accountUuid: '', // 需要从上下文获取
        goalId: this.uuid,
        name: this._name,
      },
    });
  }

  /**
   * 服务端特有的验证规则
   */
  validateForPersistence(): void {
    this.validateName(this._name);
    this.validateTimeRange(this._startTime, this._endTime);
    this.validateColor(this._color);

    // 服务端特有验证
    if (this.keyResults.length === 0) {
      throw new Error('目标必须至少包含一个关键结果');
    }

    const totalWeight = this.keyResults.reduce((sum, kr) => sum + kr.weight, 0);
    if (totalWeight > 100) {
      throw new Error('关键结果权重总和不能超过100%');
    }
  }

  // ===== 序列化方法 =====

  static fromDTO(dto: GoalContracts.GoalDTO): Goal {
    return new Goal({
      uuid: dto.uuid,
      name: dto.name,
      description: dto.description,
      color: dto.color,
      dirUuid: dto.dirUuid,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      note: dto.note,
      motive: dto.analysis.motive,
      feasibility: dto.analysis.feasibility,
      status: dto.lifecycle.status,
      createdAt: new Date(dto.lifecycle.createdAt),
      updatedAt: new Date(dto.lifecycle.updatedAt),
      version: dto.version,
    });
  }

  toResponse(): GoalContracts.GoalResponse {
    const baseDTO = this.toDTO();

    return {
      ...baseDTO,
      keyResults: this.keyResults.map((kr) => ({
        uuid: kr.uuid,
        accountUuid: kr.accountUuid,
        goalUuid: kr.goalUuid,
        name: kr.name,
        description: kr.description,
        startValue: kr.startValue,
        targetValue: kr.targetValue,
        currentValue: kr.currentValue,
        unit: kr.unit,
        weight: kr.weight,
        calculationMethod: kr.calculationMethod,
        lifecycle: {
          createdAt: kr.lifecycle.createdAt.getTime(),
          updatedAt: kr.lifecycle.updatedAt.getTime(),
          status: kr.lifecycle.status,
        },
        progress: Math.min((kr.currentValue / kr.targetValue) * 100, 100),
        isCompleted: kr.currentValue >= kr.targetValue,
      })),
      records: this.records.map((record) => ({
        uuid: record.uuid,
        accountUuid: record.accountUuid,
        goalUuid: record.goalUuid,
        keyResultUuid: record.keyResultUuid,
        value: record.value,
        note: record.note,
        createdAt: record.createdAt.getTime(),
      })),
      reviews: this.reviews.map((review) => ({
        uuid: review.uuid,
        goalUuid: review.goalUuid,
        title: review.title,
        type: review.type,
        reviewDate: review.reviewDate.getTime(),
        content: review.content,
        snapshot: {
          ...review.snapshot,
          snapshotDate: review.snapshot.snapshotDate.getTime(),
        },
        rating: review.rating,
        createdAt: review.createdAt.getTime(),
        updatedAt: review.updatedAt.getTime(),
      })),
      analytics: {
        overallProgress: this.overallProgress,
        weightedProgress: this.weightedProgress,
        completedKeyResults: this.completedKeyResults,
        totalKeyResults: this.totalKeyResults,
        daysRemaining: this.daysRemaining,
        isOverdue: this.isOverdue,
      },
    };
  }
}

/**
 * 服务端 GoalDir 实体
 * 继承核心 GoalDir 类，添加服务端特有功能
 */
export class GoalDir extends GoalDirCore {
  constructor(params: {
    uuid?: string;
    accountUuid: string;
    name: string;
    description?: string;
    icon: string;
    color: string;
    parentUuid?: string;
    sortConfig?: {
      sortKey: string;
      sortOrder: number;
    };
    status?: 'active' | 'archived';
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super(params);
  }

  // ===== 服务端特有方法 =====

  /**
   * 归档目录
   */
  archive(): void {
    this._lifecycle.status = 'archived';
    this._lifecycle.updatedAt = new Date();

    // 触发领域事件
    this.addDomainEvent({
      eventType: 'GoalDirUpdated',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        accountUuid: '', // 需要从上下文获取
        goalDirId: this.uuid,
        changes: {
          // status: 'archived' // 如果需要的话
        },
      },
    });
  }

  /**
   * 激活目录
   */
  activate(): void {
    this._lifecycle.status = 'active';
    this._lifecycle.updatedAt = new Date();

    // 触发领域事件
    this.addDomainEvent({
      eventType: 'GoalDirUpdated',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        accountUuid: '', // 需要从上下文获取
        goalDirId: this.uuid,
        changes: {
          // status: 'active' // 如果需要的话
        },
      },
    });
  }

  /**
   * 检查是否可以删除
   */
  canDelete(): boolean {
    // 系统目录不能删除
    if (this.uuid.startsWith('system_')) {
      return false;
    }

    return this._lifecycle.status === 'archived';
  }

  /**
   * 删除目录
   */
  delete(): void {
    if (!this.canDelete()) {
      throw new Error('只有已归档的非系统目录可以删除');
    }

    // 触发领域事件
    this.addDomainEvent({
      eventType: 'GoalDirDeleted',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        accountUuid: '', // 需要从上下文获取
        goalDirId: this.uuid,
        name: this._name,
      },
    });
  }

  // ===== 序列化方法 =====

  static fromDTO(dto: GoalContracts.GoalDirDTO): GoalDir {
    return new GoalDir({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      name: dto.name,
      description: dto.description,
      icon: dto.icon,
      color: dto.color,
      parentUuid: dto.parentUuid,
      sortConfig: dto.sortConfig,
      status: dto.lifecycle.status,
      createdAt: new Date(dto.lifecycle.createdAt),
      updatedAt: new Date(dto.lifecycle.updatedAt),
    });
  }

  toResponse(goalsCount: number = 0): GoalContracts.GoalDirResponse {
    const baseDTO = this.toDTO();

    return {
      ...baseDTO,
      goalsCount,
    };
  }
}
