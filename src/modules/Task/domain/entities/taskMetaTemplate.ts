import { AggregateRoot } from "@/shared/domain/aggregateRoot";

import { TimeUtils } from "../../../../shared/utils/myDateTimeUtils";


export class TaskMetaTemplate extends AggregateRoot {
  private _name: string;
  private _description?: string;
  private _category: string;
  private _defaultTimeConfig: TaskTemplate['timeConfig'];
  private _defaultReminderConfig: TaskTemplate['reminderConfig'];
  private _defaultMetadata: TaskTemplate['metadata'];
  private _lifecycle: {
    createdAt: DateTime;
    updatedAt: DateTime;
    status: "active" | "archived";
  };

  private DefaultTimeConfig: TaskTemplate['timeConfig'] = {
    type: 'timed',
    baseTime: {
      start: TimeUtils.now(),
      end: TimeUtils.addMinutes(TimeUtils.now(), 60), // 默认持续时间为60分钟
      duration: 60 // 默认持续时间为60分钟
    },
    recurrence: {
      type: 'none',
    },
    timezone: 'UTC',
    dstHandling: 'ignore'
  };

  private DefaultReminderConfig: TaskTemplate['reminderConfig'] = {
    enabled: false,
    alerts: [],
    snooze: {
      enabled: false,
      interval: 5, // 默认5分钟
      maxCount: 1 // 默认最多一次
    }
  };

  private DefaultMetadata: TaskTemplate['metadata'] = {
    category: 'general',
    tags: [],
    priority: 3, // 默认中等优先级
    estimatedDuration: 60 // 默认估计持续时间为60分钟
  };


  constructor(
    id: string,
    name: string,
    category: string,
    options?: {
      description?: string;
      defaultTimeConfig?: TaskTemplate['timeConfig'];
      defaultReminderConfig?: TaskTemplate['reminderConfig'];
      defaultMetadata?: TaskTemplate['metadata'];
    }
  ) {
    super(id);
    const now = TimeUtils.now();

    this._name = name;
    this._description = options?.description;
    this._category = category;
    this._defaultTimeConfig = options?.defaultTimeConfig || this.DefaultTimeConfig;
    this._defaultReminderConfig = options?.defaultReminderConfig || this.DefaultReminderConfig;
    this._defaultMetadata = options?.defaultMetadata || this.DefaultMetadata;
    
    this._lifecycle = {
      createdAt: now,
      updatedAt: now,
      status: "active"
    };
  }

  // Getters
  get name(): string { return this._name; }
  get description(): string | undefined { return this._description; }
  get category(): string { return this._category; }
  get defaultTimeConfig(): TaskTemplate['timeConfig'] { return this._defaultTimeConfig; }
  get defaultReminderConfig(): TaskTemplate['reminderConfig'] { return this._defaultReminderConfig; }
  get defaultMetadata(): TaskTemplate['metadata'] { return this._defaultMetadata; }
  get lifecycle() { return this._lifecycle; }

   /**
   * 从完整数据创建 TaskTemplateMeta 实例（用于反序列化）
   * 保留所有原始状态信息
   */
  static fromCompleteData(data: {
    id: string;
    name: string;
    description?: string;
    category: string;
    defaultTimeConfig?: TaskTemplate['timeConfig'];
    defaultReminderConfig?: TaskTemplate['reminderConfig'];
    defaultMetadata?: TaskTemplate['metadata'];
    lifecycle: {
      createdAt: DateTime;
      updatedAt: DateTime;
      status: "active" | "archived";
    };
  }): TaskMetaTemplate {
    const instance = new TaskMetaTemplate(
      data.id,
      data.name,
      data.category,
      {
        description: data.description,
        defaultTimeConfig: data.defaultTimeConfig,
        defaultReminderConfig: data.defaultReminderConfig,
        defaultMetadata: data.defaultMetadata
      }
    );
    
    // 手动设置生命周期信息
    instance._lifecycle = {
      createdAt: data.lifecycle.createdAt,
      updatedAt: data.lifecycle.updatedAt,
      status: data.lifecycle.status
    };
    
    return instance;
  }

  clone(): TaskMetaTemplate {
    return new TaskMetaTemplate(
      this.id,
      this._name,
      this._category,
      {
        description: this._description,
        defaultTimeConfig: { ...this._defaultTimeConfig },
        defaultReminderConfig: { ...this._defaultReminderConfig },
        defaultMetadata: { ...this._defaultMetadata }
      }
    );
  }

  toJSON(): any{
    return {
      id: this.id,
      name: this._name,
      description: this._description,
      category: this._category,
      defaultTimeConfig: this._defaultTimeConfig,
      defaultReminderConfig: this._defaultReminderConfig,
      defaultMetadata: this._defaultMetadata,
      lifecycle: {
        createdAt: this._lifecycle.createdAt,
        updatedAt: this._lifecycle.updatedAt,
        status: this._lifecycle.status
      }
    };
  }
}