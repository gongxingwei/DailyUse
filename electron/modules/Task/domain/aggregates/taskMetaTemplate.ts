import { AggregateRoot } from "@common/shared/domain/aggregateRoot";
import { DateTime } from '@/shared/types/myDateTime';
import { TimeUtils } from "@/shared/utils/myDateTimeUtils";
import { TaskTemplate } from './taskTemplate';
import { randomUUID } from "crypto";
import type { 
  ITaskMetaTemplate
} from '../types/task';


export class TaskMetaTemplate extends AggregateRoot implements ITaskMetaTemplate {
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
    uuid: string,
    name: string,
    category: string,
    options?: {
      description?: string;
      defaultTimeConfig?: TaskTemplate['timeConfig'];
      defaultReminderConfig?: TaskTemplate['reminderConfig'];
      defaultMetadata?: TaskTemplate['metadata'];
    }
  ) {
    super(uuid);
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
    uuid: string;
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
      data.uuid,
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

  /**
   * 从JSON数据创建 TaskMetaTemplate 实例（标准反序列化方法）
   * 用于从序列化数据、持久化数据或IPC传输的数据恢复领域对象
   */
  static fromJSON(data: any): TaskMetaTemplate {
    return TaskMetaTemplate.fromCompleteData(data);
  }

  clone(): TaskMetaTemplate {
    return new TaskMetaTemplate(
      this.uuid,
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

  /**
   * 转换为数据传输对象
   */
  toDTO(): ITaskMetaTemplate {
    return {
      uuid: this.uuid,
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

  /**
   * 导出完整数据（用于序列化）
   * 为了兼容 JSON.stringify()，委托给 toDTO()
   */
  toJSON(): ITaskMetaTemplate {
    return this.toDTO();
  }

  /**
   * 从此元模板创建一个完整的任务模板
   * 主进程可以直接调用此方法返回一个可以被渲染进程直接修改的完整对象
   */
  createTaskTemplate(title: string = '', customOptions?: {
    description?: string;
    priority?: 1 | 2 | 3 | 4 | 5 ; // 优先级
    tags?: string[];
  }): TaskTemplate {
    const taskTemplate = new TaskTemplate(
      this.generateId(), // 生成新的ID
      title,
      this._defaultTimeConfig,
      this._defaultReminderConfig,
      {
        description: customOptions?.description,
        category: this._defaultMetadata.category,
        tags: [...this._defaultMetadata.tags, ...(customOptions?.tags || [])],
        priority: customOptions?.priority || this._defaultMetadata.priority,
        difficulty: this._defaultMetadata.difficulty,
        estimatedDuration: this._defaultMetadata.estimatedDuration,
        location: this._defaultMetadata.location,
        schedulingPolicy: undefined, // 使用默认调度策略
        keyResultLinks: undefined, // 默认无关键结果链接
      }
    );

    return taskTemplate;
  }

  /**
   * 生成新的任务模板ID
   */
  private generateId(): string {
    return randomUUID();
  }
}