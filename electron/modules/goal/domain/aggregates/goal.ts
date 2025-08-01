import { addDays } from "date-fns";
import { AggregateRoot } from "@/shared/domain/aggregateRoot";
import { IGoal } from "@common/modules/goal";
import { KeyResult } from "../entities/keyResult";
import { GoalRecord } from "../entities/record";
import { GoalReview } from "../entities/goalReview";

export class Goal extends AggregateRoot implements IGoal {
  private _name: string;
  private _description?: string;
  private _color: string;
  private _dirUuid?: string;
  private _startTime: Date;
  private _endTime: Date;
  private _note?: string;
  private _keyResults: KeyResult[];
  private _records: GoalRecord[];
  private _reviews: GoalReview[];
  private _analysis: { motive: string; feasibility: string };
  private _lifecycle: {
    createdAt: Date;
    updatedAt: Date;
    status: "active" | "completed" | "paused" | "archived";
  };
  private _analytics: {
    overallProgress: number;
    weightedProgress: number;
    completedKeyResults: number;
    totalKeyResults: number;
  };
  private _version: number;

  constructor(params: {
    uuid?: string;
    name: string;
    description?: string;
    color: string;
    dirUuid?: string;
    note?: string;
    analysis: {
      motive?: string;
      feasibility?: string;
    };
    startTime?: Date;
    endTime?: Date;
  }) {
    super(params.uuid || Goal.generateId());
    const now = new Date();

    this._name = params.name || "";
    this._description = params.description;
    this._color = params.color || "#FF5733";
    this._dirUuid = params.dirUuid;
    this._startTime = params.startTime || now;
    this._endTime = params.endTime || addDays(now, 30); // 默认结束时间为开始时间后30天
    this._note = params.note;
    this._keyResults = [];
    this._records = [];
    this._reviews = [];

    this._analysis = {
      motive: params.analysis?.motive ?? "",
      feasibility: params.analysis?.feasibility ?? "",
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

  // getter/setter 相关代码
  get name(): string {
    return this._name;
  }
  set name(value: string) {
    if (!value.trim()) throw new Error("目标标题不能为空");
    this._name = value;
    this._lifecycle.updatedAt = new Date();
    this._version++;
  }

  get description(): string | undefined {
    return this._description;
  }
  set description(value: string | undefined) {
    this._description = value;
    this._lifecycle.updatedAt = new Date();
    this._version++;
  }

  get color(): string {
    return this._color;
  }
  set color(value: string) {
    this._color = value;
    this._lifecycle.updatedAt = new Date();
    this._version++;
  }

  get dirUuid(): string | undefined {
    return this._dirUuid;
  }
  set dirUuid(value: string | undefined) {
    this._dirUuid = value;
    this._lifecycle.updatedAt = new Date();
    this._version++;
  }

  get startTime(): Date {
    return this._startTime;
  }
  set startTime(value: Date) {
    if (value.getTime() >= this._endTime.getTime()) {
      throw new Error("开始时间必须早于结束时间");
    }
    this._startTime = value;
    this._lifecycle.updatedAt = new Date();
    this._version++;
  }

  get endTime(): Date {
    return this._endTime;
  }
  set endTime(value: Date) {
    if (value.getTime() <= this._startTime.getTime()) {
      throw new Error("结束时间必须晚于开始时间");
    }
    this._endTime = value;
    this._lifecycle.updatedAt = new Date();
    this._version++;
  }

  get note(): string | undefined {
    return this._note;
  }
  set note(value: string | undefined) {
    this._note = value;
    this._lifecycle.updatedAt = new Date();
    this._version++;
  }

  get keyResults(): KeyResult[] {
    return this._keyResults;
  }
  get records(): GoalRecord[] {
    return this._records;
  }
  get reviews(): GoalReview[] {
    return this._reviews;
  }
  get analysis(): { motive: string; feasibility: string } {
    return this._analysis;
  }
  get lifecycle(): {
    createdAt: Date;
    updatedAt: Date;
    status: "active" | "completed" | "paused" | "archived";
  } {
    return this._lifecycle;
  }
  get analytics(): {
    overallProgress: number;
    weightedProgress: number;
    completedKeyResults: number;
    totalKeyResults: number;
  } {
    return this._analytics;
  }
  get version(): number {
    return this._version;
  }

  /**
   * 添加关键结果
   */
  addKeyResult(keyResult: KeyResult): void {
    this._keyResults.push(keyResult);
    this._lifecycle.updatedAt = new Date();
    this._version++;
  }

  /**
   * 移除关键结果
   */
  removeKeyResult(uuid: string): void {
    this._keyResults = this._keyResults.filter((kr) => kr.uuid !== uuid);
    this._lifecycle.updatedAt = new Date();
    this._version++;
  }

  /**
   * 更新关键结果
   */
  updateKeyResult(updated: KeyResult): void {
    const idx = this._keyResults.findIndex((kr) => kr.uuid === updated.uuid);
    if (idx !== -1) {
      this._keyResults[idx] = updated;
      this._lifecycle.updatedAt = new Date();
      this._version++;
    }
  }

  /**
   * 增加关键结果进度（通过 uuid）
   */
  increaseKeyResultProgress(keyResultUuid: string, increment: number): void {
    const keyResult = this._keyResults.find((kr) => kr.uuid === keyResultUuid);
    if (keyResult) {
      this.increaseKeyResultProgressByKR(keyResult, increment);
    }
  }

  /**
   * 增加关键结果进度（通过对象）
   */
  increaseKeyResultProgressByKR(keyResult: KeyResult, increment: number): void {
    keyResult.currentValue += increment;
    this._lifecycle.updatedAt = new Date();
    this._version++;
  }

  /**
   * 添加记录
   */
  addGoalRecord(record: GoalRecord): void {
    const { keyResultUuid, value } = record;
    const keyResult = this._keyResults.find((kr) => kr.uuid === keyResultUuid);
    if (!keyResult) {
      throw new Error("关键结果不存在，无法添加记录");
    }
    this.increaseKeyResultProgressByKR(keyResult, value);
    this._records.push(record);
    this._lifecycle.updatedAt = new Date();
    this._version++;
  }

  /**
   * 移除记录
   */
  removeGoalRecord(uuid: string): void {
    this._records = this._records.filter((r) => r.uuid !== uuid);
    this._lifecycle.updatedAt = new Date();
    this._version++;
  }

  /**
   * 添加目标复盘
   */
  addReview(review: GoalReview): void {
    this._reviews.push(review);
    this._lifecycle.updatedAt = new Date();
    this._version++;
  }

  /**
   * 移除目标复盘
   */
  removeReview(uuid: string): void {
    this._reviews = this._reviews.filter((rv) => rv.uuid !== uuid);
    this._lifecycle.updatedAt = new Date();
    this._version++;
  }

  /**
   * 归档目标
   */
  archive(): void {
    this._lifecycle.status = "archived";
    this._lifecycle.updatedAt = new Date();
    this._version++;
  }

  /**
   * 完成目标
   */
  complete(): void {
    this._lifecycle.status = "completed";
    this._lifecycle.updatedAt = new Date();
    this._version++;
  }

  /**
   * 暂停目标
   */
  pause(): void {
    this._lifecycle.status = "paused";
    this._lifecycle.updatedAt = new Date();
    this._version++;
  }

  /**
   * 激活目标
   */
  activate(): void {
    this._lifecycle.status = "active";
    this._lifecycle.updatedAt = new Date();
    this._version++;
  }

  /**
   * 计算整体进度
   */
  calculateProgress(): void {
    if (this._keyResults.length === 0) {
      this._analytics.overallProgress = 0;
      this._analytics.weightedProgress = 0;
      this._analytics.completedKeyResults = 0;
      this._analytics.totalKeyResults = 0;
      return;
    }
    let totalProgress = 0;
    let weightedProgress = 0;
    let completed = 0;
    let totalWeight = 0;
    this._keyResults.forEach((kr) => {
      totalProgress += kr.progress;
      weightedProgress += kr.weightedProgress;
      totalWeight += kr.weight;
      if (kr.isCompleted) completed++;
    });
    this._analytics.overallProgress = Math.round(
      totalProgress / this._keyResults.length
    );
    this._analytics.weightedProgress = Math.round(weightedProgress);
    this._analytics.completedKeyResults = completed;
    this._analytics.totalKeyResults = this._keyResults.length;
  }

  /**
   * 获取某个关键结果的所有记录
   */
  getGoalRecordsByKeyResult(keyResultUuid: string): GoalRecord[] {
    return this._records.filter((r) => r.keyResultUuid === keyResultUuid);
  }

  /**
   * 获取最新一次复盘
   */
  getLatestReview(): GoalReview | undefined {
    if (this._reviews.length === 0) return undefined;
    return this._reviews.reduce((latest, curr) =>
      curr.reviewDate > latest.reviewDate ? curr : latest
    );
  }

  static isGoal(obj: any): obj is Goal {
    return (
      obj instanceof Goal ||
      (obj &&
        typeof obj === "object" &&
        "uuid" in obj &&
        "name" in obj &&
        "dirUuid" in obj)
    );
  }

  /**
   * 保证返回 Goal 实例或 null
   * @param goal 可能为 DTO、实体或 null
   */
  static ensureGoal(goal: IGoal | Goal | null): Goal | null {
    if (Goal.isGoal(goal)) {
      return goal instanceof Goal ? goal : Goal.fromDTO(goal);
    } else {
      return null;
    }
  }

  /**
   * 保证返回 Goal 实例，永不为 null
   * @param goal 可能为 DTO、实体或 null
   */
  static ensureGoalNeverNull(goal: IGoal | Goal | null): Goal {
    if (Goal.isGoal(goal)) {
      return goal instanceof Goal ? goal : Goal.fromDTO(goal);
    } else {
      return Goal.forCreate();
    }
  }

  /**
   * 转为接口数据
   */
  toDTO(): IGoal {
    return {
      uuid: this.uuid,
      name: this._name,
      description: this._description,
      color: this._color,
      dirUuid: this._dirUuid,
      startTime: this._startTime,
      endTime: this._endTime,
      note: this._note,
      keyResults: this._keyResults.map((kr) => kr.toDTO()),
      records: this._records.map((r) => r.toDTO()),
      reviews: this._reviews.map((rv) => rv.toDTO()),
      analysis: { ...this._analysis },
      lifecycle: { ...this._lifecycle },
      version: this._version,
    };
  }

  /**
   * 从接口数据创建实例
   */
  static fromDTO(dto: IGoal): Goal {
    const goal = new Goal({
      uuid: dto.uuid,
      name: dto.name,
      description: dto.description,
      color: dto.color,
      dirUuid: dto.dirUuid,
      note: dto.note,
      analysis: { ...dto.analysis },
      startTime: typeof dto.startTime === 'string' ? new Date(dto.startTime) : dto.startTime,
      endTime: typeof dto.endTime === 'string' ? new Date(dto.endTime) : dto.endTime,
    });
    goal._keyResults = dto.keyResults.map((kr) => KeyResult.fromDTO(kr));
    goal._records = dto.records.map((r) => GoalRecord.fromDTO(r));
    goal._reviews = dto.reviews.map((rv) => GoalReview.fromDTO(rv));
    goal._lifecycle = { 
      createdAt: new Date(dto.lifecycle.createdAt),
      updatedAt: new Date(dto.lifecycle.updatedAt),
      status: dto.lifecycle.status,
     };
    goal._version = dto.version;
    return goal;
  }

  /**
   * 克隆当前对象
   */
  clone(): Goal {
    // 用 toDTO 再 fromDTO，确保深拷贝
    return Goal.fromDTO(this.toDTO());
  }

  /**
   * 创建一个初始化对象（用于新建表单）
   */
  static forCreate(): Goal {
    return new Goal({
      name: "",
      color: "#FF5733",
      analysis: {},
    });
  }
}
