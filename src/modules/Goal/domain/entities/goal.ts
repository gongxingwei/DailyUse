import { AggregateRoot } from "@/shared/domain/aggregateRoot";
import { TimeUtils } from "@/shared/utils/myDateTimeUtils";
import type { DateTime } from "@/shared/types/myDateTime";
import type { IGoal, IGoalCreateDTO, IKeyResult, IRecord, IGoalReview } from "@common/modules/goal/types/goal";
import { KeyResult } from "./keyResult";
import { Record } from "./record";
import { GoalReview } from "./goalReview";
import { v4 as uuidv4 } from 'uuid';

/**
 * 目标领域实体
 * 负责目标的业务逻辑和数据管理
 */
export class Goal extends AggregateRoot implements IGoal {
  private _name: string;
  private _description?: string;
  private _color: string;
  private _dirUuid: string;
  private _startTime: DateTime;
  private _endTime: DateTime;
  private _note?: string;
  private _keyResults: KeyResult[];
  private _records: Record[];
  private _reviews: GoalReview[];
  private _analysis: IGoal['analysis'];
  private _lifecycle: IGoal['lifecycle'];
  private _analytics: IGoal['analytics'];
  private _version: number;

  constructor(
    uuid?: string,
    name?: string,
    options?: {
      description?: string;
      color?: string;
      dirId?: string;
      startTime?: DateTime;
      endTime?: DateTime;
      note?: string;
      analysis?: {
        motive: string;
        feasibility: string;
      };
    }
  ) {
    super(uuid || Goal.generateId());
    const now = TimeUtils.now();

    this._name = name || '';
    this._description = options?.description || undefined;
    this._color = options?.color || "#FF5733";
    this._dirUuid = options?.dirId || "";
    this._startTime = options?.startTime || now;
    this._endTime = options?.endTime || TimeUtils.addDays(now, 30);
    this._note = options?.note;
    this._keyResults = [];
    this._records = [];
    this._reviews = [];
    
    this._analysis = options?.analysis || {
      motive: "",
      feasibility: "",
    };

    this._lifecycle = {
      createdAt: now,
      updatedAt: now,
      status: "active",
    };

    this._analytics = {
      overallProgress: 0,
      weightedProgress: 0,
      completedKeyResults: 0,
      totalKeyResults: 0,
    };

    this._version = 1;
  }

  get name(): string {
    return this._name;
  }
  set name(value: string) {
    if (!value.trim()) throw new Error("目标标题不能为空");
    this._name = value;
    this._lifecycle.updatedAt = TimeUtils.now();
    this._version++;
  }

  get description(): string | undefined {
    return this._description;
  }
  set description(value: string | undefined) {
    this._description = value;
    this._lifecycle.updatedAt = TimeUtils.now();
    this._version++;
  }

  get color(): string {
    return this._color;
  }
  set color(value: string) {
    this._color = value;
    this._lifecycle.updatedAt = TimeUtils.now();
    this._version++;
  }

  get dirId(): string {
    return this._dirUuid;
  }
  set dirId(value: string) {
    this._dirUuid = value;
    this._lifecycle.updatedAt = TimeUtils.now();
    this._version++;
  }

  get startTime(): DateTime {
    return this._startTime;
  }
  set startTime(value: DateTime) {
    if (value.timestamp >= this._endTime.timestamp) {
      throw new Error("开始时间必须早于结束时间");
    }
    this._startTime = value;
    this._lifecycle.updatedAt = TimeUtils.now();
    this._version++;
  }

  get endTime(): DateTime {
    return this._endTime;
  }
  set endTime(value: DateTime) {
    if (value.timestamp <= this._startTime.timestamp) {
      throw new Error("结束时间必须晚于开始时间");
    }
    this._endTime = value;
    this._lifecycle.updatedAt = TimeUtils.now();
    this._version++;
  }

  get note(): string | undefined {
    return this._note;
  }
  set note(value: string | undefined) {
    this._note = value;
    this._lifecycle.updatedAt = TimeUtils.now();
    this._version++;
  }

  get keyResults(): KeyResult[] {
    return this._keyResults;
  }
  set keyResults(value: KeyResult[]) {
    this._keyResults = value;
    this._lifecycle.updatedAt = TimeUtils.now();
    this._version++;
  }

  get records(): Record[] {
    return this._records;
  }
  set records(value: Record[]) {
    this._records = value;
    this._lifecycle.updatedAt = TimeUtils.now();
    this._version++;
  }

  get reviews(): GoalReview[] {
    return this._reviews;
  }
  set reviews(value: GoalReview[]) {
    this._reviews = value;
    this._lifecycle.updatedAt = TimeUtils.now();
    this._version++;
  }

  get analysis(): IGoal['analysis'] {
    return this._analysis;
  }
  set analysis(value: IGoal['analysis']) {
    this._analysis = value;
    this._lifecycle.updatedAt = TimeUtils.now();
    this._version++;
  }

  get lifecycle(): IGoal['lifecycle'] {
    return this._lifecycle;
  }
  set lifecycle(value: IGoal['lifecycle']) {
    this._lifecycle = value;
    this._version++;
  }

  get analytics(): IGoal['analytics'] {
    return this._analytics;
  }
  set analytics(value: IGoal['analytics']) {
    this._analytics = value;
    this._lifecycle.updatedAt = TimeUtils.now();
    this._version++;
  }

  get version(): number {
    return this._version;
  }

  /**
   * 是否已过期
   */
  get isExpired(): boolean {
    return TimeUtils.now().timestamp > this._endTime.timestamp;
  }

  /**
   * 是否已完成
   */
  get isCompleted(): boolean {
    return this._analytics.overallProgress >= 100;
  }

  /**
   * 剩余天数
   */
  get remainingDays(): number {
    const diff = this._endTime.timestamp - TimeUtils.now().timestamp;
    return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
  }

  /**
   * 更新基本信息
   */
  updateBasicInfo(updates: {
    name?: string;
    description?: string;
    color?: string;
    dirId?: string;
    startTime?: DateTime;
    endTime?: DateTime;
    note?: string;
  }): void {
    if (updates.name !== undefined) {
      if (!updates.name.trim()) {
        throw new Error("目标标题不能为空");
      }
      this._name = updates.name;
    }

    if (updates.description !== undefined) {
      this._description = updates.description;
    }

    if (updates.color !== undefined) {
      this._color = updates.color;
    }

    if (updates.dirId !== undefined) {
      this._dirUuid = updates.dirId;
    }

    if (updates.startTime !== undefined) {
      this._startTime = updates.startTime;
    }

    if (updates.endTime !== undefined) {
      if (updates.endTime.timestamp <= this._startTime.timestamp) {
        throw new Error("结束时间必须晚于开始时间");
      }
      this._endTime = updates.endTime;
    }

    if (updates.note !== undefined) {
      this._note = updates.note;
    }

    this._lifecycle.updatedAt = TimeUtils.now();
    this._version++;
  }

  // ========== 单独属性更新方法 ==========

  /**
   * 更新标题
   */
  updateTitle(name: string): void {
    if (!name.trim()) {
      throw new Error("目标标题不能为空");
    }
    this._name = name;
    this._lifecycle.updatedAt = TimeUtils.now();
    this._version++;
  }

  /**
   * 更新描述
   */
  updateDescription(description?: string): void {
    this._description = description;
    this._lifecycle.updatedAt = TimeUtils.now();
    this._version++;
  }

  /**
   * 更新颜色
   */
  updateColor(color: string): void {
    this._color = color;
    this._lifecycle.updatedAt = TimeUtils.now();
    this._version++;
  }

  /**
   * 更新目录ID
   */
  updateDirId(dirId: string): void {
    this._dirUuid = dirId;
    this._lifecycle.updatedAt = TimeUtils.now();
    this._version++;
  }

  /**
   * 更新开始时间
   */
  updateStartTime(startTime: DateTime): void {
    if (startTime.timestamp >= this._endTime.timestamp) {
      throw new Error("开始时间必须早于结束时间");
    }
    this._startTime = startTime;
    this._lifecycle.updatedAt = TimeUtils.now();
    this._version++;
  }

  /**
   * 更新结束时间
   */
  updateEndTime(endTime: DateTime): void {
    if (endTime.timestamp <= this._startTime.timestamp) {
      throw new Error("结束时间必须晚于开始时间");
    }
    this._endTime = endTime;
    this._lifecycle.updatedAt = TimeUtils.now();
    this._version++;
  }

  /**
   * 更新备注
   */
  updateNote(note?: string): void {
    this._note = note;
    this._lifecycle.updatedAt = TimeUtils.now();
    this._version++;
  }

  /**
   * 更新动机
   */
  updateMotive(motive: string): void {
    this._analysis.motive = motive;
    this._lifecycle.updatedAt = TimeUtils.now();
    this._version++;
  }

  /**
   * 更新可行性分析
   */
  updateFeasibility(feasibility: string): void {
    this._analysis.feasibility = feasibility;
    this._lifecycle.updatedAt = TimeUtils.now();
    this._version++;
  }

  /**
   * 更新分析信息
   */
  updateAnalysis(updates: {
    motive?: string;
    feasibility?: string;
  }): void {
    if (updates.motive !== undefined) {
      this._analysis.motive = updates.motive;
    }

    if (updates.feasibility !== undefined) {
      this._analysis.feasibility = updates.feasibility;
    }

    this._lifecycle.updatedAt = TimeUtils.now();
    this._version++;
  }

  /**
   * 添加关键结果
   */
  addKeyResult(keyResultData: {
    name: string;
    startValue: number;
    targetValue: number;
    currentValue: number;
    calculationMethod: 'sum' | 'average' | 'max' | 'min' | 'custom';
    weight: number;
  }): string {
    // 验证数据
    const validation = KeyResult.validate(keyResultData);
    if (!validation.isValid) {
      throw new Error(`关键结果数据无效: ${validation.errors.join(', ')}`);
    }

    const keyResultId = uuidv4();
    const keyResult = KeyResult.fromCreateDTO(keyResultId, keyResultData);
    
    this._keyResults.push(keyResult);
    this.recalculateAnalytics();
    
    this._lifecycle.updatedAt = TimeUtils.now();
    this._version++;

    return keyResultId;
  }

  /**
   * 更新关键结果
   */
  updateKeyResult(keyResultId: string, updates: {
    name?: string;
    targetValue?: number;
    weight?: number;
    calculationMethod?: 'sum' | 'average' | 'max' | 'min' | 'custom';
  }): void {
    const keyResult = this._keyResults.find(kr => kr.uuid === keyResultId);
    if (!keyResult) {
      throw new Error(`关键结果不存在: ${keyResultId}`);
    }

    keyResult.updateBasicInfo(updates);
    this.recalculateAnalytics();
    
    this._lifecycle.updatedAt = TimeUtils.now();
    this._version++;
  }

  /**
   * 更新关键结果当前值
   */
  updateKeyResultCurrentValue(keyResultId: string, currentValue: number): void {
    const keyResult = this._keyResults.find(kr => kr.uuid === keyResultId);
    if (!keyResult) {
      throw new Error(`关键结果不存在: ${keyResultId}`);
    }

    keyResult.updateCurrentValue(currentValue);
    this.recalculateAnalytics();
    
    this._lifecycle.updatedAt = TimeUtils.now();
    this._version++;
  }

  /**
   * 删除关键结果
   */
  removeKeyResult(keyResultId: string): void {
    const index = this._keyResults.findIndex(kr => kr.uuid === keyResultId);
    if (index === -1) {
      throw new Error(`关键结果不存在: ${keyResultId}`);
    }

    this._keyResults.splice(index, 1);
    this.recalculateAnalytics();
    
    this._lifecycle.updatedAt = TimeUtils.now();
    this._version++;
  }

  // ========== 记录管理方法 ==========

  /**
   * 添加记录并更新关键结果
   */
  addRecord(keyResultId: string, value: number, note?: string): Record {
    // 验证关键结果存在
    const keyResult = this._keyResults.find(kr => kr.uuid === keyResultId);
    if (!keyResult) {
      throw new Error(`关键结果不存在: ${keyResultId}`);
    }

    if (value <= 0) {
      throw new Error("记录值必须大于0");
    }

    // 创建记录
    const record = new Record(
      uuidv4(),
      this.uuid,
      keyResultId,
      value,
      TimeUtils.now(),
      note
    );

    this._records.push(record);

    // 更新关键结果当前值
    keyResult.addValue(value);

    // 重新计算分析数据
    this.recalculateAnalytics();

    this._lifecycle.updatedAt = TimeUtils.now();
    this._version++;

    return record;
  }

  /**
   * 更新记录
   */
  updateRecord(recordId: string, updates: {
    value?: number;
    note?: string;
  }): void {
    const record = this._records.find(r => r.uuid === recordId);
    if (!record) {
      throw new Error(`记录不存在: ${recordId}`);
    }

    const keyResult = this._keyResults.find(kr => kr.uuid === record.keyResultId);
    if (!keyResult) {
      throw new Error(`关键结果不存在: ${record.keyResultId}`);
    }

    // 如果更新值，需要调整关键结果当前值
    if (updates.value !== undefined && updates.value !== record.value) {
      if (updates.value <= 0) {
        throw new Error("记录值必须大于0");
      }

      const valueDiff = updates.value - record.value;
      keyResult.addValue(valueDiff);
      
      record.updateRecord({ value: updates.value });
    }

    if (updates.note !== undefined) {
      record.updateRecord({ note: updates.note });
    }

    // 重新计算分析数据
    this.recalculateAnalytics();

    this._lifecycle.updatedAt = TimeUtils.now();
    this._version++;
  }

  /**
   * 移除记录并调整关键结果
   */
  removeRecord(recordId: string): void {
    const recordIndex = this._records.findIndex(r => r.uuid === recordId);
    if (recordIndex === -1) {
      throw new Error(`记录不存在: ${recordId}`);
    }

    const record = this._records[recordIndex];
    const keyResult = this._keyResults.find(kr => kr.uuid === record.keyResultId);
    if (keyResult) {
      // 减去记录的值
      keyResult.addValue(-record.value);
    }

    this._records.splice(recordIndex, 1);

    // 重新计算分析数据
    this.recalculateAnalytics();

    this._lifecycle.updatedAt = TimeUtils.now();
    this._version++;
  }

  /**
   * 获取指定关键结果的所有记录
   */
  getRecordsByKeyResult(keyResultId: string): IRecord[] {
    return this._records
      .filter(r => r.keyResultId === keyResultId)
      .map(r => r.toDTO());
  }

  /**
   * 移除指定关键结果的所有记录
   */
  removeRecordsByKeyResult(keyResultId: string): void {
    const recordsToRemove = this._records.filter(r => r.keyResultId === keyResultId);
    
    // 移除记录
    this._records = this._records.filter(r => r.keyResultId !== keyResultId);

    // 如果有记录被移除，重新计算分析数据
    if (recordsToRemove.length > 0) {
      this.recalculateAnalytics();
      this._lifecycle.updatedAt = TimeUtils.now();
      this._version++;
    }
  }

  // ========== 复盘管理 ==========

  /**
   * 添加复盘
   */
  addReview(review: GoalReview): void {
    // 验证复盘是否属于当前目标
    if (review.goalUuid !== this.uuid) {
      throw new Error("复盘不属于当前目标");
    }

    // 检查是否已存在相同ID的复盘
    const existingReview = this._reviews.find(r => r.uuid === review.uuid);
    if (existingReview) {
      throw new Error(`复盘 ${review.uuid} 已存在`);
    }

    this._reviews.push(review);
    this._lifecycle.updatedAt = TimeUtils.now();
    this._version++;
  }

  /**
   * 更新复盘
   */
  updateReview(reviewId: string, updates: {
    name?: string;
    content?: Partial<IGoalReview['content']>;
    rating?: IGoalReview['rating'];
  }): void {
    const review = this._reviews.find(r => r.uuid === reviewId);
    if (!review) {
      throw new Error(`复盘 ${reviewId} 不存在`);
    }

    review.updateContent(updates);
    this._lifecycle.updatedAt = TimeUtils.now();
    this._version++;
  }

  /**
   * 移除复盘
   */
  removeReview(reviewId: string): void {
    const index = this._reviews.findIndex(r => r.uuid === reviewId);
    if (index === -1) {
      throw new Error(`复盘 ${reviewId} 不存在`);
    }

    this._reviews.splice(index, 1);
    this._lifecycle.updatedAt = TimeUtils.now();
    this._version++;
  }

  /**
   * 获取复盘
   */
  getReview(reviewId: string): GoalReview | null {
    return this._reviews.find(r => r.uuid === reviewId) || null;
  }

  /**
   * 获取按时间排序的复盘列表
   */
  getReviewsSortedByDate(): GoalReview[] {
    return [...this._reviews].sort((a, b) => 
      b.reviewDate.timestamp - a.reviewDate.timestamp
    );
  }

  /**
   * 获取特定类型的复盘
   */
  getReviewsByType(type: IGoalReview['type']): GoalReview[] {
    return this._reviews.filter(r => r.type === type);
  }

  /**
   * 创建目标状态快照（用于复盘）
   */
  createSnapshot(): IGoalReview['snapshot'] {
    const now = TimeUtils.now();
    
    return {
      snapshotDate: now,
      overallProgress: this._analytics.overallProgress,
      weightedProgress: this._analytics.weightedProgress,
      completedKeyResults: this._analytics.completedKeyResults,
      totalKeyResults: this._analytics.totalKeyResults,
      keyResultsSnapshot: this._keyResults.map(kr => ({
        uuid: kr.uuid,
        name: kr.name,
        progress: kr.progress,
        currentValue: kr.currentValue,
        targetValue: kr.targetValue,
      })),
    };
  }

  /**
   * 检查是否需要复盘提醒
   * 基于时间间隔和目标状态判断
   */
  shouldRemindReview(): {
    needsReview: boolean;
    reason: string;
    suggestedType: IGoalReview['type'];
  } {
    const now = TimeUtils.now();
    const daysSinceStart = Math.floor(
      (now.timestamp - this._startTime.timestamp) / (24 * 60 * 60 * 1000)
    );
    const totalDays = Math.floor(
      (this._endTime.timestamp - this._startTime.timestamp) / (24 * 60 * 60 * 1000)
    );
    const progressRatio = daysSinceStart / totalDays;

    // 获取最近的复盘
    const recentReviews = this.getReviewsSortedByDate();
    const lastReview = recentReviews[0];
    
    const daysSinceLastReview = lastReview 
      ? Math.floor((now.timestamp - lastReview.reviewDate.timestamp) / (24 * 60 * 60 * 1000))
      : daysSinceStart;

    // 检查各种复盘条件
    if (progressRatio >= 0.9 && !this.getReviewsByType('final').length) {
      return {
        needsReview: true,
        reason: "目标即将结束，建议进行最终复盘",
        suggestedType: "final"
      };
    }

    if (progressRatio >= 0.4 && progressRatio <= 0.6 && !this.getReviewsByType('midterm').length) {
      return {
        needsReview: true,
        reason: "目标已进行到中期，建议进行中期复盘",
        suggestedType: "midterm"
      };
    }

    if (daysSinceLastReview >= 7) {
      return {
        needsReview: true,
        reason: "距离上次复盘已超过一周",
        suggestedType: "weekly"
      };
    }

    if (daysSinceLastReview >= 30) {
      return {
        needsReview: true,
        reason: "距离上次复盘已超过一个月",
        suggestedType: "monthly"
      };
    }

    return {
      needsReview: false,
      reason: "暂时不需要复盘",
      suggestedType: "custom"
    };
  }

  /**
   * 获取复盘统计信息
   */
  getReviewStatistics(): {
    totalReviews: number;
    reviewsByType: { [K in IGoalReview['type']]: number };
    averageRating: number | null;
    lastReviewDate: DateTime | null;
    reviewFrequency: number; // 平均复盘间隔天数
  } {
    const reviews = this._reviews;
    const totalReviews = reviews.length;

    // 按类型统计
    const reviewsByType = {
      weekly: 0,
      monthly: 0,
      midterm: 0,
      final: 0,
      custom: 0,
    };

    let totalRating = 0;
    let ratedReviews = 0;

    reviews.forEach(review => {
      reviewsByType[review.type as keyof typeof reviewsByType]++;
      
      if (review.rating) {
        totalRating += review.overallRating || 0;
        ratedReviews++;
      }
    });

    // 计算平均评分
    const averageRating = ratedReviews > 0 ? totalRating / ratedReviews : null;

    // 获取最近复盘时间
    const sortedReviews = this.getReviewsSortedByDate();
    const lastReviewDate = sortedReviews.length > 0 ? sortedReviews[0].reviewDate : null;

    // 计算复盘频率
    let reviewFrequency = 0;
    if (reviews.length > 1) {
      const dates = reviews.map(r => r.reviewDate.timestamp).sort((a, b) => a - b);
      const intervals = [];
      for (let i = 1; i < dates.length; i++) {
        intervals.push((dates[i] - dates[i-1]) / (24 * 60 * 60 * 1000));
      }
      reviewFrequency = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    }

    return {
      totalReviews,
      reviewsByType,
      averageRating,
      lastReviewDate,
      reviewFrequency,
    };
  }

  /**
   * 计算目标完成进度
   */
  get progress(): number {
    if (this._analytics.totalKeyResults === 0) return 0;
    
    // 计算加权平均进度
    const weightedProgress = this._keyResults.reduce((sum, kr) => {
      return sum + (kr.weightedProgress);
    }, 0) / this._keyResults.reduce((sum, kr) => sum + kr.weight, 0);

    return Math.min(100, weightedProgress);
    
  }

  /**
   * 暂停目标
   */
  pause(): void {
    if (this._lifecycle.status !== "active") {
      throw new Error("只有活跃状态的目标可以暂停");
    }

    this._lifecycle.status = "paused";
    this._lifecycle.updatedAt = TimeUtils.now();
    this._version++;
  }

  /**
   * 恢复目标
   */
  resume(): void {
    if (this._lifecycle.status !== "paused") {
      throw new Error("只有暂停状态的目标可以恢复");
    }

    this._lifecycle.status = "active";
    this._lifecycle.updatedAt = TimeUtils.now();
    this._version++;
  }

  /**
   * 归档目标
   */
  archive(): void {
    this._lifecycle.status = "archived";
    this._lifecycle.updatedAt = TimeUtils.now();
    this._version++;
  }

  /**
   * 转换为数据传输对象
   */
  toDTO(): IGoal {
    const rawData = {
      uuid: this.uuid,
      name: this._name,
      description: this._description,
      color: this._color,
      dirId: this._dirUuid,
      startTime: this._startTime,
      endTime: this._endTime,
      note: this._note,
      keyResults: this._keyResults.map(kr => kr.toDTO()),
      records: this._records.map(r => r.toDTO()),
      reviews: this._reviews.map(r => r.toDTO()),
      analysis: this._analysis,
      lifecycle: this._lifecycle,
      analytics: this._analytics,
      version: this._version,
    };

    // 使用深度序列化确保返回纯净的 JSON 对象
    try {
      return JSON.parse(JSON.stringify(rawData));
    } catch (error) {
      console.error('❌ [Goal.toDTO] 序列化失败:', error);
      // 如果序列化失败，返回基本信息
      return {
        uuid: this.uuid,
        name: this._name,
        description: this._description,
        color: this._color,
        dirId: this._dirUuid,
        startTime: JSON.parse(JSON.stringify(this._startTime)),
        endTime: JSON.parse(JSON.stringify(this._endTime)),
        note: this._note,
        keyResults: this._keyResults.map(kr => kr.toDTO()),
        records: this._records.map(r => r.toDTO()),
        reviews: this._reviews.map(r => r.toDTO()),
        analysis: JSON.parse(JSON.stringify(this._analysis)),
        lifecycle: JSON.parse(JSON.stringify(this._lifecycle)),
        analytics: JSON.parse(JSON.stringify(this._analytics)),
        version: this._version,
      };
    }
  }

  /**
   * 导出完整数据（用于序列化）
   */
  toJSON(): IGoal {
    return this.toDTO();
  }

  /**
   * 从数据传输对象创建目标
   */
  static fromDTO(data: IGoal): Goal {
    const goal = new Goal(data.uuid, data.name, {
      description: data.description,
      color: data.color,
      dirId: data.dirId,
      startTime: data.startTime,
      endTime: data.endTime,
      note: data.note,
      analysis: data.analysis,
    });

    // 恢复关键结果
    goal._keyResults = data.keyResults.map(kr => KeyResult.fromDTO(kr));
    
    // 恢复记录
    goal._records = (data.records || []).map(r => Record.fromDTO(r));
    
    // 恢复复盘
    goal._reviews = (data.reviews || []).map(r => GoalReview.fromDTO(r));
    
    // 恢复其他属性
    goal._lifecycle = data.lifecycle;
    goal._analytics = data.analytics;
    goal._version = data.version;

    return goal;
  }

  /**
   * 从创建数据传输对象创建目标
   */
  static fromCreateDTO(uuid: string, data: IGoalCreateDTO): Goal {
    const goal = new Goal(uuid, data.name, {
      description: data.description,
      color: data.color,
      dirId: data.dirId,
      startTime: data.startTime,
      endTime: data.endTime,
      note: data.note,
      analysis: data.analysis,
    });

    // 添加关键结果
    data.keyResults.forEach(krData => {
      goal.addKeyResult(krData);
    });

    return goal;
  }

  clone(): Goal {
    const clonedGoal = new Goal(
      this.uuid,
      this._name,
      {
        description: this._description,
        color: this._color,
        dirId: this._dirUuid,
        startTime: this._startTime,
        endTime: this._endTime,
        note: this._note,
        analysis: { ...this._analysis },
      }
    );
    clonedGoal._keyResults = this._keyResults.map(kr => kr.clone());
    clonedGoal._records = this._records.map(r => r.clone());
    clonedGoal._reviews = this._reviews.map(r => r.clone());
    clonedGoal._lifecycle = { ...this._lifecycle };
    clonedGoal._analytics = { ...this._analytics };
    clonedGoal._version = this._version;
    return clonedGoal;
  }
  // ========== 私有方法 ==========

  /**
   * 重新计算分析数据
   * TODO: 实现分析数据的重新计算逻辑
   */
  private recalculateAnalytics(): void {
    // 暂时为空实现，避免编译错误
    // 后续需要实现具体的分析数据计算逻辑
  }

  
  // ========== 静态方法 ==========

  /**
   * 验证目标数据
   */
  static validate(data: IGoalCreateDTO): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.name?.trim()) {
      errors.push("目标标题不能为空");
    }

    if (!data.dirId?.trim()) {
      errors.push("目标目录不能为空");
    }

    if (data.endTime.timestamp <= data.startTime.timestamp) {
      errors.push("结束时间必须晚于开始时间");
    }

    // 验证关键结果
    if (!data.keyResults || data.keyResults.length === 0) {
      errors.push("至少需要一个关键结果");
    } else {
      data.keyResults.forEach((kr, index) => {
        const validation = KeyResult.validate(kr);
        if (!validation.isValid) {
          errors.push(`关键结果 ${index + 1}: ${validation.errors.join(', ')}`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // ========== 实例验证方法 ==========

  /**
   * 验证当前目标实例是否有效
   */
  isValid(): boolean {
    const errors = this.getValidationErrors();
    return Object.keys(errors).length === 0;
  }

  /**
   * 获取当前目标实例的验证错误
   */
  getValidationErrors(): { [key: string]: string } {
    const errors: { [key: string]: string } = {};

    if (!this._name?.trim()) {
      errors.name = "目标标题不能为空";
    }

    if (this._endTime.timestamp <= this._startTime.timestamp) {
      errors.endTime = "结束时间必须晚于开始时间";
    }

    // 验证目录ID不能为空
    if (!this._dirUuid?.trim()) {
      errors.dirId = "请选择目标文件夹";
    }

    // 验证关键结果（如果存在的话）
    if (this._keyResults && this._keyResults.length > 0) {
      this._keyResults.forEach((kr, index) => {
        try {
          // 简单验证关键结果的基本属性
          if (!kr.name?.trim()) {
            errors[`keyResult_${index}_name`] = `关键结果 ${index + 1} 名称不能为空`;
          }
          if (kr.targetValue <= kr.startValue) {
            errors[`keyResult_${index}_target`] = `关键结果 ${index + 1} 目标值必须大于起始值`;
          }
          if (kr.weight <= 0) {
            errors[`keyResult_${index}_weight`] = `关键结果 ${index + 1} 权重必须大于0`;
          }
        } catch (error) {
          errors[`keyResult_${index}`] = `关键结果 ${index + 1} 数据无效`;
        }
      });
    }

    return errors;
  }
}
