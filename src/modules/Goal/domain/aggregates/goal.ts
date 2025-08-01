import { addDays, isValid, differenceInDays, isSameDay } from "date-fns";
import { AggregateRoot } from "@/shared/domain/aggregateRoot";
import { IGoal } from "@common/modules/goal";
import { KeyResult } from "../entities/keyResult";
import { GoalRecord } from "../entities/record";
import { GoalReview } from "../entities/goalReview";

/**
 * 目标聚合根
 * 用于管理目标的所有业务逻辑，包括关键结果、记录、复盘等。
 */
export class Goal extends AggregateRoot implements IGoal {
  // ======================== 私有属性 ========================
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

  // ======================== 构造函数 ========================
  /**
   * 创建一个目标实例
   * @param params - 目标的初始化参数
   * @example
   * new Goal({
   *   name: "减肥",
   *   color: "#FF5733",
   *   analysis: { motive: "健康", feasibility: "高" },
   *   startTime: new Date(),
   *   endTime: addDays(new Date(), 30)
   * })
   */
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

  // ======================== Getter/Setter ========================
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

  set keyResults(value: KeyResult[]) {
    this._keyResults = value;
    this._lifecycle.updatedAt = new Date();
    this._version++;
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

  get overallProgress(): number {
  // 例如整体进度（可用你已有的 progress 逻辑）
  return this.progress;
}

get weightedProgress(): number {
  // 如果有特殊加权逻辑，写在这里
  return this.progress;
}

get completedKeyResults(): number {
  return this._keyResults.filter(kr => kr.progress >= 100).length;
}

get totalKeyResults(): number {
  return this._keyResults.length;
}

  get version(): number {
    return this._version;
  }

  // ======================== 业务方法 ========================

  /**
   * 获取所有关键结果的总权重
   * @returns 总权重
   */
  get totalWeight(): number {
    return this._keyResults.reduce((acc, kr) => acc + kr.weight, 0);
  }

  /**
   * 获取目标整体进度（加权平均，百分比）
   * @returns number 0~100
   */
  get progress(): number {
    if (this._keyResults.length === 0) return 0;
    const totalWeight = this.totalWeight;
    if (totalWeight === 0) return 0;
    // 先累加所有加权进度，再除以总权重
    const weightedSum = this._keyResults.reduce(
      (sum, kr) => sum + kr.progress * kr.weight,
      0
    );
    return Math.round(weightedSum / totalWeight);
  }

  /**
   * 获取时间进度
   * 0-1 之间的值，表示从开始时间到现在的进度
   * @returns number 0~1
   */
  get TimeProgress(): number {
    const now = new Date();
    const totalDays = differenceInDays(this.endTime, this.startTime);
    if (totalDays <= 0) return 0; // 如果总天数为0或负数，返回0
    const elapsedDays = differenceInDays(now, this.startTime);
    return Math.min(1, elapsedDays / totalDays);
  }

  /**
   * 获取当天的进度（根据当天所有记录加权计算）
   * @returns number 0~100
   */
  get todayProgress(): number {
    if (this._keyResults.length === 0) return 0;
    const today = new Date();
    const todayGoalRecords = this._records.filter((r) =>
      isSameDay(r.lifecycle.createdAt, today)
    );
    if (todayGoalRecords.length === 0) return 0;
    let todayWeight = 0;
    for (const kr of this._keyResults) {
      const krGoalRecords = todayGoalRecords.filter(
        (r) => r.keyResultUuid === kr.uuid
      );
      if (krGoalRecords.length > 0) {
        const sumValue = krGoalRecords.reduce((sum, r) => sum + r.value, 0);
        todayWeight += sumValue * kr.weight;
      }
    }
    return Math.round((todayWeight / this.totalWeight) * 100);
  }

  /**
   * 获取目标剩余天数
   * @returns number
   */
  get remainingDays(): number {
    const today = new Date();
    return differenceInDays(this.endTime, today);
  }

  /**
   * 获取某个关键结果的所有记录
   * @param keyResultUuid - 关键结果的 uuid
   * @returns 该关键结果的所有记录
   */
  getGoalRecordsByKeyResultUuid(keyResultUuid: string): GoalRecord[] {
    return this._records.filter((r) => r.keyResultUuid === keyResultUuid);
  }

  /**
   * 添加关键结果
   * @param keyResult - 关键结果实体
   * @throws 如果 uuid 已存在
   */
  addKeyResult(keyResult: KeyResult): void {
    if (this._keyResults.some((kr) => kr.uuid === keyResult.uuid)) {
      throw new Error("Key result already exists");
    }
    this._keyResults.push(keyResult);
    this._lifecycle.updatedAt = new Date();
    this._version++;
  }

  /**
   * 移除关键结果
   * @param keyResultUuid - 关键结果 uuid
   * @throws 如果未找到
   */
  removeKeyResult(keyResultUuid: string): void {
    const index = this._keyResults.findIndex((kr) => kr.uuid === keyResultUuid);
    if (index === -1) {
      throw new Error("Key result not found");
    }
    this._keyResults.splice(index, 1);
    this._lifecycle.updatedAt = new Date();
    this._version++;
  }

  /**
   * 更新关键结果
   * @param keyResult - 新的关键结果实体
   * @throws 如果未找到
   */
  updateKeyResult(keyResult: KeyResult): void {
    const index = this._keyResults.findIndex(
      (kr) => kr.uuid === keyResult.uuid
    );
    if (index === -1) {
      throw new Error("Key result not found");
    }
    this._keyResults[index] = keyResult;
    this._lifecycle.updatedAt = new Date();
    this._version++;
  }

  /**
   * 创建当前目标快照
   * @returns snapshot 对象
   * @example
   * {
   *   snapshotDate: Date,
   *   overallProgress: number,
   *   weightedProgress: number,
   *   completedKeyResults: number,
   *   totalKeyResults: number,
   *   keyResultsSnapshot: Array<{ uuid, name, progress, currentValue, targetValue }>
   * }
   */
  createSnapShot(): GoalReview["snapshot"] {
    return {
      snapshotDate: new Date(),
      overallProgress: this.overallProgress,
      weightedProgress: this.weightedProgress,
      completedKeyResults: this.completedKeyResults,
      totalKeyResults: this.totalKeyResults,
      keyResultsSnapshot: this._keyResults.map((kr) => ({
        uuid: kr.uuid,
        name: kr.name,
        progress: kr.progress,
        currentValue: kr.currentValue,
        targetValue: kr.targetValue,
      })),
    };
  }

  /**
   * 添加记录，并自动更新关键结果进度
   * @param record - 记录实体
   * @throws 如果关键结果不存在
   * @example
   * goal.addGoalRecord(new GoalRecord(...))
   */
  addGoalRecord(record: GoalRecord): void {
    const { keyResultUuid, value } = record;
    const keyResult = this._keyResults.find((kr) => kr.uuid === keyResultUuid);
    if (!keyResult) {
      throw new Error("关键结果不存在，无法添加记录");
    }
    keyResult.currentValue += value;
    this._records.push(record);
    this._lifecycle.updatedAt = new Date();
    this._version++;
  }

  /**
   * 移除记录
   * @param uuid - 记录 uuid
   */
  removeGoalRecord(uuid: string): void {
    this._records = this._records.filter((r) => r.uuid !== uuid);
    this._lifecycle.updatedAt = new Date();
    this._version++;
  }

  /**
   * 添加目标复盘
   * @param review - 复盘实体
   */
  addReview(review: GoalReview): void {
    this._reviews.push(review);
    this._lifecycle.updatedAt = new Date();
    this._version++;
  }

  /**
   * 移除目标复盘
   * @param uuid - 复盘 uuid
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

  // ======================== 工具方法 ========================

  /**
   * 判断对象是否为 Goal 实例
   * @param obj - 任意对象
   * @returns 是否为 Goal
   */
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
   * @param goal - 可能为 DTO、实体或 null
   * @returns Goal 或 null
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
   * @param goal - 可能为 DTO、实体或 null
   * @returns Goal
   */
  static ensureGoalNeverNull(goal: IGoal | Goal | null): Goal {
    if (Goal.isGoal(goal)) {
      return goal instanceof Goal ? goal : Goal.fromDTO(goal);
    } else {
      return Goal.forCreate();
    }
  }

  // ======================== 数据转换 ========================

  /**
   * 转为接口数据（DTO）
   * @returns IGoal 对象
   * @example
   * {
   *   uuid: string,
   *   name: string,
   *   description?: string,
   *   color: string,
   *   dirUuid?: string,
   *   startTime: Date,
   *   endTime: Date,
   *   note?: string,
   *   keyResults: KeyResultDTO[],
   *   records: GoalRecordDTO[],
   *   reviews: GoalReviewDTO[],
   *   analysis: { motive: string, feasibility: string },
   *   lifecycle: { createdAt: Date, updatedAt: Date, status: string },
   *   version: number
   * }
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
      keyResults: this._keyResults.map((kr) => {
        return KeyResult.isKeyResult(kr) ? kr.toDTO() : kr;
      }),
      records: this._records.map((r) => r.toDTO()),
      reviews: this._reviews.map((rv) => rv.toDTO()),
      analysis: { ...this._analysis },
      lifecycle: { ...this._lifecycle },
      version: this._version,
    };
  }

  /**
   * 从接口数据创建实例
   * @param dto - IGoal DTO 对象
   * @returns Goal 实体
   * @example
   * Goal.fromDTO(goalDTO)
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
      startTime: isValid(new Date(dto.startTime))
        ? new Date(dto.startTime)
        : new Date(),
      endTime: isValid(new Date(dto.endTime))
        ? new Date(dto.endTime)
        : new Date(),
    });
    goal._keyResults = (dto.keyResults ?? []).map((kr) =>
      KeyResult.fromDTO(kr)
    );
    goal._records = (dto.records ?? []).map((r) => GoalRecord.fromDTO(r));
    goal._reviews = (dto.reviews ?? []).map((rv) => GoalReview.fromDTO(rv));
    goal._lifecycle = { ...dto.lifecycle };
    goal._version = dto.version;
    return goal;
  }

  /**
   * 克隆当前对象（深拷贝）
   * @returns Goal 实体
   */
  clone(): Goal {
    // 用 toDTO 再 fromDTO，确保深拷贝
    return Goal.fromDTO(this.toDTO());
  }

  /**
   * 创建一个初始化对象（用于新建表单）
   * @returns Goal 实体
   */
  static forCreate(): Goal {
    return new Goal({
      name: "",
      color: "#FF5733",
      analysis: {},
    });
  }
}
