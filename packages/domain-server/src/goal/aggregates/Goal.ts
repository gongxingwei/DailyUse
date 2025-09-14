import { GoalCore } from '@dailyuse/domain-core';
import {
  type GoalContracts,
  type IGoal,
  type IGoalDir,
  type IKeyResult,
  type IGoalRecord,
  type IGoalReview,
  ImportanceLevel,
  UrgencyLevel,
} from '@dailyuse/contracts';
import { KeyResult } from '../entities/KeyResult';
import { GoalRecord } from '../entities/GoalRecord';
import { GoalReview } from '../entities/GoalReview';

/**
 * 服务端 Goal 实体
 * 继承核心 Goal 类，添加服务端特有功能
 */
export class Goal extends GoalCore {
  public readonly accountUuid: string; // 添加账户UUID属性

  constructor(params: {
    uuid?: string;
    accountUuid: string; // 添加到构造函数参数
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
    keyResults?: KeyResult[];
    records?: GoalRecord[];
    reviews?: GoalReview[];
    tags?: string[];
    category?: string;
    version?: number;
  }) {
    super(params);

    this.accountUuid = params.accountUuid; // 设置账户UUID

    // 服务端特有的实体创建逻辑
    this.keyResults = params.keyResults || [];
    this.records = params.records || [];
    this.reviews = params.reviews || [];
  }

  // ===== 抽象方法实现 =====

  /**
   * 创建KeyResult实体（服务端实现）
   */
  protected createKeyResultEntity(dto: any): KeyResult {
    if (dto.lifecycle && dto.lifecycle.createdAt instanceof Date) {
      const convertedDto: GoalContracts.KeyResultDTO = {
        ...dto,
        lifecycle: {
          ...dto.lifecycle,
          createdAt: dto.lifecycle.createdAt.getTime(),
          updatedAt: dto.lifecycle.updatedAt.getTime(),
        },
      };
      return KeyResult.fromDTO(convertedDto);
    }
    return KeyResult.fromDTO(dto);
  }

  /**
   * 创建GoalRecord实体（服务端实现）
   */
  protected createGoalRecordEntity(dto: any): GoalRecord {
    if (dto.createdAt instanceof Date) {
      const convertedDto: GoalContracts.GoalRecordDTO = {
        ...dto,
        createdAt: dto.createdAt.getTime(),
      };
      return GoalRecord.fromDTO(convertedDto) as GoalRecord;
    }
    return GoalRecord.fromDTO(dto) as GoalRecord;
  }

  /**
   * 添加关键结果（服务端实现）
   */
  addKeyResult(keyResult: IKeyResult): void {
    // 验证权重总和不超过100
    const totalWeight = this.keyResults.reduce((sum, kr) => sum + kr.weight, 0) + keyResult.weight;
    if (totalWeight > 100) {
      throw new Error('关键结果权重总和不能超过100%');
    }

    // 转换为 DTO 格式再调用 fromDTO
    const keyResultDTO: GoalContracts.KeyResultDTO = {
      uuid: keyResult.uuid,
      accountUuid: keyResult.accountUuid,
      goalUuid: keyResult.goalUuid,
      name: keyResult.name,
      description: keyResult.description,
      startValue: keyResult.startValue,
      targetValue: keyResult.targetValue,
      currentValue: keyResult.currentValue,
      unit: keyResult.unit,
      weight: keyResult.weight,
      calculationMethod: keyResult.calculationMethod,
      lifecycle: {
        createdAt: keyResult.lifecycle.createdAt.getTime(),
        updatedAt: keyResult.lifecycle.updatedAt.getTime(),
        status: keyResult.lifecycle.status,
      },
    };

    const keyResultEntity = KeyResult.fromDTO(keyResultDTO);
    this.keyResults.push(keyResultEntity);
    this.updateVersion();

    // 发布服务端领域事件
    this.addDomainEvent({
      eventType: 'KeyResultCreated',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        goalUuid: this.uuid,
        keyResultUuid: keyResult.uuid,
        keyResult: keyResultEntity.toDTO({ accountUuid: this.accountUuid }),
      },
    });
  }

  /**
   * 更新关键结果进度（服务端实现）
   */
  updateKeyResultProgress(keyResultUuid: string, increment: number, note?: string): void {
    const keyResult = this.keyResults.find((kr) => kr.uuid === keyResultUuid);
    if (!keyResult) {
      throw new Error('关键结果不存在');
    }

    // 使用实体的业务方法更新进度
    keyResult.updateProgress(increment, 'increment');

    // 创建记录 DTO
    const now = new Date();
    const recordDTO: GoalContracts.GoalRecordDTO = {
      uuid: this.generateUUID(),
      accountUuid: this.accountUuid, // 添加账户UUID
      goalUuid: this.uuid, // 添加目标UUID
      keyResultUuid,
      value: increment,
      note,
      createdAt: now.getTime(),
    };

    // 使用 fromDTO 创建实体对象
    const recordEntity = GoalRecord.fromDTO(recordDTO) as GoalRecord;
    this.records.push(recordEntity);
    this.updateVersion();

    // 发布服务端领域事件
    this.addDomainEvent({
      eventType: 'KeyResultProgressUpdated',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        goalUuid: this.uuid,
        keyResultUuid,
        increment,
        newProgress: keyResult.currentValue,
        recordUuid: recordEntity.uuid,
      },
    });
  }

  // ===== DDD聚合根控制模式 - 服务端业务方法 =====

  /**
   * 创建并添加关键结果（服务端业务方法）
   */
  createKeyResult(keyResultData: {
    accountUuid: string;
    name: string;
    description?: string;
    startValue?: number;
    targetValue: number;
    currentValue?: number;
    unit: string;
    weight: number;
    calculationMethod?: 'sum' | 'average' | 'max' | 'min' | 'custom';
  }): string {
    // 业务规则验证
    if (!keyResultData.name.trim()) {
      throw new Error('关键结果名称不能为空');
    }

    if (keyResultData.weight <= 0 || keyResultData.weight > 100) {
      throw new Error('关键结果权重必须在1-100%之间');
    }

    // 检查权重限制
    const totalWeight = this.keyResults.reduce((sum, kr) => sum + kr.weight, 0);
    if (totalWeight + keyResultData.weight > 100) {
      throw new Error(`关键结果权重总和不能超过100%，当前总和: ${totalWeight}%`);
    }

    // 创建关键结果
    const keyResultUuid = this.generateUUID();
    const now = new Date();

    const keyResult = new KeyResult({
      uuid: keyResultUuid,
      accountUuid: keyResultData.accountUuid,
      goalUuid: this.uuid,
      name: keyResultData.name,
      description: keyResultData.description,
      startValue: keyResultData.startValue || 0,
      targetValue: keyResultData.targetValue,
      currentValue: keyResultData.currentValue || 0,
      unit: keyResultData.unit,
      weight: keyResultData.weight,
      calculationMethod: keyResultData.calculationMethod || 'sum',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });

    // 添加到聚合
    this.keyResults.push(keyResult);
    this.updateVersion();

    // 发布领域事件
    this.addDomainEvent({
      eventType: 'KeyResultCreated',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        goalUuid: this.uuid,
        keyResultUuid: keyResultUuid,
        keyResult: keyResult.toDTO({ accountUuid: this.accountUuid }),
      },
    });

    return keyResultUuid;
  }

  /**
   * 更新关键结果（服务端）
   */
  updateKeyResult(
    keyResultUuid: string,
    updates: {
      name?: string;
      description?: string;
      targetValue?: number;
      unit?: string;
      weight?: number;
      calculationMethod?: 'sum' | 'average' | 'max' | 'min' | 'custom';
    },
  ): void {
    const keyResultIndex = this.keyResults.findIndex((kr) => kr.uuid === keyResultUuid);
    if (keyResultIndex === -1) {
      throw new Error(`关键结果不存在: ${keyResultUuid}`);
    }

    const keyResult = this.keyResults[keyResultIndex];
    const originalData = keyResult.toDTO({ accountUuid: this.accountUuid });

    // 权重验证
    if (updates.weight !== undefined) {
      const otherWeight = this.keyResults
        .filter((kr) => kr.uuid !== keyResultUuid)
        .reduce((sum, kr) => sum + kr.weight, 0);

      if (otherWeight + updates.weight > 100) {
        throw new Error(`关键结果权重总和不能超过100%，当前其他权重总和: ${otherWeight}%`);
      }
    }

    // 创建新的关键结果实体（简化的更新方式）
    const updatedKeyResult = new KeyResult({
      uuid: keyResult.uuid,
      accountUuid: keyResult.accountUuid,
      goalUuid: keyResult.goalUuid,
      name: updates.name !== undefined ? updates.name : keyResult.name,
      description: updates.description !== undefined ? updates.description : keyResult.description,
      startValue: keyResult.startValue,
      targetValue: updates.targetValue !== undefined ? updates.targetValue : keyResult.targetValue,
      currentValue: keyResult.currentValue,
      unit: updates.unit !== undefined ? updates.unit : keyResult.unit,
      weight: updates.weight !== undefined ? updates.weight : keyResult.weight,
      calculationMethod:
        updates.calculationMethod !== undefined
          ? updates.calculationMethod
          : keyResult.calculationMethod,
      status: keyResult.lifecycle.status,
      createdAt: keyResult.lifecycle.createdAt,
      updatedAt: new Date(),
    });

    // 替换聚合中的实体
    this.keyResults[keyResultIndex] = updatedKeyResult;
    this.updateVersion();

    // 发布领域事件
    this.addDomainEvent({
      eventType: 'KeyResultUpdated',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        goalUuid: this.uuid,
        keyResultUuid,
        originalData,
        updatedData: updatedKeyResult.toDTO({ accountUuid: this.accountUuid }),
        changes: updates,
      },
    });
  }

  /**
   * 删除关键结果（服务端）
   */
  removeKeyResult(keyResultUuid: string): void {
    const keyResultIndex = this.keyResults.findIndex((kr) => kr.uuid === keyResultUuid);
    if (keyResultIndex === -1) {
      throw new Error(`关键结果不存在: ${keyResultUuid}`);
    }

    const keyResult = this.keyResults[keyResultIndex];

    // 级联删除相关记录
    const relatedRecords = this.records.filter((record) => record.keyResultUuid === keyResultUuid);
    this.records = this.records.filter((record) => record.keyResultUuid !== keyResultUuid);

    // 从聚合中移除
    this.keyResults.splice(keyResultIndex, 1);
    this.updateVersion();

    // 发布领域事件
    this.addDomainEvent({
      eventType: 'KeyResultRemoved',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        goalUuid: this.uuid,
        keyResultUuid,
        removedKeyResult: keyResult.toDTO({ accountUuid: this.accountUuid }),
        cascadeDeletedRecordsCount: relatedRecords.length,
      },
    });
  }

  /**
   * 创建目标记录（服务端）
   */
  createRecord(recordData: {
    accountUuid: string;
    keyResultUuid: string;
    value: number;
    note?: string;
  }): string {
    // 验证关键结果存在
    const keyResult = this.keyResults.find((kr) => kr.uuid === recordData.keyResultUuid);
    if (!keyResult) {
      throw new Error(`关键结果不存在: ${recordData.keyResultUuid}`);
    }

    // 创建记录实体
    const recordUuid = this.generateUUID();
    const now = new Date();

    const newRecord = new GoalRecord({
      uuid: recordUuid,
      accountUuid: recordData.accountUuid,
      goalUuid: this.uuid,
      keyResultUuid: recordData.keyResultUuid,
      value: recordData.value,
      note: recordData.note,
      createdAt: now,
    });

    // 添加到聚合
    this.records.push(newRecord);

    // 更新关键结果当前值
    keyResult.updateProgress(recordData.value, 'set');
    this.updateVersion();

    // 发布领域事件
    this.addDomainEvent({
      eventType: 'GoalRecordCreated',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        goalUuid: this.uuid,
        recordUuid,
        record: newRecord.toDTO({ accountUuid: this.accountUuid, goalUuid: this.uuid }),
        keyResultUpdated: true,
      },
    });

    return recordUuid;
  }

  /**
   * 更新目标记录（服务端）
   */
  updateRecord(recordUuid: string, updates: { value?: number; note?: string }): void {
    const record = this.records.find((r) => r.uuid === recordUuid);
    if (!record) {
      throw new Error(`目标记录不存在: ${recordUuid}`);
    }

    const originalData = record.toDTO({ accountUuid: this.accountUuid, goalUuid: this.uuid });

    // 使用实体的业务方法应用更新
    if (updates.value !== undefined) {
      record.updateValue(updates.value);
    }
    if (updates.note !== undefined) {
      record.updateNote(updates.note);
    }

    // 同步更新关键结果
    if (updates.value !== undefined && record.keyResultUuid) {
      const keyResult = this.keyResults.find((kr) => kr.uuid === record.keyResultUuid);
      if (keyResult) {
        keyResult.updateProgress(updates.value, 'set');
      }
    }

    this.updateVersion();

    this.addDomainEvent({
      eventType: 'GoalRecordUpdated',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        goalUuid: this.uuid,
        recordUuid,
        originalData,
        updatedData: record.toDTO({ accountUuid: this.accountUuid, goalUuid: this.uuid }),
        changes: updates,
      },
    });
  }

  /**
   * 删除目标记录（服务端）
   */
  removeRecord(recordUuid: string): void {
    const recordIndex = this.records.findIndex((r) => r.uuid === recordUuid);
    if (recordIndex === -1) {
      throw new Error(`目标记录不存在: ${recordUuid}`);
    }

    const record = this.records[recordIndex];
    this.records.splice(recordIndex, 1);
    this.updateVersion();

    this.addDomainEvent({
      eventType: 'GoalRecordRemoved',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        goalUuid: this.uuid,
        recordUuid,
        removedRecord: record.toDTO({ accountUuid: this.accountUuid, goalUuid: this.uuid }),
      },
    });
  }

  /**
   * 创建目标复盘（服务端）
   */
  createReview(reviewData: {
    title: string;
    type: 'weekly' | 'monthly' | 'midterm' | 'final' | 'custom';
    content: {
      achievements: string;
      challenges: string;
      learnings: string;
      nextSteps: string;
      adjustments?: string;
    };
    rating: {
      progressSatisfaction: number;
      executionEfficiency: number;
      goalReasonableness: number;
    };
    reviewDate?: Date;
  }): string {
    if (!reviewData.title.trim()) {
      throw new Error('复盘标题不能为空');
    }

    // 验证评分范围
    const { progressSatisfaction, executionEfficiency, goalReasonableness } = reviewData.rating;
    if (
      [progressSatisfaction, executionEfficiency, goalReasonableness].some(
        (score) => score < 1 || score > 10,
      )
    ) {
      throw new Error('复盘评分必须在1-10之间');
    }

    const reviewUuid = this.generateUUID();
    const now = new Date();

    // 生成当前状态快照
    const snapshot = {
      snapshotDate: now,
      overallProgress: this.overallProgress,
      weightedProgress: this.weightedProgress,
      completedKeyResults: this.completedKeyResults,
      totalKeyResults: this.totalKeyResults,
      keyResultsSnapshot: this.keyResults.map((kr) => ({
        uuid: kr.uuid,
        name: kr.name,
        progress: Math.min((kr.currentValue / kr.targetValue) * 100, 100),
        currentValue: kr.currentValue,
        targetValue: kr.targetValue,
      })),
    };

    const newReview = new GoalReview({
      uuid: reviewUuid,
      goalUuid: this.uuid,
      title: reviewData.title,
      type: reviewData.type,
      reviewDate: reviewData.reviewDate || now,
      content: reviewData.content,
      snapshot,
      rating: reviewData.rating,
      createdAt: now,
      updatedAt: now,
    });

    // 添加到聚合
    this.reviews.push(newReview);
    this.updateVersion();

    this.addDomainEvent({
      eventType: 'GoalReviewCreated',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        goalUuid: this.uuid,
        reviewUuid,
        review: newReview.toDTO(),
      },
    });

    return reviewUuid;
  }

  /**
   * 更新目标复盘（服务端）
   */
  updateReview(
    reviewUuid: string,
    updates: {
      title?: string;
      content?: Partial<IGoalReview['content']>;
      rating?: Partial<IGoalReview['rating']>;
    },
  ): void {
    const reviewIndex = this.reviews.findIndex((r) => r.uuid === reviewUuid);
    if (reviewIndex === -1) {
      throw new Error(`目标复盘不存在: ${reviewUuid}`);
    }

    const review = this.reviews[reviewIndex];
    if (updates.title !== undefined && !updates.title.trim()) {
      throw new Error('复盘标题不能为空');
    }

    const originalData = (review as any).toDTO(); // 临时解决类型问题

    // 创建新的复盘实体（简化的更新方式）
    const updatedReview = new GoalReview({
      uuid: review.uuid,
      goalUuid: review.goalUuid,
      title: updates.title !== undefined ? updates.title : review.title,
      type: review.type,
      reviewDate: review.reviewDate,
      content:
        updates.content !== undefined ? { ...review.content, ...updates.content } : review.content,
      snapshot: review.snapshot,
      rating:
        updates.rating !== undefined ? { ...review.rating, ...updates.rating } : review.rating,
      createdAt: review.createdAt,
      updatedAt: new Date(),
    });

    // 替换聚合中的实体
    this.reviews[reviewIndex] = updatedReview;
    this.updateVersion();

    this.addDomainEvent({
      eventType: 'GoalReviewUpdated',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        goalUuid: this.uuid,
        reviewUuid,
        originalData,
        updatedData: updatedReview.toDTO(),
        changes: updates,
      },
    });
  }

  /**
   * 删除目标复盘（服务端）
   */
  removeReview(reviewUuid: string): void {
    const reviewIndex = this.reviews.findIndex((r) => r.uuid === reviewUuid);
    if (reviewIndex === -1) {
      throw new Error(`目标复盘不存在: ${reviewUuid}`);
    }

    const review = this.reviews[reviewIndex];
    this.reviews.splice(reviewIndex, 1);
    this.updateVersion();

    this.addDomainEvent({
      eventType: 'GoalReviewRemoved',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        goalUuid: this.uuid,
        reviewUuid,
        removedReview: (review as any).toDTO(), // 临时解决类型问题
      },
    });
  }

  // ===== 辅助方法 =====

  /**
   * 生成UUID
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // ===== 查询方法（聚合根提供的查询接口）=====

  /**
   * 获取指定关键结果（返回实体对象）
   */
  getKeyResult(keyResultUuid: string): KeyResult | undefined {
    return this.keyResults.find((kr) => kr.uuid === keyResultUuid) as KeyResult | undefined;
  }

  /**
   * 获取指定关键结果的克隆版本（用于编辑）
   */
  getKeyResultForEdit(keyResultUuid: string): KeyResult | undefined {
    const keyResult = this.getKeyResult(keyResultUuid);
    if (!keyResult) return undefined;

    // 通过 fromDTO + toDTO 实现克隆
    return KeyResult.fromDTO(keyResult.toDTO({ accountUuid: this.accountUuid }));
  }

  /**
   * 获取活跃的关键结果
   */
  getActiveKeyResults(): KeyResult[] {
    return this.keyResults.filter((kr) => kr.lifecycle.status === 'active') as KeyResult[];
  }

  /**
   * 获取已完成的关键结果
   */
  getCompletedKeyResults(): KeyResult[] {
    return this.keyResults.filter((kr) => kr.lifecycle.status === 'completed') as KeyResult[];
  }

  /**
   * 获取指定目标记录（返回实体对象）
   */
  getRecord(recordUuid: string): GoalRecord | undefined {
    return this.records.find((r) => r.uuid === recordUuid) as GoalRecord | undefined;
  }

  /**
   * 获取指定关键结果的记录
   */
  getRecordsForKeyResult(keyResultUuid: string): GoalRecord[] {
    return this.records.filter((r) => r.keyResultUuid === keyResultUuid) as GoalRecord[];
  }

  /**
   * 获取最近的记录
   */
  getRecentRecords(limit: number = 10): GoalRecord[] {
    return this.records
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit) as GoalRecord[];
  }

  /**
   * 获取指定日期范围的记录
   */
  getRecordsByDateRange(startDate: Date, endDate: Date): GoalRecord[] {
    return this.records.filter((r) => {
      const recordDate = r.createdAt;
      return recordDate >= startDate && recordDate <= endDate;
    }) as GoalRecord[];
  }

  /**
   * 获取指定目标复盘（返回实体对象）
   */
  getReview(reviewUuid: string): GoalReview | undefined {
    return this.reviews.find((r) => r.uuid === reviewUuid) as GoalReview | undefined;
  }

  /**
   * 获取指定类型的复盘
   */
  getReviewsByType(type: 'weekly' | 'monthly' | 'midterm' | 'final' | 'custom'): GoalReview[] {
    return this.reviews.filter((r) => r.type === type) as GoalReview[];
  }

  /**
   * 获取最新的复盘
   */
  getLatestReview(): GoalReview | undefined {
    const sorted = this.reviews.sort((a, b) => b.reviewDate.getTime() - a.reviewDate.getTime());
    return sorted.length > 0 ? (sorted[0] as GoalReview) : undefined;
  }

  /**
   * 获取指定日期范围的复盘
   */
  getReviewsByDateRange(startDate: Date, endDate: Date): GoalReview[] {
    return this.reviews.filter((r) => {
      const reviewDate = r.reviewDate;
      return reviewDate >= startDate && reviewDate <= endDate;
    }) as GoalReview[];
  }

  // ===== 统计查询方法 =====

  /**
   * 获取关键结果统计信息
   */
  getKeyResultStats(): {
    total: number;
    active: number;
    completed: number;
    archived: number;
    averageProgress: number;
    totalWeight: number;
  } {
    const activeKRs = this.keyResults.filter((kr) => kr.lifecycle.status === 'active');
    const completedKRs = this.keyResults.filter((kr) => kr.lifecycle.status === 'completed');
    const archivedKRs = this.keyResults.filter((kr) => kr.lifecycle.status === 'archived');

    const totalProgress = this.keyResults.reduce((sum, kr) => {
      return sum + Math.min((kr.currentValue / kr.targetValue) * 100, 100);
    }, 0);

    const totalWeight = this.keyResults.reduce((sum, kr) => sum + kr.weight, 0);

    return {
      total: this.keyResults.length,
      active: activeKRs.length,
      completed: completedKRs.length,
      archived: archivedKRs.length,
      averageProgress: this.keyResults.length > 0 ? totalProgress / this.keyResults.length : 0,
      totalWeight,
    };
  }

  /**
   * 获取记录统计信息
   */
  getRecordStats(): {
    total: number;
    thisWeek: number;
    thisMonth: number;
    averageValue: number;
    totalValue: number;
  } {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const thisWeekRecords = this.records.filter((r) => r.createdAt >= oneWeekAgo);
    const thisMonthRecords = this.records.filter((r) => r.createdAt >= oneMonthAgo);

    const totalValue = this.records.reduce((sum, r) => sum + r.value, 0);

    return {
      total: this.records.length,
      thisWeek: thisWeekRecords.length,
      thisMonth: thisMonthRecords.length,
      averageValue: this.records.length > 0 ? totalValue / this.records.length : 0,
      totalValue,
    };
  }

  /**
   * 获取复盘统计信息
   */
  getReviewStats(): {
    total: number;
    byType: Record<string, number>;
    averageRating: {
      progressSatisfaction: number;
      executionEfficiency: number;
      goalReasonableness: number;
      overall: number;
    };
    latestReviewDate?: Date;
  } {
    const byType = this.reviews.reduce(
      (acc, review) => {
        acc[review.type] = (acc[review.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalProgressSatisfaction = this.reviews.reduce(
      (sum, r) => sum + r.rating.progressSatisfaction,
      0,
    );
    const totalExecutionEfficiency = this.reviews.reduce(
      (sum, r) => sum + r.rating.executionEfficiency,
      0,
    );
    const totalGoalReasonableness = this.reviews.reduce(
      (sum, r) => sum + r.rating.goalReasonableness,
      0,
    );

    const count = this.reviews.length;
    const avgProgressSatisfaction = count > 0 ? totalProgressSatisfaction / count : 0;
    const avgExecutionEfficiency = count > 0 ? totalExecutionEfficiency / count : 0;
    const avgGoalReasonableness = count > 0 ? totalGoalReasonableness / count : 0;
    const overallAvg =
      count > 0
        ? (avgProgressSatisfaction + avgExecutionEfficiency + avgGoalReasonableness) / 3
        : 0;

    const latestReview = this.getLatestReview();

    return {
      total: count,
      byType,
      averageRating: {
        progressSatisfaction: avgProgressSatisfaction,
        executionEfficiency: avgExecutionEfficiency,
        goalReasonableness: avgGoalReasonableness,
        overall: overallAvg,
      },
      latestReviewDate: latestReview?.reviewDate,
    };
  }

  // ===== 业务查询方法 =====

  /**
   * 检查是否需要关注（即将截止或进度滞后）
   */
  needsAttention(): boolean {
    // 还有3天截止但进度不足80%
    if (this.daysRemaining <= 3 && this.overallProgress < 80) {
      return true;
    }

    // 已逾期
    if (this.isOverdue) {
      return true;
    }

    // 已暂停超过7天
    if (this._lifecycle.status === 'paused') {
      const pausedDays = Math.floor(
        (new Date().getTime() - this._lifecycle.updatedAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (pausedDays > 7) {
        return true;
      }
    }

    return false;
  }

  /**
   * 获取注意事项文本
   */
  getAttentionText(): string {
    if (this.isOverdue) {
      return '目标已逾期，请及时处理';
    }

    if (this.daysRemaining <= 3 && this.overallProgress < 80) {
      return '即将截止但进度滞后，请加快推进';
    }

    if (this._lifecycle.status === 'paused') {
      const pausedDays = Math.floor(
        (new Date().getTime() - this._lifecycle.updatedAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (pausedDays > 7) {
        return `目标已暂停 ${pausedDays} 天，建议恢复或调整`;
      }
    }

    return '';
  }

  /**
   * 检查是否可以执行某个操作（业务权限控制）
   */
  canPerformAction(action: 'edit' | 'pause' | 'resume' | 'complete' | 'archive'): boolean {
    switch (action) {
      case 'edit':
        return this._lifecycle.status === 'active' || this._lifecycle.status === 'paused';
      case 'pause':
        return this._lifecycle.status === 'active';
      case 'resume':
        return this._lifecycle.status === 'paused';
      case 'complete':
        return this._lifecycle.status === 'active' || this._lifecycle.status === 'paused';
      case 'archive':
        return this._lifecycle.status === 'completed' || this._lifecycle.status === 'paused';
      default:
        return false;
    }
  }

  /**
   * 获取可用的操作列表（用于UI上下文菜单）
   */
  getAvailableActions(): Array<{
    key: string;
    label: string;
    icon?: string;
    disabled?: boolean;
  }> {
    const actions = [
      {
        key: 'edit',
        label: '编辑',
        icon: 'edit',
        disabled: !this.canPerformAction('edit'),
      },
      {
        key: 'pause',
        label: '暂停',
        icon: 'pause',
        disabled: !this.canPerformAction('pause'),
      },
      {
        key: 'resume',
        label: '恢复',
        icon: 'play',
        disabled: !this.canPerformAction('resume'),
      },
      {
        key: 'complete',
        label: '完成',
        icon: 'check',
        disabled: !this.canPerformAction('complete'),
      },
      {
        key: 'archive',
        label: '归档',
        icon: 'archive',
        disabled: !this.canPerformAction('archive'),
      },
    ];

    return actions.filter((action) => !action.disabled);
  }

  // ===== 服务端特有方法 =====

  /**
   * 获取详细的进度分析（服务端专用）
   */
  getDetailedProgressAnalysis(): {
    overallProgress: number;
    weightedProgress: number;
    calculatedProgress: number;
    healthScore: number;
    timeProgress: number;
    progressGap: number;
    keyResultAnalysis: Array<{
      uuid: string;
      name: string;
      progress: number;
      weight: number;
      contribution: number;
      status: string;
    }>;
    recommendations: string[];
  } {
    const timeProgress = this.getServerTimeProgress();
    const calculatedProgress = this.weightedProgress; // 使用现有的属性
    const progressGap = calculatedProgress - timeProgress;

    // 分析每个关键结果的贡献
    const keyResultAnalysis = this.keyResults.map((kr) => ({
      uuid: kr.uuid,
      name: kr.name,
      progress: kr.progress,
      weight: kr.weight,
      contribution: (kr.progress * kr.weight) / 100,
      status: kr.isCompleted ? 'completed' : kr.progress >= 80 ? 'nearly-completed' : 'in-progress',
    }));

    // 计算简化的健康度
    const healthScore = this.calculateServerHealthScore(calculatedProgress, timeProgress);

    // 生成建议
    const recommendations: string[] = [];

    if (progressGap < -20) {
      recommendations.push('进度明显滞后于时间，建议调整计划或增加资源投入');
    } else if (progressGap > 20) {
      recommendations.push('进度超前，可以适当放缓节奏或优化质量');
    }

    if (this.completedKeyResults === 0 && timeProgress > 30) {
      recommendations.push('尚未完成任何关键结果，需要重点关注执行力');
    }

    const lowProgressKRs = this.keyResults.filter((kr) => kr.progress < 50 && kr.weight > 20);
    if (lowProgressKRs.length > 0) {
      recommendations.push(
        `重要关键结果进度偏低：${lowProgressKRs.map((kr) => kr.name).join('、')}`,
      );
    }

    return {
      overallProgress: this.overallProgress,
      weightedProgress: this.weightedProgress,
      calculatedProgress,
      healthScore,
      timeProgress,
      progressGap,
      keyResultAnalysis,
      recommendations,
    };
  }

  /**
   * 获取时间进度（服务端实现）
   */
  private getServerTimeProgress(): number {
    const now = Date.now();
    const start = this._startTime.getTime();
    const end = this._endTime.getTime();

    if (now <= start) return 0;
    if (now >= end) return 100;

    return ((now - start) / (end - start)) * 100;
  }

  /**
   * 计算健康度得分（服务端实现）
   */
  private calculateServerHealthScore(progress: number, timeProgress: number): number {
    // 进度得分 (60%)
    const progressScore = progress * 0.6;

    // 时间匹配得分 (30%)
    const timeMatchScore = Math.max(0, 100 - Math.abs(progress - timeProgress)) * 0.3;

    // 完成率得分 (10%)
    const completionRate =
      this.totalKeyResults > 0 ? (this.completedKeyResults / this.totalKeyResults) * 100 : 0;
    const completionScore = completionRate * 0.1;

    return Math.min(100, progressScore + timeMatchScore + completionScore);
  }

  /**
   * 生成进度报告（服务端专用）
   */
  generateProgressReport(): {
    reportDate: Date;
    goalInfo: {
      name: string;
      status: string;
      daysRemaining: number;
      isOverdue: boolean;
    };
    progressSummary: {
      overallProgress: number;
      weightedProgress: number;
      healthScore: number;
      healthDescription: string;
    };
    keyResultsSummary: {
      total: number;
      completed: number;
      inProgress: number;
      notStarted: number;
    };
    insights: string[];
  } {
    const analysis = this.getDetailedProgressAnalysis();

    const keyResultsSummary = {
      total: this.totalKeyResults,
      completed: this.completedKeyResults,
      inProgress: this.keyResults.filter((kr) => kr.progress > 0 && kr.progress < 100).length,
      notStarted: this.keyResults.filter((kr) => kr.progress === 0).length,
    };

    const insights: string[] = [];

    // 生成洞察
    if (analysis.healthScore >= 80) {
      insights.push('目标执行状况良好，按计划推进');
    } else if (analysis.healthScore >= 60) {
      insights.push('目标执行有待提升，需要适当调整');
    } else {
      insights.push('目标执行存在问题，需要重点关注');
    }

    if (this.isOverdue) {
      insights.push('目标已逾期，建议重新评估时间安排');
    }

    if (keyResultsSummary.notStarted > keyResultsSummary.completed) {
      insights.push('多数关键结果尚未启动，建议优化执行计划');
    }

    return {
      reportDate: new Date(),
      goalInfo: {
        name: this.name,
        status: this.status,
        daysRemaining: this.daysRemaining,
        isOverdue: this.isOverdue,
      },
      progressSummary: {
        overallProgress: analysis.overallProgress,
        weightedProgress: analysis.weightedProgress,
        healthScore: analysis.healthScore,
        healthDescription: this.getHealthDescription(analysis.healthScore),
      },
      keyResultsSummary,
      insights,
    };
  }

  /**
   * 获取健康度描述（服务端实现）
   */
  private getHealthDescription(healthScore: number): string {
    if (healthScore >= 90) return '优秀';
    if (healthScore >= 80) return '良好';
    if (healthScore >= 60) return '一般';
    if (healthScore >= 40) return '需要关注';
    return '需要改进';
  }

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
      accountUuid: dto.accountUuid, // 添加账户UUID
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
      keyResults: dto.keyResults?.map((kr) => KeyResult.fromDTO(kr)) || [],
      records: dto.records?.map((record) => GoalRecord.fromDTO(record)) || [],
      reviews: dto.reviews?.map((review) => GoalReview.fromDTO(review)) || [],
    });
  }

  toResponse(): GoalContracts.GoalResponse {
    const baseDTO = this.toDTO({ accountUuid: this.accountUuid });

    return {
      ...baseDTO,
      keyResults: this.keyResults.map((kr) => ({
        ...kr.toDTO({ accountUuid: this.accountUuid }),
        progress: Math.min((kr.currentValue / kr.targetValue) * 100, 100),
        isCompleted: kr.currentValue >= kr.targetValue,
        remaining: kr.targetValue - kr.currentValue,
      })),
      records: this.records.map((record) =>
        record.toDTO({ accountUuid: this.accountUuid, goalUuid: this.uuid }),
      ),
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
    };
  }

  // ====== 工厂模式 ======

  /**
   * 从完整的 DTO 创建聚合根实例（包括子实体）
   */
  static createFromGoalDTO(dto: GoalContracts.GoalDTO): Goal {
    const goal = Goal.fromDTO(dto);
    goal.keyResults = dto.keyResults?.map((kr) => KeyResult.fromDTO(kr)) || [];
    goal.records = dto.records?.map((record) => GoalRecord.fromDTO(record)) || [];
    goal.reviews = dto.reviews?.map((review) => GoalReview.fromDTO(review)) || [];
    return goal;
  }
}
