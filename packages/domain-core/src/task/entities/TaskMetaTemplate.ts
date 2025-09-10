import { Entity } from '@dailyuse/utils';
import type { TaskContracts } from '@dailyuse/contracts';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';

/**
 * 任务元模板核心基类
 */
export abstract class TaskMetaTemplateCore extends Entity implements TaskContracts.ITaskMetaTemplate {
  protected _accountUuid: string;
  protected _name: string;
  protected _description?: string;
  protected _appearance: {
    icon?: string;
    color?: string;
    category: string;
  };
  protected _defaultTimeConfig: {
    timeType: TaskContracts.TaskTimeType;
    scheduleMode: TaskContracts.TaskScheduleMode;
    timezone: string;
    commonTimeSettings?: {
      startTime?: string;
      endTime?: string;
    };
  };
  protected _defaultReminderConfig: {
    enabled: boolean;
    minutesBefore: number;
    methods: ('notification' | 'sound')[];
  };
  protected _defaultProperties: {
    importance: ImportanceLevel;
    urgency: UrgencyLevel;
    tags: string[];
    location?: string;
  };
  protected _usage: {
    usageCount: number;
    lastUsedAt?: Date;
    isFavorite: boolean;
  };
  protected _lifecycle: {
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
  };

  constructor(params: {
    uuid?: string;
    accountUuid: string;
    name: string;
    description?: string;
    appearance: {
      icon?: string;
      color?: string;
      category: string;
    };
    defaultTimeConfig: {
      timeType: TaskContracts.TaskTimeType;
      scheduleMode: TaskContracts.TaskScheduleMode;
      timezone: string;
      commonTimeSettings?: {
        startTime?: string;
        endTime?: string;
      };
    };
    defaultReminderConfig?: {
      enabled: boolean;
      minutesBefore: number;
      methods: ('notification' | 'sound')[];
    };
    defaultProperties?: {
      importance: ImportanceLevel;
      urgency: UrgencyLevel;
      tags: string[];
      location?: string;
    };
    createdAt?: Date;
  }) {
    super(params.uuid || Entity.generateUUID());

    this._accountUuid = params.accountUuid;
    this._name = params.name;
    this._description = params.description;
    this._appearance = params.appearance;
    this._defaultTimeConfig = params.defaultTimeConfig;
    this._defaultReminderConfig = params.defaultReminderConfig || {
      enabled: false,
      minutesBefore: 15,
      methods: ['notification'],
    };
    this._defaultProperties = params.defaultProperties || {
      importance: ImportanceLevel.Moderate,
      urgency: UrgencyLevel.Medium,
      tags: [],
    };
    this._usage = {
      usageCount: 0,
      isFavorite: false,
    };
    this._lifecycle = {
      createdAt: params.createdAt || new Date(),
      updatedAt: new Date(),
      isActive: true,
    };
  }

  // ===== 共享只读属性 =====
  get accountUuid(): string {
    return this._accountUuid;
  }
  get name(): string {
    return this._name;
  }
  get description(): string | undefined {
    return this._description;
  }
  get appearance() {
    return { ...this._appearance };
  }
  get defaultTimeConfig() {
    return { ...this._defaultTimeConfig };
  }
  get defaultReminderConfig() {
    return { ...this._defaultReminderConfig };
  }
  get defaultProperties() {
    return { ...this._defaultProperties };
  }
  get usage() {
    return { ...this._usage };
  }
  get lifecycle() {
    return { ...this._lifecycle };
  }

  // ===== 共享计算属性 =====
  get isActive(): boolean {
    return this._lifecycle.isActive;
  }

  get isFavorite(): boolean {
    return this._usage.isFavorite;
  }

  get hasBeenUsed(): boolean {
    return this._usage.usageCount > 0;
  }

  get isPopular(): boolean {
    return this._usage.usageCount >= 10; // 可配置阈值
  }

  // ===== 共享辅助方法 =====
  protected incrementUsage(): void {
    this._usage.usageCount++;
    this._usage.lastUsedAt = new Date();
    this.updateVersion();
  }

  protected updateVersion(): void {
    this._lifecycle.updatedAt = new Date();
  }

  // ===== 抽象方法（由子类实现）=====
  abstract use(): void;
  abstract toggleFavorite(): void;
  abstract activate(): void;
  abstract deactivate(): void;
  abstract updateName(newName: string): void;
  abstract updateAppearance(newAppearance: any): void;
}
