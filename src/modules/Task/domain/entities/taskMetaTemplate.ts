import { AggregateRoot } from "@/shared/domain/aggregateRoot";
import { DateTime } from "@/modules/Task/types/timeStructure";
import type { ITaskTemplate, CreateTaskTemplateOptions, TaskTimeConfig, TaskReminderConfig } from "@/modules/Task/domain/types/task";
import { TimeUtils } from "../../../../shared/utils/myDateTimeUtils";

export class TaskMetaTemplate extends AggregateRoot {
  private _name: string;
  private _description?: string;
  private _category: string;
  private _defaultTimeConfig: Partial<TaskTimeConfig>;
  private _defaultReminderConfig: Partial<TaskReminderConfig>;
  private _defaultMetadata: Partial<CreateTaskTemplateOptions>;
  private _lifecycle: {
    createdAt: DateTime;
    updatedAt: DateTime;
    status: "active" | "archived";
  };

  constructor(
    id: string,
    name: string,
    category: string,
    options?: {
      description?: string;
      defaultTimeConfig?: Partial<TaskTimeConfig>;
      defaultReminderConfig?: Partial<TaskReminderConfig>;
      defaultMetadata?: Partial<CreateTaskTemplateOptions>;
    }
  ) {
    super(id);
    const now = TimeUtils.now();

    this._name = name;
    this._description = options?.description;
    this._category = category;
    this._defaultTimeConfig = options?.defaultTimeConfig || {};
    this._defaultReminderConfig = options?.defaultReminderConfig || {};
    this._defaultMetadata = options?.defaultMetadata || {};
    
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
  get defaultTimeConfig(): Partial<TaskTimeConfig> { return this._defaultTimeConfig; }
  get defaultReminderConfig(): Partial<TaskReminderConfig> { return this._defaultReminderConfig; }
  get defaultMetadata(): Partial<CreateTaskTemplateOptions> { return this._defaultMetadata; }
  get lifecycle() { return this._lifecycle; }

  // 生成任务模板
  generateTemplate(customOptions?: Partial<CreateTaskTemplateOptions>): CreateTaskTemplateOptions {
    return {
      ...this._defaultMetadata,
      ...customOptions,
      category: customOptions?.category || this._category,
      // 合并默认配置和自定义配置
    };
  }
   /**
   * 从完整数据创建 TaskTemplateMeta 实例（用于反序列化）
   * 保留所有原始状态信息
   */
  static fromCompleteData(data: {
    id: string;
    name: string;
    description?: string;
    category: string;
    defaultTimeConfig?: Partial<TaskTimeConfig>;
    defaultReminderConfig?: Partial<TaskReminderConfig>;
    defaultMetadata?: Partial<CreateTaskTemplateOptions>;
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