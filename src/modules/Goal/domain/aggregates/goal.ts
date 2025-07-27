import { addDays } from "date-fns";
import { AggregateRoot } from "@/shared/domain/aggregateRoot";
import { IGoal } from "@common/modules/goal";
import { KeyResult } from "../entities/keyResult";
import { Record } from "../entities/record";
import { GoalReview } from "../entities/goalReview";
import { differenceInDays, isSameDay } from "date-fns";

export class Goal extends AggregateRoot implements IGoal {
  private _name: string;
  private _description?: string;
  private _color: string;
  private _dirUuid?: string;
  private _startTime: Date;
  private _endTime: Date;
  private _note?: string;
  private _keyResults: KeyResult[];
  private _records: Record[];
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
  get records(): Record[] {
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

  get totalWeight(): number {
    return this._keyResults.reduce((acc, kr) => acc + kr.weight, 0);
  }

  get progress(): number {
    if (this._keyResults.length === 0) return 0;
    const totalWeight = this.totalWeight;
    const weightedProgress = this._keyResults.reduce(
      (sum, kr) => sum + (kr.progress * kr.weight) / totalWeight,
      0
    );
    return Math.round(weightedProgress * 100);
  }

  get todayProgress(): number {
    if (this._keyResults.length === 0) return 0;

    // 获取今天的所有记录
    const today = new Date();
    const todayRecords = this._records.filter((r) =>
      isSameDay(r.lifecycle.createdAt, today)
    );

    if (todayRecords.length === 0) return 0;

    let todayWeight = 0;
    for (const kr of this._keyResults) {
      // 找到该关键结果今天的所有记录
      const krRecords = todayRecords.filter((r) => r.keyResultUuid === kr.uuid);
      if (krRecords.length > 0) {
        const sumValue = krRecords.reduce((sum, r) => sum + r.value, 0);
        todayWeight += sumValue * kr.weight;
      }
    }

    return Math.round((todayWeight / this.totalWeight) * 100);
  }

  get remainingDays(): number {
    return differenceInDays(this.endTime, this.startTime);
  }

  addKeyResult(keyResult: KeyResult): void {
    if (this._keyResults.some((kr) => kr.uuid === keyResult.uuid)) {
      throw new Error("Key result already exists");
    }
    this._keyResults.push(keyResult);
    this._lifecycle.updatedAt = new Date();
    this._version++;
  }

  removeKeyResult(keyResultUuid: string): void {
    const index = this._keyResults.findIndex((kr) => kr.uuid === keyResultUuid);
    if (index === -1) {
      throw new Error("Key result not found");
    }
    this._keyResults.splice(index, 1);
    this._lifecycle.updatedAt = new Date();
    this._version++;
  }

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
   */
  createSnapShot(): GoalReview["snapshot"] {
    return {
      snapshotDate: new Date(),
      overallProgress: this.analytics.overallProgress,
      weightedProgress: this.analytics.weightedProgress,
      completedKeyResults: this.analytics.completedKeyResults,
      totalKeyResults: this.analytics.totalKeyResults,
      keyResultsSnapshot: this._keyResults.map((kr) => ({
        uuid: kr.uuid,
        name: kr.name,
        progress: kr.progress,
        currentValue: kr.currentValue,
        targetValue: kr.targetValue,
      })),
    };
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
      startTime: dto.startTime,
      endTime: dto.endTime,
    });
    goal._keyResults = (dto.keyResults ?? []).map((kr) =>
      KeyResult.fromDTO(kr)
    );
    goal._records = (dto.records ?? []).map((r) => Record.fromDTO(r));
    goal._reviews = (dto.reviews ?? []).map((rv) => GoalReview.fromDTO(rv));
    goal._lifecycle = { ...dto.lifecycle };
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
