import { GoalCore } from '@dailyuse/domain-core';
import {
  type GoalContracts,
  type IGoal,
  type IKeyResult,
  type IGoalRecord,
  type IGoalReview,
} from '@dailyuse/contracts';
import { KeyResult } from '../entities/KeyResult';
import { GoalRecord } from '../entities/GoalRecord';
import { GoalReview } from '../entities/GoalReview';

/**
 * 客户端 Goal 实体
 * 继承核心 Goal 类，添加客户端特有功能
 */
export class Goal extends GoalCore {
  // 重新声明属性类型为具体的实体类型
  declare keyResults: KeyResult[];
  declare records: GoalRecord[];
  declare reviews: GoalReview[];

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
    status?: 'active' | 'completed' | 'paused' | 'archived';
    createdAt?: Date;
    updatedAt?: Date;
    keyResults?: any[];
    records?: any[];
    reviews?: any[];
    version?: number;
  }) {
    super(params);

    // 使用实体的 fromDTO 方法创建实体对象
    // 这里假设传入的已经是 DTO 格式，如果是接口格式需要转换
    this.keyResults = (params.keyResults || []).map((dto) => {
      // 如果是接口格式，需要转换时间戳
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
    });

    this.records = (params.records || []).map((dto) => {
      // 如果是接口格式，需要转换时间戳
      if (dto.createdAt instanceof Date) {
        const convertedDto: GoalContracts.GoalRecordDTO = {
          ...dto,
          createdAt: dto.createdAt.getTime(),
        };
        return GoalRecord.fromDTO(convertedDto) as GoalRecord;
      }
      return GoalRecord.fromDTO(dto) as GoalRecord;
    });
  }

  // ===== 抽象方法实现 =====

  /**
   * 添加关键结果
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
  }

  /**
   * 更新关键结果进度
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
      accountUuid: keyResult.accountUuid,
      goalUuid: this.uuid,
      keyResultUuid,
      value: increment,
      note,
      createdAt: now.getTime(), // 使用时间戳
    };

    // 使用 fromDTO 创建实体对象
    const recordEntity = GoalRecord.fromDTO(recordDTO) as GoalRecord;
    this.records.push(recordEntity);
    this.updateVersion();
  }

  // ===== 客户端特有方法 =====

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
  }

  /**
   * 归档目标
   */
  archive(): void {
    this._lifecycle.status = 'archived';
    this.updateVersion();
  }

  // ===== 客户端特有计算属性 =====

  /**
   * 获取进度颜色（UI相关）
   */
  get progressColor(): string {
    const progress = this.weightedProgress; // 使用继承的属性
    if (progress >= 100) return 'success';
    if (progress >= 80) return 'warning';
    if (progress >= 60) return 'info';
    if (progress >= 40) return 'primary';
    return 'error';
  }

  /**
   * 获取进度图标（UI相关）
   */
  get progressIcon(): string {
    const progress = this.weightedProgress; // 使用继承的属性
    if (progress === 0) return 'mdi-play-circle-outline';
    if (progress >= 100) return 'mdi-check-circle';
    if (progress >= 80) return 'mdi-check-circle-outline';
    return 'mdi-progress-clock';
  }

  /**
   * 获取健康度颜色（UI相关）
   */
  get healthColor(): string {
    // 简化的健康度计算
    const progress = this.weightedProgress;
    const timeProgress = this.getTimeProgress();
    const health = (progress + Math.min(100, 100 - Math.abs(progress - timeProgress))) / 2;

    if (health >= 80) return 'success';
    if (health >= 60) return 'warning';
    if (health >= 40) return 'info';
    return 'error';
  }

  /**
   * 获取健康度描述（UI相关）
   */
  get healthDescription(): string {
    const progress = this.weightedProgress;
    const timeProgress = this.getTimeProgress();
    const health = (progress + Math.min(100, 100 - Math.abs(progress - timeProgress))) / 2;

    if (health >= 90) return '优秀';
    if (health >= 80) return '良好';
    if (health >= 60) return '一般';
    if (health >= 40) return '需要关注';
    return '需要改进';
  }

  /**
   * 获取时间进度（客户端实现）
   */
  private getTimeProgress(): number {
    const now = Date.now();
    const start = this._startTime.getTime();
    const end = this._endTime.getTime();

    if (now <= start) return 0;
    if (now >= end) return 100;

    return ((now - start) / (end - start)) * 100;
  }

  /**
   * 获取关键结果进度分布描述（UI相关）
   */
  get progressDistributionDescription(): string {
    if (this.keyResults.length === 0) return '暂无关键结果';

    const progresses = this.keyResults.map((kr) => kr.progress);
    const mean = progresses.reduce((sum, p) => sum + p, 0) / progresses.length;
    const variance =
      progresses.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / progresses.length;
    const standardDeviation = Math.sqrt(variance);

    if (standardDeviation < 10) return '进度分布均匀';
    if (standardDeviation < 20) return '进度分布较均匀';
    if (standardDeviation < 30) return '进度分布不均匀';
    return '进度差异较大';
  }

  /**
   * 获取显示状态文本
   */
  get statusText(): string {
    const statusMap = {
      active: '进行中',
      paused: '已暂停',
      completed: '已完成',
      archived: '已归档',
    };
    return statusMap[this._lifecycle.status] || '未知';
  }

  /**
   * 获取状态颜色
   */
  get statusColor(): string {
    const colorMap = {
      active: '#4CAF50',
      paused: '#FF9800',
      completed: '#2196F3',
      archived: '#9E9E9E',
    };
    return colorMap[this._lifecycle.status] || '#9E9E9E';
  }

  /**
   * 获取进度百分比文本
   */
  get progressText(): string {
    return `${Math.round(this.overallProgress)}%`;
  }

  /**
   * 获取今日进度增量文本
   */
  get todayProgressText(): string {
    const progress = this.getTodayProgress() || 0;
    if (progress === 0) return '今日无进展';
    return progress > 0 ? `今日 +${Math.round(progress)}%` : `今日 ${Math.round(progress)}%`;
  }

  /**
   * 今日是否有进展
   */
  get hasTodayProgress(): boolean {
    return (this.getTodayProgress() || 0) > 0;
  }

  /**
   * 今日进度等级
   */
  get todayProgressLevel(): 'none' | 'low' | 'medium' | 'high' | 'excellent' {
    const progress = this.getTodayProgress() || 0;
    if (progress === 0) return 'none';
    if (progress < 5) return 'low';
    if (progress < 15) return 'medium';
    if (progress < 30) return 'high';
    return 'excellent';
  }

  /**
   * 获取今日进度 - 公开方法
   * 暂时使用类型断言直到类型系统问题解决
   */
  public getTodayProgress(): number {
    return (this as any).todayProgress || 0;
  }

  /**
   * 今日进度颜色
   */
  get todayProgressColor(): string {
    const level = this.todayProgressLevel;
    const colorMap = {
      none: '#9E9E9E',
      low: '#FF9800',
      medium: '#2196F3',
      high: '#4CAF50',
      excellent: '#8BC34A',
    };
    return colorMap[level];
  }

  /**
   * 今日进度图标
   */
  get todayProgressIcon(): string {
    const level = this.todayProgressLevel;
    const iconMap = {
      none: 'mdi-minus-circle-outline',
      low: 'mdi-trending-up',
      medium: 'mdi-arrow-up-circle',
      high: 'mdi-trending-up-circle',
      excellent: 'mdi-rocket-launch',
    };
    return iconMap[level];
  }

  /**
   * 获取剩余时间文本
   */
  get timeRemainingText(): string {
    if (this.isOverdue) {
      return `已逾期 ${Math.abs(this.daysRemaining)} 天`;
    }

    if (this.daysRemaining === 0) {
      return '今天截止';
    }

    return `还有 ${this.daysRemaining} 天`;
  }

  /**
   * 是否可以编辑
   */
  get canEdit(): boolean {
    return this._lifecycle.status === 'active' || this._lifecycle.status === 'paused';
  }

  /**
   * 是否可以完成
   */
  get canComplete(): boolean {
    return this._lifecycle.status === 'active' || this._lifecycle.status === 'paused';
  }

  /**
   * 是否可以暂停
   */
  get canPause(): boolean {
    return this._lifecycle.status === 'active';
  }

  /**
   * 是否可以恢复
   */
  get canResume(): boolean {
    return this._lifecycle.status === 'paused';
  }

  /**
   * 是否可以归档
   */
  get canArchive(): boolean {
    return this._lifecycle.status === 'completed' || this._lifecycle.status === 'paused';
  }

  /**
   * 获取关键结果摘要
   */
  get keyResultsSummary(): string {
    if (this.totalKeyResults === 0) {
      return '暂无关键结果';
    }

    return `${this.completedKeyResults}/${this.totalKeyResults} 已完成`;
  }

  // ===== DDD聚合根控制模式 - 子实体管理 =====

  /**
   * 创建并添加关键结果
   * 聚合根控制：确保关键结果属于当前目标，维护权重总和不超过100%
   */
  createKeyResult(keyResult: KeyResult): string {
    // 业务规则验证
    if (!keyResult.name.trim()) {
      throw new Error('关键结果名称不能为空');
    }

    // 验证关键结果必须属于当前目标
    if (keyResult.goalUuid !== this.uuid) {
      throw new Error('关键结果必须属于当前目标');
    }

    // 检查权重限制
    const totalWeight = this.keyResults.reduce((sum, kr) => sum + kr.weight, 0);
    if (totalWeight + keyResult.weight > 100) {
      throw new Error(`关键结果权重总和不能超过100%，当前总和: ${totalWeight}%`);
    }

    if (keyResult.weight <= 0 || keyResult.weight > 100) {
      throw new Error('关键结果权重必须在1-100%之间');
    }

    // 直接添加实体到聚合
    this.keyResults.push(keyResult);
    this.updateVersion();

    // 发布领域事件
    this.publishDomainEvent('KeyResultCreated', {
      goalUuid: this.uuid,
      keyResultUuid: keyResult.uuid,
      keyResult: keyResult.toDTO(),
    });

    return keyResult.uuid;
  }

  /**
   * 为当前目标创建新的关键结果实例（工厂方法）
   * 提供便捷的关键结果创建方式
   */
  createKeyResultForEdit(params: {
    accountUuid: string;
    name?: string;
    unit: string;
    targetValue?: number;
    weight?: number;
  }): KeyResult {
    return KeyResult.forCreate({
      accountUuid: params.accountUuid,
      goalUuid: this.uuid,
      name: params.name,
      unit: params.unit,
      targetValue: params.targetValue,
      weight: params.weight,
    });
  }

  /**
   * 更新关键结果
   * 聚合根控制：验证关键结果属于当前目标，维护业务规则
   */
  updateKeyResult(keyResult: KeyResult): void {
    const existingKeyResult = this.keyResults.find((kr) => kr.uuid === keyResult.uuid);
    if (!existingKeyResult) {
      throw new Error(`关键结果不存在: ${keyResult.uuid}`);
    }

    // 验证关键结果属于当前目标
    if (keyResult.goalUuid !== this.uuid) {
      throw new Error('关键结果必须属于当前目标');
    }

    // 业务规则验证
    if (!keyResult.name.trim()) {
      throw new Error('关键结果名称不能为空');
    }

    // 检查权重限制（排除当前关键结果）
    const otherWeight = this.keyResults
      .filter((kr) => kr.uuid !== keyResult.uuid)
      .reduce((sum, kr) => sum + kr.weight, 0);

    if (otherWeight + keyResult.weight > 100) {
      throw new Error(`关键结果权重总和不能超过100%，当前其他权重总和: ${otherWeight}%`);
    }

    if (keyResult.weight <= 0 || keyResult.weight > 100) {
      throw new Error('关键结果权重必须在1-100%之间');
    }

    // 保存原始数据用于事件
    const originalData = (existingKeyResult as KeyResult).toDTO();

    // 直接替换聚合中的实体
    const existingIndex = this.keyResults.findIndex((kr) => kr.uuid === keyResult.uuid);
    this.keyResults[existingIndex] = keyResult;

    // 更新聚合根
    this.updateVersion();

    // 发布领域事件
    this.publishDomainEvent('KeyResultUpdated', {
      goalUuid: this.uuid,
      keyResultUuid: keyResult.uuid,
      originalData,
      updatedData: keyResult.toDTO(),
      changes: keyResult,
    });
  }

  /**
   * 删除关键结果
   * 聚合根控制：确保数据一致性，级联删除相关记录
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

    // 更新聚合根
    this.updateVersion();

    // 发布领域事件
    this.publishDomainEvent('KeyResultRemoved', {
      goalUuid: this.uuid,
      keyResultUuid,
      removedKeyResult: keyResult,
      cascadeDeletedRecordsCount: relatedRecords.length,
    });
  }

  /**
   * 创建并添加目标记录
   * 聚合根控制：验证记录数据有效性，自动更新关键结果进度
   */
  createRecord(recordData: { keyResultUuid: string; value: number; note?: string }): string {
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
      accountUuid: '', // 由应用层设置
      goalUuid: this.uuid,
      keyResultUuid: recordData.keyResultUuid,
      value: recordData.value,
      note: recordData.note,
      createdAt: now,
    });

    // 添加到聚合
    this.records.push(newRecord);

    // 更新关键结果当前值（使用实体的业务方法）
    keyResult.updateProgress(recordData.value, 'set');

    // 更新聚合根
    this.updateVersion();

    // 发布领域事件
    this.publishDomainEvent('GoalRecordCreated', {
      goalUuid: this.uuid,
      recordUuid,
      record: newRecord.toDTO(),
      keyResultUpdated: true,
    });

    return recordUuid;
  }

  /**
   * 更新目标记录
   */
  updateRecord(
    recordUuid: string,
    updates: {
      value?: number;
      note?: string;
    },
  ): void {
    const record = this.records.find((r) => r.uuid === recordUuid);
    if (!record) {
      throw new Error(`目标记录不存在: ${recordUuid}`);
    }

    const originalData = record.toDTO();

    // 使用实体的业务方法应用更新
    if (updates.value !== undefined) {
      record.updateValue(updates.value);
    }
    if (updates.note !== undefined) {
      record.updateNote(updates.note);
    }

    // 如果更新了值，同步更新关键结果
    if (updates.value !== undefined && record.keyResultUuid) {
      const keyResult = this.keyResults.find((kr) => kr.uuid === record.keyResultUuid);
      if (keyResult) {
        keyResult.updateProgress(updates.value, 'set');
      }
    }

    this.updateVersion();

    this.publishDomainEvent('GoalRecordUpdated', {
      goalUuid: this.uuid,
      recordUuid,
      originalData,
      updatedData: record.toDTO(),
      changes: updates,
    });
  }

  /**
   * 删除目标记录
   */
  removeRecord(recordUuid: string): void {
    const recordIndex = this.records.findIndex((r) => r.uuid === recordUuid);
    if (recordIndex === -1) {
      throw new Error(`目标记录不存在: ${recordUuid}`);
    }

    const record = this.records[recordIndex];
    this.records.splice(recordIndex, 1);

    this.updateVersion();

    this.publishDomainEvent('GoalRecordRemoved', {
      goalUuid: this.uuid,
      recordUuid,
      removedRecord: record,
    });
  }

  /**
   * 创建并添加目标复盘
   * 聚合根控制：确保复盘数据完整性，生成快照
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

    const newReview: IGoalReview = {
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
    };

    // 使用父类方法添加到聚合
    this.addReview(newReview);

    this.publishDomainEvent('GoalReviewCreated', {
      goalUuid: this.uuid,
      reviewUuid,
      review: newReview,
    });

    return reviewUuid;
  }

  /**
   * 更新目标复盘
   */
  updateReview(
    reviewUuid: string,
    updates: {
      title?: string;
      content?: Partial<IGoalReview['content']>;
      rating?: Partial<IGoalReview['rating']>;
    },
  ): void {
    const review = this.reviews.find((r) => r.uuid === reviewUuid);
    if (!review) {
      throw new Error(`目标复盘不存在: ${reviewUuid}`);
    }

    if (updates.title !== undefined && !updates.title.trim()) {
      throw new Error('复盘标题不能为空');
    }

    const originalData = { ...review };

    if (updates.title !== undefined) review.title = updates.title;
    if (updates.content !== undefined) {
      review.content = { ...review.content, ...updates.content };
    }
    if (updates.rating !== undefined) {
      review.rating = { ...review.rating, ...updates.rating };
    }

    review.updatedAt = new Date();

    this.updateVersion();

    this.publishDomainEvent('GoalReviewUpdated', {
      goalUuid: this.uuid,
      reviewUuid,
      originalData,
      updatedData: { ...review },
      changes: updates,
    });
  }

  /**
   * 删除目标复盘
   */
  removeReview(reviewUuid: string): void {
    const reviewIndex = this.reviews.findIndex((r) => r.uuid === reviewUuid);
    if (reviewIndex === -1) {
      throw new Error(`目标复盘不存在: ${reviewUuid}`);
    }

    const review = this.reviews[reviewIndex];
    this.reviews.splice(reviewIndex, 1);

    this.updateVersion();

    this.publishDomainEvent('GoalReviewRemoved', {
      goalUuid: this.uuid,
      reviewUuid,
      removedReview: review,
    });
  }

  // ===== 查询方法（聚合根提供的查询接口）=====

  /**
   * 获取指定关键结果（返回实体对象）
   */
  getKeyResult(keyResultUuid: string): KeyResult | undefined {
    return this.keyResults.find((kr) => kr.uuid === keyResultUuid);
  }

  /**
   * 获取指定关键结果的实体版本（用于编辑）
   */
  getKeyResultEntity(keyResultUuid: string): KeyResult | undefined {
    // 现在keyResults已经是实体对象数组，直接返回即可
    return this.keyResults.find((kr) => kr.uuid === keyResultUuid);
  }

  /**
   * 获取指定关键结果的克隆版本（用于表单编辑）
   */
  getKeyResultForEdit(keyResultUuid: string): KeyResult | undefined {
    const keyResult = this.getKeyResultEntity(keyResultUuid);
    return keyResult?.clone();
  }

  /**
   * 获取活跃的关键结果
   */
  getActiveKeyResults(): IKeyResult[] {
    return this.keyResults.filter((kr) => kr.lifecycle.status === 'active');
  }

  /**
   * 获取指定关键结果的记录
   */
  getRecordsForKeyResult(keyResultUuid: string): IGoalRecord[] {
    return this.records.filter((r) => r.keyResultUuid === keyResultUuid);
  }

  /**
   * 获取最近的记录
   */
  getRecentRecords(limit: number = 10): IGoalRecord[] {
    return this.records
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * 获取指定类型的复盘
   */
  getReviewsByType(type: 'weekly' | 'monthly' | 'midterm' | 'final' | 'custom'): IGoalReview[] {
    return this.reviews.filter((r) => r.type === type);
  }

  /**
   * 获取最新的复盘
   */
  getLatestReview(): IGoalReview | undefined {
    return this.reviews.sort((a, b) => b.reviewDate.getTime() - a.reviewDate.getTime())[0];
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

  /**
   * 发布领域事件
   */
  private publishDomainEvent(eventType: string, eventData: any): void {
    // 这里可以集成事件发布机制
    console.log(`[Domain Event] ${eventType}:`, eventData);
  }

  /**
   * 获取格式化的时间范围
   */
  getFormattedTimeRange(): string {
    const startStr = this._startTime.toLocaleDateString();
    const endStr = this._endTime.toLocaleDateString();
    return `${startStr} ~ ${endStr}`;
  }

  /**
   * 获取创建时间的相对时间
   */
  getRelativeCreatedTime(): string {
    const now = new Date();
    const diffMs = now.getTime() - this._lifecycle.createdAt.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return '今天创建';
    } else if (diffDays === 1) {
      return '昨天创建';
    } else if (diffDays < 7) {
      return `${diffDays} 天前创建`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} 周前创建`;
    } else {
      const months = Math.floor(diffDays / 30);
      return `${months} 个月前创建`;
    }
  }

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
   * 检查是否可以执行某个操作（UI权限控制）
   */
  canPerformAction(action: 'edit' | 'pause' | 'resume' | 'complete' | 'archive'): boolean {
    switch (action) {
      case 'edit':
        return this.canEdit;
      case 'pause':
        return this.canPause;
      case 'resume':
        return this.canResume;
      case 'complete':
        return this.canComplete;
      case 'archive':
        return this.canArchive;
      default:
        return false;
    }
  }

  /**
   * 获取可用的操作列表（用于上下文菜单）
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

  // ===== 客户端数据转换方法 =====

  /**
   * 转换为表单数据（用于编辑表单）
   */
  toFormData(): {
    name: string;
    description: string;
    color: string;
    dirUuid: string;
    startTime: string;
    endTime: string;
    note: string;
    motive: string;
    feasibility: string;
  } {
    return {
      name: this._name,
      description: this._description || '',
      color: this._color,
      dirUuid: this._dirUuid || '',
      startTime: this._startTime.toISOString().split('T')[0],
      endTime: this._endTime.toISOString().split('T')[0],
      note: this._note || '',
      motive: this._analysis.motive || '',
      feasibility: this._analysis.feasibility || '',
    };
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

  static fromResponse(response: GoalContracts.GoalResponse): Goal {
    const goal = Goal.fromDTO(response);

    // // 设置关键结果
    // goal.keyResults = response.keyResults.map((kr) => ({
    //   uuid: kr.uuid,
    //   goalUuid: kr.goalUuid,
    //   accountUuid: kr.accountUuid,
    //   name: kr.name,
    //   description: kr.description,
    //   startValue: kr.startValue,
    //   targetValue: kr.targetValue,
    //   currentValue: kr.currentValue,
    //   unit: kr.unit,
    //   weight: kr.weight,
    //   calculationMethod: kr.calculationMethod,
    //   createdAt: new Date(kr.createdAt),
    //   updatedAt: new Date(kr.updatedAt),
    //   status: kr.status,
    // }));

    // // 设置记录
    // goal.records = response.records.map((record) => ({
    //   uuid: record.uuid,
    //   accountUuid: record.accountUuid,
    //   goalUuid: record.goalUuid,
    //   keyResultUuid: record.keyResultUuid,
    //   value: record.value,
    //   note: record.note,
    //   recordDate: new Date(record.recordDate),
    //   createdAt: new Date(record.createdAt),
    // }));

    // // 设置复盘
    // goal.reviews = response.reviews.map((review) => ({
    //   uuid: review.uuid,
    //   goalUuid: review.goalUuid,
    //   title: review.title,
    //   type: review.type,
    //   reviewDate: new Date(review.reviewDate),
    //   content: review.content,
    //   snapshot: {
    //     ...review.snapshot,
    //     snapshotDate: new Date(review.snapshot.snapshotDate),
    //   },
    //   rating: review.rating,
    //   createdAt: new Date(review.createdAt),
    //   updatedAt: new Date(review.updatedAt),
    // }));

    return goal;
  }

  /**
   * 创建一个空的目标实例（用于新建表单）
   */
  static forCreate(): Goal {
    const now = new Date();
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30天后

    return new Goal({
      name: '',
      color: '#FF5733',
      startTime: now,
      endTime: endDate,
    });
  }

  /**
   * 克隆当前对象（深拷贝）
   * 用于表单编辑时避免直接修改原数据
   */
  clone(): Goal {
    return Goal.fromDTO(this.toDTO());
  }

  /**
   * 客户端缓存键
   */
  getCacheKey(): string {
    return `goal_${this.uuid}`;
  }

  /**
   * 检查是否需要刷新（基于更新时间）
   */
  shouldRefresh(): boolean {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this._lifecycle.updatedAt < fiveMinutesAgo;
  }
}

/**
 * 客户端 GoalDir 实体
 * 继承核心 GoalDir 类，添加客户端特有功能
 */
