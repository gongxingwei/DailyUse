import { AggregateRoot } from "@/shared/domain/aggregateRoot";
import { TimeUtils } from "@/shared/utils/myDateTimeUtils";
import type { DateTime } from "@/shared/types/myDateTime";
import type { IGoal, IGoalCreateDTO, IKeyResult, IRecord } from "../types/goal";
import { KeyResult } from "./keyResult";
import { Record } from "./record";
import { v4 as uuidv4 } from 'uuid';

/**
 * 目标领域实体
 * 负责目标的业务逻辑和数据管理
 */
export class Goal extends AggregateRoot implements IGoal {
  private _title: string;
  private _description?: string;
  private _color: string;
  private _dirId: string;
  private _startTime: DateTime;
  private _endTime: DateTime;
  private _note?: string;
  private _keyResults: KeyResult[];
  private _records: Record[];
  private _analysis: IGoal['analysis'];
  private _lifecycle: IGoal['lifecycle'];
  private _analytics: IGoal['analytics'];
  private _version: number;

  constructor(
    id: string,
    title: string,
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
    super(id);
    const now = TimeUtils.now();

    this._title = title;
    this._description = options?.description;
    this._color = options?.color || "#FF5733";
    this._dirId = options?.dirId || "";
    this._startTime = options?.startTime || now;
    this._endTime = options?.endTime || TimeUtils.addDays(now, 30);
    this._note = options?.note;
    this._keyResults = [];
    this._records = [];
    
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

  // Getters
  get title(): string {
    return this._title;
  }

  get description(): string | undefined {
    return this._description;
  }

  get color(): string {
    return this._color;
  }

  get dirId(): string {
    return this._dirId;
  }

  get startTime(): DateTime {
    return this._startTime;
  }

  get endTime(): DateTime {
    return this._endTime;
  }

  get note(): string | undefined {
    return this._note;
  }

  get keyResults(): IKeyResult[] {
    return this._keyResults.map(kr => kr.toDTO());
  }

  get records(): IRecord[] {
    return this._records.map(r => r.toDTO());
  }

  get analysis(): IGoal['analysis'] {
    return this._analysis;
  }

  get lifecycle(): IGoal['lifecycle'] {
    return this._lifecycle;
  }

  get analytics(): IGoal['analytics'] {
    return this._analytics;
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
    title?: string;
    description?: string;
    color?: string;
    dirId?: string;
    startTime?: DateTime;
    endTime?: DateTime;
    note?: string;
  }): void {
    if (updates.title !== undefined) {
      if (!updates.title.trim()) {
        throw new Error("目标标题不能为空");
      }
      this._title = updates.title;
    }

    if (updates.description !== undefined) {
      this._description = updates.description;
    }

    if (updates.color !== undefined) {
      this._color = updates.color;
    }

    if (updates.dirId !== undefined) {
      this._dirId = updates.dirId;
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
    const keyResult = this._keyResults.find(kr => kr.id === keyResultId);
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
    const keyResult = this._keyResults.find(kr => kr.id === keyResultId);
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
    const index = this._keyResults.findIndex(kr => kr.id === keyResultId);
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
    const keyResult = this._keyResults.find(kr => kr.id === keyResultId);
    if (!keyResult) {
      throw new Error(`关键结果不存在: ${keyResultId}`);
    }

    if (value <= 0) {
      throw new Error("记录值必须大于0");
    }

    // 创建记录
    const record = new Record(
      uuidv4(),
      this.id,
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
    const record = this._records.find(r => r.id === recordId);
    if (!record) {
      throw new Error(`记录不存在: ${recordId}`);
    }

    const keyResult = this._keyResults.find(kr => kr.id === record.keyResultId);
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
    const recordIndex = this._records.findIndex(r => r.id === recordId);
    if (recordIndex === -1) {
      throw new Error(`记录不存在: ${recordId}`);
    }

    const record = this._records[recordIndex];
    const keyResult = this._keyResults.find(kr => kr.id === record.keyResultId);
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

  /**
   * 重新计算分析数据
   */
  private recalculateAnalytics(): void {
    const totalKeyResults = this._keyResults.length;
    if (totalKeyResults === 0) {
      this._analytics = {
        overallProgress: 0,
        weightedProgress: 0,
        completedKeyResults: 0,
        totalKeyResults: 0,
      };
      return;
    }

    const completedKeyResults = this._keyResults.filter(kr => kr.isCompleted).length;
    const overallProgress = (completedKeyResults / totalKeyResults) * 100;

    // 计算加权进度
    const totalWeight = this._keyResults.reduce((sum, kr) => sum + kr.weight, 0);
    const weightedProgress = totalWeight > 0 
      ? this._keyResults.reduce((sum, kr) => sum + (kr.progress * kr.weight), 0) / totalWeight
      : 0;

    this._analytics = {
      overallProgress: Math.round(overallProgress * 100) / 100,
      weightedProgress: Math.round(weightedProgress * 100) / 100,
      completedKeyResults,
      totalKeyResults,
    };

    // 如果所有关键结果都完成，标记目标为完成
    if (overallProgress >= 100 && this._lifecycle.status === "active") {
      this._lifecycle.status = "completed";
    } else if (overallProgress < 100 && this._lifecycle.status === "completed") {
      this._lifecycle.status = "active";
    }
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
      id: this.id,
      title: this._title,
      description: this._description,
      color: this._color,
      dirId: this._dirId,
      startTime: this._startTime,
      endTime: this._endTime,
      note: this._note,
      keyResults: this._keyResults.map(kr => kr.toDTO()),
      records: this._records.map(r => r.toDTO()),
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
        id: this.id,
        title: this._title,
        description: this._description,
        color: this._color,
        dirId: this._dirId,
        startTime: JSON.parse(JSON.stringify(this._startTime)),
        endTime: JSON.parse(JSON.stringify(this._endTime)),
        note: this._note,
        keyResults: this._keyResults.map(kr => kr.toDTO()),
        records: this._records.map(r => r.toDTO()),
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
    const goal = new Goal(data.id, data.title, {
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
    
    // 恢复其他属性
    goal._lifecycle = data.lifecycle;
    goal._analytics = data.analytics;
    goal._version = data.version;

    return goal;
  }

  /**
   * 从创建数据传输对象创建目标
   */
  static fromCreateDTO(id: string, data: IGoalCreateDTO): Goal {
    const goal = new Goal(id, data.title, {
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

  /**
   * 验证目标数据
   */
  static validate(data: IGoalCreateDTO): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.title?.trim()) {
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
}
