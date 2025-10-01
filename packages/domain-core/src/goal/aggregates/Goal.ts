import { AggregateRoot } from '@dailyuse/utils';
import { type GoalContracts } from '@dailyuse/contracts';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';
import { KeyResultCore } from '../entities/KeyResult';
import { GoalRecordCore } from '../entities/GoalRecord';
import { GoalReview } from '../entities/GoalReview';

type IGoal = GoalContracts.IGoal;
type IKeyResult = GoalContracts.IKeyResult;
type IGoalRecord = GoalContracts.IGoalRecord;
type IGoalReview = GoalContracts.IGoalReview;

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

  /**
   * 整体进度（简单平均）
   * 所有关键结果的平均进度
   */
  get overallProgress(): number {
    if (this.keyResults.length === 0) return 0;

    const totalProgress = this.keyResults.reduce((sum, kr) => sum + kr.progress, 0);
    return totalProgress / this.keyResults.length;
  }

  /**
   * 加权进度（基于权重）
   * 根据关键结果的权重计算加权平均进度
   */
  get weightedProgress(): number {
    if (this.keyResults.length === 0) return 0;

    const totalWeight = this.keyResults.reduce((sum, kr) => sum + kr.weight, 0);
    if (totalWeight === 0) return 0;

    const weightedSum = this.keyResults.reduce((sum, kr) => {
      return sum + kr.calculatedProgress * kr.weight;
    }, 0);

    return weightedSum / totalWeight;
  }

  /**
   * 计算进度（根据计算方法）
   * 综合考虑不同KeyResult的计算方法得出的整体进度
   */
  get calculatedProgress(): number {
    if (this.keyResults.length === 0) return 0;

    const totalWeight = this.keyResults.reduce((sum, kr) => sum + kr.weight, 0);
    if (totalWeight === 0) return this.overallProgress;

    const weightedSum = this.keyResults.reduce((sum, kr) => {
      return sum + kr.calculatedProgress * kr.weight;
    }, 0);

    return weightedSum / totalWeight;
  }

  /**
   * 完成的关键结果数量
   */
  get completedKeyResults(): number {
    return this.keyResults.filter((kr) => kr.isCompleted).length;
  }

  /**
   * 关键结果总数
   */
  get totalKeyResults(): number {
    return this.keyResults.length;
  }

  /**
   * 关键结果完成率
   */
  get keyResultCompletionRate(): number {
    if (this.totalKeyResults === 0) return 0;
    return (this.completedKeyResults / this.totalKeyResults) * 100;
  }

  /**
   * 高权重关键结果的进度
   * 权重大于20的关键结果的加权进度
   */
  get highPriorityProgress(): number {
    const highPriorityKeyResults = this.keyResults.filter((kr) => kr.weight > 20);
    if (highPriorityKeyResults.length === 0) return this.weightedProgress;

    const totalWeight = highPriorityKeyResults.reduce((sum, kr) => sum + kr.weight, 0);
    if (totalWeight === 0) return 0;

    const weightedSum = highPriorityKeyResults.reduce((sum, kr) => {
      return sum + kr.calculatedProgress * kr.weight;
    }, 0);

    return weightedSum / totalWeight;
  }

  /**
   * 超额完成的关键结果数量
   */
  get overAchievedKeyResults(): number {
    return this.keyResults.filter((kr) => kr.isOverAchieved).length;
  }

  /**
   * 今日进度增量
   * 基于今天的GoalRecord记录计算今日的进度增长
   */
  get todayProgress(): number {
    if (this.keyResults.length === 0) return 0;

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999,
    );

    // 获取今日的所有记录
    const todayRecords = this.records.filter((record) => {
      const recordDate = record.createdAt;
      return recordDate >= todayStart && recordDate <= todayEnd;
    });

    if (todayRecords.length === 0) return 0;

    // 按 KeyResult 分组计算今日进度变化
    const keyResultProgressMap = new Map<string, number>();

    // 为每个 KeyResult 初始化今日进度
    this.keyResults.forEach((kr) => {
      keyResultProgressMap.set(kr.uuid, 0);
    });

    // 计算每个 KeyResult 今日的进度变化
    todayRecords.forEach((record) => {
      const keyResult = this.keyResults.find((kr) => kr.uuid === record.keyResultUuid);
      if (!keyResult) return;

      // 根据记录值计算进度变化
      // 这里假设 record.value 是增量值，需要转换为进度百分比
      const progressDelta = this.calculateProgressDeltaFromRecord(keyResult, record);

      const currentDelta = keyResultProgressMap.get(record.keyResultUuid) || 0;
      keyResultProgressMap.set(record.keyResultUuid, currentDelta + progressDelta);
    });

    // 计算加权的今日总进度
    let totalWeightedProgress = 0;
    let totalWeight = 0;

    keyResultProgressMap.forEach((progressDelta, keyResultUuid) => {
      const keyResult = this.keyResults.find((kr) => kr.uuid === keyResultUuid);
      if (keyResult && keyResult.weight > 0) {
        totalWeightedProgress += progressDelta * keyResult.weight;
        totalWeight += keyResult.weight;
      }
    });

    // 如果没有权重，使用平均值
    if (totalWeight === 0) {
      const totalProgress = Array.from(keyResultProgressMap.values()).reduce(
        (sum, delta) => sum + delta,
        0,
      );
      return this.keyResults.length > 0 ? totalProgress / this.keyResults.length : 0;
    }

    return totalWeightedProgress / totalWeight;
  }

  /**
   * 从记录计算进度变化
   * 根据 KeyResult 的类型和记录值计算实际的进度变化百分比
   */
  protected calculateProgressDeltaFromRecord(
    keyResult: KeyResultCore,
    record: GoalRecordCore,
  ): number {
    if (!keyResult || keyResult.targetValue === 0) return 0;

    // 计算这次记录相对于目标值的进度百分比
    const progressDelta = (record.value / keyResult.targetValue) * 100;

    // 确保进度变化在合理范围内 (0-100%)
    return Math.max(0, Math.min(100, progressDelta));
  }

  /**
   * 获取今日记录统计
   */
  get todayRecordsStats(): {
    totalRecords: number;
    keyResultsWithRecords: number;
    averageRecordValue: number;
    totalRecordValue: number;
  } {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999,
    );

    const todayRecords = this.records.filter((record) => {
      const recordDate = record.createdAt;
      return recordDate >= todayStart && recordDate <= todayEnd;
    });

    const uniqueKeyResults = new Set(todayRecords.map((record) => record.keyResultUuid));
    const totalRecordValue = todayRecords.reduce((sum, record) => sum + record.value, 0);

    return {
      totalRecords: todayRecords.length,
      keyResultsWithRecords: uniqueKeyResults.size,
      averageRecordValue: todayRecords.length > 0 ? totalRecordValue / todayRecords.length : 0,
      totalRecordValue,
    };
  }

  /**
   * 进度状态分类
   */
  get progressStatus():
    | 'not-started'
    | 'in-progress'
    | 'nearly-completed'
    | 'completed'
    | 'over-achieved' {
    const progress = this.calculatedProgress;

    if (progress === 0) return 'not-started';
    if (progress >= 100) {
      return this.overAchievedKeyResults > 0 ? 'over-achieved' : 'completed';
    }
    if (progress >= 80) return 'nearly-completed';
    return 'in-progress';
  }

  /**
   * 目标健康度评分
   * 综合考虑进度、时间、关键结果分布等因素
   */
  get healthScore(): number {
    if (this.keyResults.length === 0) return 0;

    // 进度得分 (40%)
    const progressScore = this.calculatedProgress * 0.4;

    // 时间得分 (30%)
    const timeProgress = this.getTimeProgress();
    const timeScore = Math.max(0, 100 - Math.abs(this.calculatedProgress - timeProgress)) * 0.3;

    // 分布得分 (20%) - 关键结果进度分布的均匀性
    const distributionScore = this.getProgressDistributionScore() * 0.2;

    // 完成率得分 (10%)
    const completionScore = this.keyResultCompletionRate * 0.1;

    return Math.min(100, progressScore + timeScore + distributionScore + completionScore);
  }

  /**
   * 获取时间进度百分比
   */
  protected getTimeProgress(): number {
    const now = Date.now();
    const start = this._startTime.getTime();
    const end = this._endTime.getTime();

    if (now <= start) return 0;
    if (now >= end) return 100;

    return ((now - start) / (end - start)) * 100;
  }

  /**
   * 计算进度分布得分
   * 评估关键结果进度的均匀性
   */
  protected getProgressDistributionScore(): number {
    if (this.keyResults.length <= 1) return 100;

    const progresses = this.keyResults.map((kr) => kr.calculatedProgress);
    const mean = progresses.reduce((sum, p) => sum + p, 0) / progresses.length;
    const variance =
      progresses.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / progresses.length;
    const standardDeviation = Math.sqrt(variance);

    // 标准差越小，分布越均匀，得分越高
    return Math.max(0, 100 - standardDeviation);
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

  // ===== 共享辅助方法 =====
  protected updateVersion(): void {
    this._version++;
    this._lifecycle.updatedAt = new Date();
  }

  // ===== 抽象方法（由子类实现）=====
  abstract toDTO(): GoalContracts.GoalDTO;

  // static abstract fromDTO<T extends GoalCore>(dto: GoalContracts.GoalDTO): T; 子类中实现
  abstract pause(): void;
  abstract activate(): void;
  abstract complete(): void;
  abstract archive(): void;
}
