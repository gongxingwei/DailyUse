/**
 * KeyResult 实体实现 (Client)
 */

import type { GoalContracts } from '@dailyuse/contracts';
import { Entity } from '@dailyuse/utils';
import { KeyResultProgressClient } from '../value-objects/KeyResultProgressClient';

type IKeyResultClient = GoalContracts.KeyResultClient;
type KeyResultClientDTO = GoalContracts.KeyResultClientDTO;
type KeyResultServerDTO = GoalContracts.KeyResultServerDTO;
type GoalRecordClientDTO = GoalContracts.GoalRecordClientDTO;

export class KeyResultClient extends Entity implements IKeyResultClient {
  private _goalUuid: string;
  private _title: string;
  private _description?: string | null;
  private _progress: KeyResultProgressClient;
  private _order: number;
  private _createdAt: number;
  private _updatedAt: number;
  private _records?: GoalRecordClientDTO[] | null;

  private constructor(params: {
    uuid?: string;
    goalUuid: string;
    title: string;
    description?: string | null;
    progress: KeyResultProgressClient;
    order: number;
    createdAt: number;
    updatedAt: number;
    records?: GoalRecordClientDTO[] | null;
  }) {
    super(params.uuid || Entity.generateUUID());
    this._goalUuid = params.goalUuid;
    this._title = params.title;
    this._description = params.description;
    this._progress = params.progress;
    this._order = params.order;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._records = params.records;
  }

  // Getters
  public override get uuid(): string {
    return this._uuid;
  }
  public get goalUuid(): string {
    return this._goalUuid;
  }
  public get title(): string {
    return this._title;
  }
  public get description(): string | null | undefined {
    return this._description;
  }
  public get progress(): GoalContracts.KeyResultProgressClientDTO {
    return this._progress.toClientDTO();
  }
  public get order(): number {
    return this._order;
  }
  public get createdAt(): number {
    return this._createdAt;
  }
  public get updatedAt(): number {
    return this._updatedAt;
  }
  public get records(): GoalRecordClientDTO[] | null | undefined {
    return this._records;
  }

  // UI 辅助属性
  public get progressPercentage(): number {
    return this._progress.progressPercentage;
  }

  public get progressText(): string {
    return this._progress.progressText;
  }

  public get progressColor(): string {
    return this._progress.progressBarColor;
  }

  public get isCompleted(): boolean {
    return this._progress.isCompleted;
  }

  public get formattedCreatedAt(): string {
    return new Date(this.createdAt).toLocaleDateString('zh-CN');
  }

  public get formattedUpdatedAt(): string {
    return new Date(this.updatedAt).toLocaleDateString('zh-CN');
  }

  public get displayTitle(): string {
    return this.getDisplayTitle();
  }

  public get aggregationMethodText(): string {
    return this._progress.aggregationMethodText;
  }

  public get calculationExplanation(): string {
    const count = this.getRecordCount();
    if (count === 0) return '暂无数据记录';
    const method = this._progress.aggregationMethodText;
    return `当前进度由 ${count} 条记录${method}计算得出`;
  }

  // 实体方法
  public getDisplayTitle(): string {
    const maxLength = 50;
    if (this._title.length <= maxLength) return this._title;
    return `${this._title.substring(0, maxLength)}...`;
  }

  public getProgressBadge(): string {
    const percentage = this.progressPercentage;
    if (percentage >= 100) return '✓ 已完成';
    if (percentage >= 70) return '→ 进行中';
    if (percentage >= 40) return '⚡ 需努力';
    return '! 待启动';
  }

  public getProgressIcon(): string {
    if (this.isCompleted) return '✓';
    const percentage = this.progressPercentage;
    if (percentage >= 70) return '→';
    if (percentage >= 40) return '⚡';
    return '!';
  }

  public getAggregationMethodBadge(): string {
    const method = this._progress.aggregationMethod;
    switch (method) {
      case 'SUM':
        return 'SUM';
      case 'AVERAGE':
        return 'AVG';
      case 'MAX':
        return 'MAX';
      case 'MIN':
        return 'MIN';
      case 'LAST':
        return 'LAST';
      default:
        return 'SUM';
    }
  }

  public hasDescription(): boolean {
    return !!this._description && this._description.trim().length > 0;
  }

  public getRecordCount(): number {
    return this._records?.length ?? 0;
  }

  public hasRecords(): boolean {
    return this.getRecordCount() > 0;
  }

  public canUpdateProgress(): boolean {
    return true;
  }

  public canDelete(): boolean {
    return true;
  }

  // DTO 转换
  public toClientDTO(): KeyResultClientDTO {
    return {
      uuid: this.uuid,
      goalUuid: this._goalUuid,
      title: this._title,
      description: this._description,
      progress: this._progress.toClientDTO(),
      order: this._order,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      progressPercentage: this.progressPercentage,
      progressText: this.progressText,
      progressColor: this.progressColor,
      isCompleted: this.isCompleted,
      formattedCreatedAt: this.formattedCreatedAt,
      formattedUpdatedAt: this.formattedUpdatedAt,
      displayTitle: this.displayTitle,
      aggregationMethodText: this.aggregationMethodText,
      calculationExplanation: this.calculationExplanation,
      records: this._records,
    };
  }

  public toServerDTO(): KeyResultServerDTO {
    return {
      uuid: this.uuid,
      goalUuid: this._goalUuid,
      title: this._title,
      description: this._description,
      progress: this._progress.toServerDTO(),
      order: this._order,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // 静态工厂方法
  public static fromClientDTO(dto: KeyResultClientDTO): KeyResultClient {
    return new KeyResultClient({
      uuid: dto.uuid,
      goalUuid: dto.goalUuid,
      title: dto.title,
      description: dto.description,
      progress: KeyResultProgressClient.fromClientDTO(dto.progress),
      order: dto.order,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      records: dto.records,
    });
  }

  public static fromServerDTO(dto: KeyResultServerDTO): KeyResultClient {
    return new KeyResultClient({
      uuid: dto.uuid,
      goalUuid: dto.goalUuid,
      title: dto.title,
      description: dto.description,
      progress: KeyResultProgressClient.fromServerDTO(dto.progress),
      order: dto.order,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  public static forCreate(goalUuid: string): KeyResultClient {
    const now = Date.now();
    return new KeyResultClient({
      uuid: crypto.randomUUID(),
      goalUuid,
      title: '',
      description: null,
      progress: KeyResultProgressClient.createDefault(),
      order: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  public clone(): KeyResultClient {
    return KeyResultClient.fromClientDTO(this.toClientDTO());
  }
}
