import { AggregateRoot } from '@dailyuse/utils';
import { GoalAnalysis } from '../valueObjects/GoalAnalysis';
import { KeyResult } from '../entities/KeyResult';
import { GoalRecord } from '../entities/GoalRecord';
import { GoalReview } from '../entities/GoalReview';
import { GoalStatus, IGoal } from '../types';

/**
 * Goal 聚合根
 * 管理目标的完整生命周期和业务规则
 */
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
  private _analysis: GoalAnalysis;
  private _status: GoalStatus;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _version: number;

  constructor(params: {
    uuid?: string;
    name: string;
    description?: string;
    color: string;
    dirUuid?: string;
    startTime: Date;
    endTime: Date;
    note?: string;
    keyResults?: KeyResult[];
    records?: GoalRecord[];
    reviews?: GoalReview[];
    analysis: GoalAnalysis;
    status?: GoalStatus;
    version?: number;
  }) {
    super(params.uuid);
    this._name = params.name;
    this._description = params.description;
    this._color = params.color;
    this._dirUuid = params.dirUuid;
    this._startTime = params.startTime;
    this._endTime = params.endTime;
    this._note = params.note;
    this._keyResults = params.keyResults || [];
    this._records = params.records || [];
    this._reviews = params.reviews || [];
    this._analysis = params.analysis;
    this._status = params.status || GoalStatus.ACTIVE;
    this._createdAt = new Date();
    this._updatedAt = new Date();
    this._version = params.version || 1;
  }

  // Getters
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
  get keyResults(): KeyResult[] {
    return [...this._keyResults];
  }
  get records(): GoalRecord[] {
    return [...this._records];
  }
  get reviews(): GoalReview[] {
    return [...this._reviews];
  }
  get analysis(): { motive: string; feasibility: string } {
    return { motive: this._analysis.motive, feasibility: this._analysis.feasibility };
  }
  get lifecycle(): { createdAt: Date; updatedAt: Date; status: GoalStatus } {
    return { createdAt: this._createdAt, updatedAt: this._updatedAt, status: this._status };
  }
  get version(): number {
    return this._version;
  }

  // Business Methods
  get overallProgress(): number {
    if (this._keyResults.length === 0) return 0;

    const totalProgress = this._keyResults.reduce((sum, kr) => sum + kr.progress, 0);
    return totalProgress / this._keyResults.length;
  }

  get weightedProgress(): number {
    if (this._keyResults.length === 0) return 0;

    const totalWeight = this._keyResults.reduce((sum, kr) => sum + kr.weight, 0);
    if (totalWeight === 0) return this.overallProgress;

    const weightedSum = this._keyResults.reduce((sum, kr) => sum + kr.progress * kr.weight, 0);
    return weightedSum / totalWeight;
  }

  get isCompleted(): boolean {
    return this._status === GoalStatus.COMPLETED || this.overallProgress >= 100;
  }

  get isActive(): boolean {
    const now = new Date();
    return this._status === GoalStatus.ACTIVE && now >= this._startTime && now <= this._endTime;
  }

  get isOverdue(): boolean {
    return new Date() > this._endTime && !this.isCompleted;
  }

  addKeyResult(keyResult: KeyResult): void {
    // Validate weight sum doesn't exceed 1
    const currentWeightSum = this._keyResults.reduce((sum, kr) => sum + kr.weight, 0);
    if (currentWeightSum + keyResult.weight > 1) {
      throw new Error('Total weight of key results cannot exceed 1.0');
    }

    this._keyResults.push(keyResult);
    this._updatedAt = new Date();
    this._version++;
  }

  removeKeyResult(keyResultId: string): void {
    const index = this._keyResults.findIndex((kr) => kr.uuid === keyResultId);
    if (index === -1) {
      throw new Error('Key result not found');
    }

    this._keyResults.splice(index, 1);

    // Remove related records
    this._records = this._records.filter((record) => record.keyResultUuid !== keyResultId);

    this._updatedAt = new Date();
    this._version++;
  }

  updateKeyResultValue(keyResultId: string, value: number): void {
    const keyResult = this._keyResults.find((kr) => kr.uuid === keyResultId);
    if (!keyResult) {
      throw new Error('Key result not found');
    }

    keyResult.updateValue(value);
    this._updatedAt = new Date();

    // Check if goal is completed
    if (this.isCompleted && this._status === GoalStatus.ACTIVE) {
      this._status = GoalStatus.COMPLETED;
    }
  }

  addRecord(record: GoalRecord): void {
    // Validate key result exists
    const keyResultExists = this._keyResults.some((kr) => kr.uuid === record.keyResultUuid);
    if (!keyResultExists) {
      throw new Error('Cannot add record for non-existent key result');
    }

    this._records.push(record);

    // Update key result value
    this.updateKeyResultValue(record.keyResultUuid, record.value);
  }

  addReview(review: GoalReview): void {
    this._reviews.push(review);
    this._updatedAt = new Date();
  }

  updateBasicInfo(params: {
    name?: string;
    description?: string;
    color?: string;
    note?: string;
  }): void {
    if (params.name !== undefined) this._name = params.name;
    if (params.description !== undefined) this._description = params.description;
    if (params.color !== undefined) this._color = params.color;
    if (params.note !== undefined) this._note = params.note;

    this._updatedAt = new Date();
    this._version++;
  }

  updateTimeFrame(startTime: Date, endTime: Date): void {
    if (startTime >= endTime) {
      throw new Error('Start time must be before end time');
    }

    this._startTime = startTime;
    this._endTime = endTime;
    this._updatedAt = new Date();
    this._version++;
  }

  pause(): void {
    if (this._status !== GoalStatus.ACTIVE) {
      throw new Error('Only active goals can be paused');
    }

    this._status = GoalStatus.PAUSED;
    this._updatedAt = new Date();
  }

  resume(): void {
    if (this._status !== GoalStatus.PAUSED) {
      throw new Error('Only paused goals can be resumed');
    }

    this._status = GoalStatus.ACTIVE;
    this._updatedAt = new Date();
  }

  complete(): void {
    this._status = GoalStatus.COMPLETED;
    this._updatedAt = new Date();
  }

  archive(): void {
    this._status = GoalStatus.ARCHIVED;
    this._updatedAt = new Date();
  }

  moveToDirectory(dirUuid?: string): void {
    this._dirUuid = dirUuid;
    this._updatedAt = new Date();
  }

  static create(params: {
    name: string;
    description?: string;
    color: string;
    dirUuid?: string;
    startTime: Date;
    endTime: Date;
    motive: string;
    feasibility: string;
  }): Goal {
    if (params.startTime >= params.endTime) {
      throw new Error('Start time must be before end time');
    }

    const analysis = GoalAnalysis.create({
      motive: params.motive,
      feasibility: params.feasibility,
    });

    if (!analysis) {
      throw new Error('Invalid goal analysis');
    }

    return new Goal({
      name: params.name,
      description: params.description,
      color: params.color,
      dirUuid: params.dirUuid,
      startTime: params.startTime,
      endTime: params.endTime,
      analysis,
    });
  }
}
