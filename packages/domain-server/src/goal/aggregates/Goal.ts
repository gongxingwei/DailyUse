import { GoalCore } from '@dailyuse/domain-core';
import { GoalContracts, sharedContracts } from '@dailyuse/contracts';
import { KeyResult } from '../entities/KeyResult';
import { GoalRecord } from '../entities/GoalRecord';
import { GoalReview } from '../entities/GoalReview';
import { GoalDomainException } from '../exceptions/GoalDomainException';

// 枚举别名
const GoalStatusEnum = GoalContracts.GoalStatus;
const KeyResultStatusEnum = GoalContracts.KeyResultStatus;
const KeyResultCalculationMethodEnum = GoalContracts.KeyResultCalculationMethod;

type GoalPersistenceDTO = GoalContracts.GoalPersistenceDTO;
type ImportanceLevel = sharedContracts.ImportanceLevel;
type UrgencyLevel = sharedContracts.UrgencyLevel;
const ImportanceLevel = sharedContracts.ImportanceLevel;
const UrgencyLevel = sharedContracts.UrgencyLevel;

/**
 * 安全 JSON 解析辅助方法
 */
function safeJsonParse<T>(jsonString: string | T | null | undefined, defaultValue: T): T {
  // 如果已经是对象/数组类型，直接返回
  if (typeof jsonString === 'object' && jsonString !== null) {
    return jsonString as T;
  }

  // 如果是空字符串或 null/undefined，返回默认值
  if (!jsonString || (typeof jsonString === 'string' && jsonString.trim() === '')) {
    return defaultValue;
  }

  // 尝试解析 JSON 字符串
  try {
    const parsed = JSON.parse(jsonString as string);
    return parsed !== null && parsed !== undefined ? parsed : defaultValue;
  } catch (error) {
    console.warn(`Failed to parse tags JSON: ${jsonString}`);
    return defaultValue;
  }
}

/**
 * 服务端 Goal 实体
 * 继承核心 Goal 类，添加服务端特有功能
 */
export class Goal extends GoalCore {
  // ===== DDD 聚合根业务方法（只接收实体对象）=====

  /**
   * 更新基础信息
   * 统一的更新方法，只接收实体字段，不接收 DTO
   */
  updateBasic(updates: {
    name?: string;
    description?: string;
    color?: string;
    dirUuid?: string;
    startTime?: Date;
    endTime?: Date;
    note?: string;
  }): void {
    if (updates.name !== undefined) {
      this.validateName(updates.name);
      this._name = updates.name;
    }

    if (updates.description !== undefined) {
      this._description = updates.description;
    }

    if (updates.color !== undefined) {
      this.validateColor(updates.color);
      this._color = updates.color;
    }

    if (updates.dirUuid !== undefined) {
      this._dirUuid = updates.dirUuid;
    }

    if (updates.startTime !== undefined || updates.endTime !== undefined) {
      const newStart = updates.startTime || this._startTime;
      const newEnd = updates.endTime || this._endTime;
      this.validateTimeRange(newStart, newEnd);
      this._startTime = newStart;
      this._endTime = newEnd;
    }

    if (updates.note !== undefined) {
      this._note = updates.note;
    }

    this.updateVersion();
  }

  /**
   * 更新分析信息
   */
  updateAnalysis(updates: {
    motive?: string;
    feasibility?: string;
    importanceLevel?: ImportanceLevel;
    urgencyLevel?: UrgencyLevel;
  }): void {
    if (updates.motive !== undefined) {
      this._analysis.motive = updates.motive;
    }
    if (updates.feasibility !== undefined) {
      this._analysis.feasibility = updates.feasibility;
    }
    if (updates.importanceLevel !== undefined) {
      this._analysis.importanceLevel = updates.importanceLevel;
    }
    if (updates.urgencyLevel !== undefined) {
      this._analysis.urgencyLevel = updates.urgencyLevel;
    }
    this.updateVersion();
  }

  /**
   * 更新元数据
   */
  updateMetadata(updates: { tags?: string[]; category?: string }): void {
    if (updates.tags !== undefined) {
      this._metadata.tags = [...updates.tags];
    }
    if (updates.category !== undefined) {
      this._metadata.category = updates.category;
    }
    this.updateVersion();
  }

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
    status?: GoalContracts.GoalStatus;
    createdAt?: Date;
    updatedAt?: Date;
    keyResults?: KeyResult[];
    records?: GoalRecord[];
    reviews?: GoalReview[];
    tags?: string[];
    category?: string;
    version?: number;
  }) {
    const { keyResults = [], records = [], reviews = [], ...baseParams } = params;

    super(baseParams);

    // 服务端特有的实体创建逻辑
    this.keyResults = keyResults;
    this.records = records;
    this.reviews = reviews;
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
   * 添加关键结果（只接收实体对象）
   */
  addKeyResult(keyResult: KeyResult): void {
    // 验证权重总和不超过100
    const totalWeight = this.keyResults.reduce((sum, kr) => sum + kr.weight, 0) + keyResult.weight;
    if (totalWeight > 100) {
      throw new Error('关键结果权重总和不能超过100%');
    }

    // 直接添加实体对象
    this.keyResults.push(keyResult);
    this.updateVersion();

    // 发布领域事件
    this.addDomainEvent({
      eventType: 'KeyResultCreated',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        goalUuid: this.uuid,
        keyResultUuid: keyResult.uuid,
      },
    });
  }

  /**
   * 更新关键结果（聚合根方法）
   * 调用子实体的 update 方法，聚合根只处理聚合级别的业务规则
   */
  updateKeyResult(
    keyResultUuid: string,
    updates: {
      name?: string;
      description?: string;
      startValue?: number;
      targetValue?: number;
      currentValue?: number;
      unit?: string;
      weight?: number;
      calculationMethod?: GoalContracts.KeyResultCalculationMethod;
    },
  ): void {
    const keyResult = this.keyResults.find((kr) => kr.uuid === keyResultUuid);
    if (!keyResult) {
      throw new GoalDomainException(GoalContracts.GoalErrorCode.KEY_RESULT_NOT_FOUND);
    }

    // 聚合根级别的业务规则：验证权重总和
    if (updates.weight !== undefined) {
      const otherWeight = this.keyResults
        .filter((kr) => kr.uuid !== keyResultUuid)
        .reduce((sum, kr) => sum + kr.weight, 0);

      if (otherWeight + updates.weight > 100) {
        throw new Error('关键结果权重总和不能超过100%');
      }
    }

    // 调用子实体的 update 方法，处理实体级别的逻辑
    (keyResult as KeyResult).update(updates);

    // 聚合根级别的后续处理
    this.updateVersion();

    this.addDomainEvent({
      eventType: 'KeyResultUpdated',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        goalUuid: this.uuid,
        keyResultUuid,
      },
    });
  }

  /**
   * 删除关键结果
   */
  removeKeyResult(keyResultUuid: string): void {
    const index = this.keyResults.findIndex((kr) => kr.uuid === keyResultUuid);
    if (index === -1) {
      throw new GoalDomainException(GoalContracts.GoalErrorCode.KEY_RESULT_NOT_FOUND);
    }

    // 级联删除相关记录
    this.records = this.records.filter((r) => r.keyResultUuid !== keyResultUuid);

    // 删除关键结果
    this.keyResults.splice(index, 1);
    this.updateVersion();

    this.addDomainEvent({
      eventType: 'KeyResultRemoved',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        goalUuid: this.uuid,
        keyResultUuid,
      },
    });
  }

  /**
   * 添加记录（聚合根方法）
   */
  addRecord(record: GoalRecord): void {
    // 聚合根级别的业务规则：验证关键结果存在
    const keyResult = this.keyResults.find((kr) => kr.uuid === record.keyResultUuid);
    if (!keyResult) {
      throw new Error('关键结果不存在');
    }

    // 添加记录
    this.records.push(record);

    // 聚合根级别的业务逻辑：级联更新关键结果进度
    keyResult.updateProgress(record.value, 'increment');

    this.updateVersion();

    this.addDomainEvent({
      eventType: 'RecordAdded',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        recordUuid: record.uuid,
        keyResultUuid: record.keyResultUuid,
      },
    });
  }

  /**
   * 更新记录（聚合根方法）
   * 调用子实体的 update 方法
   */
  updateRecord(recordUuid: string, updates: { value?: number; note?: string }): void {
    const record = this.records.find((r) => r.uuid === recordUuid);
    if (!record) {
      throw new Error('记录不存在');
    }

    // 调用子实体的 update 方法
    (record as GoalRecord).update(updates);

    // 聚合根级别的业务逻辑：如果更新了 value，需要同步更新关键结果
    if (updates.value !== undefined && record.keyResultUuid) {
      const keyResult = this.keyResults.find((kr) => kr.uuid === record.keyResultUuid);
      if (keyResult) {
        // 重新计算进度（这里简化处理，实际可能需要更复杂的逻辑）
        keyResult.updateProgress(updates.value, 'set');
      }
    }

    this.updateVersion();

    this.addDomainEvent({
      eventType: 'RecordUpdated',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        goalUuid: this.uuid,
        recordUuid,
      },
    });
  }

  /**
   * 删除记录（聚合根方法）
   */
  removeRecord(recordUuid: string): void {
    const index = this.records.findIndex((r) => r.uuid === recordUuid);
    if (index === -1) {
      throw new Error('记录不存在');
    }

    // 删除记录
    this.records.splice(index, 1);
    this.updateVersion();

    this.addDomainEvent({
      eventType: 'RecordRemoved',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        goalUuid: this.uuid,
        recordUuid,
      },
    });
  }

  // ===== DDD聚合根控制模式 - 服务端业务方法 =====

  /**
   * 创建并添加关键结果（服务端业务方法）
   */
  createKeyResult(keyResultData: {
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
      goalUuid: this.uuid,
      name: keyResultData.name,
      description: keyResultData.description,
      startValue: keyResultData.startValue || 0,
      targetValue: keyResultData.targetValue,
      currentValue: keyResultData.currentValue || 0,
      unit: keyResultData.unit,
      weight: keyResultData.weight,
      calculationMethod:
        (keyResultData.calculationMethod as GoalContracts.KeyResultCalculationMethod) ||
        KeyResultCalculationMethodEnum.SUM,
      status: KeyResultStatusEnum.ACTIVE,
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
        keyResult: keyResult.toDTO(),
      },
    });

    return keyResultUuid;
  }

  /**
   * 更新复盘（聚合根方法）
   * 调用子实体的 update 方法
   */
  updateReview(
    reviewUuid: string,
    updates: {
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
    },
  ): void {
    const review = this.reviews.find((r) => r.uuid === reviewUuid) as GoalReview | undefined;
    if (!review) {
      throw new Error('复盘不存在');
    }

    // 调用子实体的 update 方法
    review.update(updates);

    // 聚合根级别的后续处理
    this.updateVersion();

    this.addDomainEvent({
      eventType: 'ReviewUpdated',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        goalUuid: this.uuid,
        reviewUuid,
      },
    });
  }

  /**
   * 删除复盘（聚合根方法）
   */
  removeReview(reviewUuid: string): void {
    const index = this.reviews.findIndex((r) => r.uuid === reviewUuid);
    if (index === -1) {
      throw new Error('复盘不存在');
    }

    // 删除复盘
    this.reviews.splice(index, 1);
    this.updateVersion();

    this.addDomainEvent({
      eventType: 'ReviewRemoved',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        goalUuid: this.uuid,
        reviewUuid,
      },
    });
  }

  /**
   * 创建目标记录（服务端）
   */
  createRecord(recordData: {
    uuid?: string;
    keyResultUuid: string;
    value: number;
    note?: string;
  }): string {
    // 验证关键结果存在
    const keyResult = this.keyResults.find((kr) => kr.uuid === recordData.keyResultUuid);
    if (!keyResult) {
      throw new GoalDomainException(GoalContracts.GoalErrorCode.KEY_RESULT_NOT_FOUND);
    }

    // 创建记录实体
    const recordUuid = recordData.uuid || this.generateUUID();
    const now = new Date();

    const newRecord = new GoalRecord({
      uuid: recordUuid,
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
        record: newRecord.toDTO(),
        keyResultUpdated: true,
      },
    });

    return recordUuid;
  }

  /**
   * 创建目标复盘（服务端）
   */
  createReview(reviewData: {
    title: string;
    type: GoalContracts.GoalReviewType;
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
    return KeyResult.fromDTO(keyResult.toDTO());
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

    this._lifecycle.status = GoalStatusEnum.PAUSED;
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

    this._lifecycle.status = GoalStatusEnum.ACTIVE;
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

    this._lifecycle.status = GoalStatusEnum.COMPLETED;
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
    this._lifecycle.status = GoalStatusEnum.ARCHIVED;
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
      importanceLevel: dto.analysis.importanceLevel,
      urgencyLevel: dto.analysis.urgencyLevel,
      status: dto.lifecycle.status as unknown as Goal['status'],
      createdAt: new Date(dto.lifecycle.createdAt),
      updatedAt: new Date(dto.lifecycle.updatedAt),
      tags: dto.metadata.tags,
      category: dto.metadata.category,
      version: dto.version,
      keyResults: dto.keyResults?.map((kr) => KeyResult.fromDTO(kr)) ?? [],
      records: dto.records?.map((record) => GoalRecord.fromDTO(record)) ?? [],
      reviews: dto.reviews?.map((review) => GoalReview.fromDTO(review)) ?? [],
    });
  }

  toDTO(): GoalContracts.GoalDTO {
    return {
      uuid: this.uuid,
      name: this.name,
      description: this.description,
      color: this.color,
      dirUuid: this.dirUuid,
      startTime: this.startTime.getTime(),
      endTime: this.endTime.getTime(),
      note: this.note,
      analysis: {
        motive: this.analysis.motive,
        feasibility: this.analysis.feasibility,
        importanceLevel: this.analysis.importanceLevel,
        urgencyLevel: this.analysis.urgencyLevel,
      },
      lifecycle: {
        createdAt: this.lifecycle.createdAt.getTime(),
        updatedAt: this.lifecycle.updatedAt.getTime(),
        status: this.lifecycle.status as GoalContracts.GoalStatus,
      },
      metadata: {
        tags: [...this.metadata.tags],
        category: this.metadata.category,
      },
      version: this.version,
      keyResults: this.keyResults.map((kr) => kr.toDTO()),
      records: this.records.map((record) => record.toDTO()),
      reviews: this.reviews.map((review) => (review as GoalReview).toDTO()),
    };
  }

  /**
   * 转换为持久化 DTO（扁平化格式，用于数据库存储）
   */
  toPersistence(accountUuid: string): GoalPersistenceDTO {
    return {
      uuid: this.uuid,
      accountUuid,

      // 基本信息
      name: this.name,
      description: this.description,
      color: this.color,
      dirUuid: this.dirUuid,
      startTime: this.startTime,
      endTime: this.endTime,
      note: this.note,

      // 分析信息 - 扁平化
      motive: this.analysis.motive,
      feasibility: this.analysis.feasibility,
      importanceLevel: this.analysis.importanceLevel,
      urgencyLevel: this.analysis.urgencyLevel,

      // 生命周期
      createdAt: this.lifecycle.createdAt,
      updatedAt: this.lifecycle.updatedAt,
      status: this.lifecycle.status as GoalContracts.GoalStatus,

      // 元数据 - JSON 存储
      tags: JSON.stringify(this.metadata.tags),
      category: this.metadata.category,

      // 版本控制
      version: this.version,
    };
  }

  /**
   * 从持久化 DTO 创建实体（不包含子实体）
   */
  static fromPersistence(data: GoalPersistenceDTO): Goal {
    return new Goal({
      uuid: data.uuid,
      name: data.name,
      description: data.description,
      color: data.color,
      dirUuid: data.dirUuid,
      startTime: data.startTime,
      endTime: data.endTime,
      note: data.note,
      motive: data.motive,
      feasibility: data.feasibility,
      importanceLevel: data.importanceLevel,
      urgencyLevel: data.urgencyLevel,
      status: data.status as unknown as GoalContracts.GoalStatus,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      tags: safeJsonParse(data.tags, []),
      category: data.category,
      version: data.version,
      // 子实体在加载时单独设置
      keyResults: [],
      records: [],
      reviews: [],
    });
  }

  toClient(): GoalContracts.GoalClientDTO {
    const baseDTO = this.toDTO();

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const todayRecords = this.records.filter((record) => {
      const createdAt = record.createdAt.getTime();
      return createdAt >= todayStart.getTime() && createdAt < todayEnd.getTime();
    });

    const todayRecordsStats = {
      totalRecords: todayRecords.length,
      keyResultsWithRecords: new Set(todayRecords.map((r) => r.keyResultUuid)).size,
      averageRecordValue:
        todayRecords.length > 0
          ? todayRecords.reduce((sum, r) => sum + r.value, 0) / todayRecords.length
          : 0,
      totalRecordValue: todayRecords.reduce((sum, r) => sum + r.value, 0),
    };

    const completedKeyResults = this.keyResults.filter(
      (kr) => kr.currentValue >= kr.targetValue,
    ).length;
    const totalKeyResults = this.keyResults.length;
    const keyResultCompletionRate =
      totalKeyResults > 0 ? (completedKeyResults / totalKeyResults) * 100 : 0;

    const overallProgress =
      totalKeyResults > 0
        ? this.keyResults.reduce((sum, kr) => {
            if (kr.targetValue === 0) {
              return sum;
            }
            const ratio = Math.min((kr.currentValue / kr.targetValue) * 100, 100);
            return sum + ratio;
          }, 0) / totalKeyResults
        : 0;

    const weightedProgress = overallProgress;
    const todayProgress = todayRecordsStats.totalRecordValue;

    const daysRemaining = this.endTime
      ? Math.max(0, Math.ceil((this.endTime.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)))
      : 0;

    let progressStatus: GoalContracts.GoalProgressStatus;
    if (overallProgress === 0) {
      progressStatus = GoalContracts.GoalProgressStatus.NOT_STARTED;
    } else if (overallProgress >= 100) {
      progressStatus =
        completedKeyResults > totalKeyResults
          ? GoalContracts.GoalProgressStatus.OVER_ACHIEVED
          : GoalContracts.GoalProgressStatus.COMPLETED;
    } else if (overallProgress >= 80) {
      progressStatus = GoalContracts.GoalProgressStatus.NEARLY_COMPLETED;
    } else {
      progressStatus = GoalContracts.GoalProgressStatus.IN_PROGRESS;
    }

    const timeProgress = this.endTime
      ? ((Date.now() - this.startTime.getTime()) /
          (this.endTime.getTime() - this.startTime.getTime())) *
        100
      : 50;
    const healthScore = Math.max(0, Math.min(100, overallProgress - timeProgress + 50));

    let todayProgressLevel: GoalContracts.GoalTodayProgressLevel;
    if (todayRecordsStats.totalRecords === 0) {
      todayProgressLevel = GoalContracts.GoalTodayProgressLevel.NONE;
    } else if (todayRecordsStats.totalRecords <= 1) {
      todayProgressLevel = GoalContracts.GoalTodayProgressLevel.LOW;
    } else if (todayRecordsStats.totalRecords <= 3) {
      todayProgressLevel = GoalContracts.GoalTodayProgressLevel.MEDIUM;
    } else if (todayRecordsStats.totalRecords <= 5) {
      todayProgressLevel = GoalContracts.GoalTodayProgressLevel.HIGH;
    } else {
      todayProgressLevel = GoalContracts.GoalTodayProgressLevel.EXCELLENT;
    }

    return {
      ...baseDTO,
      keyResults: this.keyResults.map((kr) => (kr as KeyResult).toClient()),
      records: this.records.map((record) => (record as GoalRecord).toClient()),
      reviews: this.reviews.map((review) => (review as GoalReview).toClient()),
      overallProgress,
      weightedProgress,
      calculatedProgress: overallProgress,
      todayProgress,
      completedKeyResults,
      totalKeyResults,
      keyResultCompletionRate,
      progressStatus,
      healthScore,
      daysRemaining,
      isOverdue: this.endTime ? this.endTime.getTime() < Date.now() : false,
      hasTodayProgress: todayRecordsStats.totalRecords > 0,
      todayProgressLevel,
      todayRecordsStats,
      durationDays: this.endTime
        ? Math.ceil((this.endTime.getTime() - this.startTime.getTime()) / (24 * 60 * 60 * 1000))
        : 0,
      elapsedDays: Math.max(
        0,
        Math.ceil((today.getTime() - this.startTime.getTime()) / (24 * 60 * 60 * 1000)),
      ),
      timeProgress,
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
