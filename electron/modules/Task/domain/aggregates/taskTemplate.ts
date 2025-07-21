import { AggregateRoot } from "@/shared/domain/aggregateRoot";
import { DateTime } from '@/shared/types/myDateTime';
import type { 
  TaskTimeConfig, 
  TaskReminderConfig,
  KeyResultLink,
  ITaskTemplate,
} from "@/modules/Task/domain/types/task";
import { TimeUtils } from "@/shared/utils/myDateTimeUtils";

export class TaskTemplate extends AggregateRoot implements ITaskTemplate {
  private _title: string;
  private _description?: string;
  private _timeConfig: TaskTimeConfig;
  private _reminderConfig: TaskReminderConfig;
  private _schedulingPolicy: {
    allowReschedule: boolean;
    maxDelayDays: number;
    skipWeekends: boolean;
    skipHolidays: boolean;
    workingHoursOnly: boolean;
  };
  private _metadata: {
    category: string;
    tags: string[];
    estimatedDuration?: number;
    priority?: 1 | 2 | 3 | 4 | 5;
    difficulty?: 1 | 2 | 3 | 4 | 5;
    location?: string;
  };
  private _lifecycle: {
    status: "draft" | "active" | "paused" | "archived";
    createdAt: DateTime;
    updatedAt: DateTime;
    activatedAt?: DateTime;
    pausedAt?: DateTime;
  };
  private _analytics: {
    totalInstances: number;
    completedInstances: number;
    averageCompletionTime?: number;
    successRate: number;
    lastInstanceDate?: DateTime;
  };
  private _keyResultLinks?: KeyResultLink[];
  private _version: number;

  constructor(
    uuid: string,
    title: string,
    timeConfig: TaskTimeConfig,
    reminderConfig: TaskReminderConfig,
    options?: {
      description?: string;
      keyResultLinks?: KeyResultLink[];
      category?: string;
      tags?: string[];
      priority?: 1 | 2 | 3 | 4 | 5;
      difficulty?: 1 | 2 | 3 | 4 | 5;
      estimatedDuration?: number;
      location?: string;
      schedulingPolicy?: {
        allowReschedule?: boolean;
        maxDelayDays?: number;
        skipWeekends?: boolean;
        skipHolidays?: boolean;
        workingHoursOnly?: boolean;
      };
    }
  ) {
    super(uuid);
    const now = TimeUtils.now();

    this._title = title;
    this._description = options?.description;
    this._timeConfig = timeConfig;
    this._reminderConfig = reminderConfig;

    this._schedulingPolicy = {
      allowReschedule: true,
      maxDelayDays: 7,
      skipWeekends: false,
      skipHolidays: false,
      workingHoursOnly: false,
      ...options?.schedulingPolicy,
    };

    this._metadata = {
      category: options?.category || "general",
      tags: options?.tags || [],
      priority: options?.priority || 3,
      difficulty: options?.difficulty || 3,
      estimatedDuration: options?.estimatedDuration,
      location: options?.location,
    };

    this._lifecycle = {
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };

    this._analytics = {
      totalInstances: 0,
      completedInstances: 0,
      successRate: 0,
    };

    this._keyResultLinks = options?.keyResultLinks;
    this._version = 1;
  }

  // Getters
  get title(): string {
    return this._title;
  }

  get description(): string | undefined {
    return this._description;
  }

  get timeConfig(): TaskTimeConfig {
    return this._timeConfig;
  }

  get reminderConfig(): TaskReminderConfig {
    return this._reminderConfig;
  }

  get schedulingPolicy() {
    return this._schedulingPolicy;
  }

  get metadata() {
    return this._metadata;
  }

  get lifecycle() {
    return this._lifecycle;
  }

  get analytics() {
    return this._analytics;
  }

  get keyResultLinks(): KeyResultLink[] | undefined {
    return this._keyResultLinks;
  }

  get version(): number {
    return this._version;
  }

  // Methods
  updateTitle(title: string): void {
    this._title = title;
    this._lifecycle.updatedAt = TimeUtils.now();
  }

  updateDescription(description?: string): void {
    this._description = description;
    this._lifecycle.updatedAt = TimeUtils.now();
  }

  updateTimeConfig(timeConfig: TaskTimeConfig): void {
    this._timeConfig = timeConfig;
    this._lifecycle.updatedAt = TimeUtils.now();
  }

  updateReminderConfig(reminderConfig: TaskReminderConfig): void {
    this._reminderConfig = reminderConfig;
    this._lifecycle.updatedAt = TimeUtils.now();
  }

  updateSchedulingPolicy(policy: Partial<typeof this._schedulingPolicy>): void {
    this._schedulingPolicy = { ...this._schedulingPolicy, ...policy };
    this._lifecycle.updatedAt = TimeUtils.now();
  }

  updateMetadata(metadata: Partial<typeof this._metadata>): void {
    this._metadata = { ...this._metadata, ...metadata };
    this._lifecycle.updatedAt = TimeUtils.now();
  }

  setPriority(priority?: 1 | 2 | 3 | 4 | 5): void {
    this._metadata.priority = priority;
    this._lifecycle.updatedAt = TimeUtils.now();
  }

  addKeyResultLink(link: KeyResultLink): void {
    if (!this._keyResultLinks) {
      this._keyResultLinks = [];
    }
    this._keyResultLinks.push(link);
    this._lifecycle.updatedAt = TimeUtils.now();
  }

  removeKeyResultLink(goalUuid: string, keyResultId: string): void {
    if (this._keyResultLinks) {
      this._keyResultLinks = this._keyResultLinks.filter(
        (link) => !(link.goalUuid === goalUuid && link.keyResultId === keyResultId)
      );
      this._lifecycle.updatedAt = TimeUtils.now();
    }
  }

  activate(): void {
    this._lifecycle.status = "active";
    this._lifecycle.activatedAt = TimeUtils.now();
    this._lifecycle.updatedAt = TimeUtils.now();
  }

  pause(): void {
    this._lifecycle.status = "paused";
    this._lifecycle.pausedAt = TimeUtils.now();
    this._lifecycle.updatedAt = TimeUtils.now();
  }

  archive(): void {
    this._lifecycle.status = "archived";
    this._lifecycle.updatedAt = TimeUtils.now();
  }

  incrementAnalytics(completed: boolean, completionTime?: number): void {
    this._analytics.totalInstances++;
    if (completed) {
      this._analytics.completedInstances++;
      if (completionTime) {
        const currentAvg = this._analytics.averageCompletionTime || 0;
        const count = this._analytics.completedInstances;
        this._analytics.averageCompletionTime =
          (currentAvg * (count - 1) + completionTime) / count;
      }
    }
    this._analytics.successRate =
      this._analytics.totalInstances > 0
        ? this._analytics.completedInstances / this._analytics.totalInstances
        : 0;
    this._analytics.lastInstanceDate = TimeUtils.now();
    this._lifecycle.updatedAt = TimeUtils.now();
  }

  addTag(tag: string): void {
    if (!this._metadata.tags.includes(tag)) {
      this._metadata.tags.push(tag);
      this._lifecycle.updatedAt = TimeUtils.now();
    }
  }

  removeTag(tag: string): void {
    this._metadata.tags = this._metadata.tags.filter((t) => t !== tag);
    this._lifecycle.updatedAt = TimeUtils.now();
  }

  isActive(): boolean {
    return this._lifecycle.status === "active";
  }

  isDraft(): boolean {
    return this._lifecycle.status === "draft";
  }

  isPaused(): boolean {
    return this._lifecycle.status === "paused";
  }

  isArchived(): boolean {
    return this._lifecycle.status === "archived";
  }

  /**
   * 从完整数据创建 TaskTemplate 实例（用于反序列化）
   * 保留所有原始状态信息
   */
  static fromCompleteData(data: any): TaskTemplate {
    // 创建基础实例
    const instance = new TaskTemplate(
      data.uuid || data._id,
      data.title || data._title,
      data.timeConfig || data._timeConfig,
      data.reminderConfig || data._reminderConfig,
      {
        description: data.description || data._description,
        category: data.metadata?.category || data._metadata?.category,
        tags: data.metadata?.tags || data._metadata?.tags,
        priority: data.metadata?.priority || data._metadata?.priority,
        difficulty: data.metadata?.difficulty || data._metadata?.difficulty,
        estimatedDuration: data.metadata?.estimatedDuration || data._metadata?.estimatedDuration,
        location: data.metadata?.location || data._metadata?.location,
        schedulingPolicy: data.schedulingPolicy || data._schedulingPolicy,
        keyResultLinks: data.keyResultLinks || data._keyResultLinks,
      }
    );

    // 恢复生命周期状态
    if (data.lifecycle || data._lifecycle) {
      const lifecycle = data.lifecycle || data._lifecycle;
      instance._lifecycle = {
        status: lifecycle.status || "draft",
        createdAt: lifecycle.createdAt || instance._lifecycle.createdAt,
        updatedAt: lifecycle.updatedAt || instance._lifecycle.updatedAt,
        activatedAt: lifecycle.activatedAt || undefined,
        pausedAt: lifecycle.pausedAt || undefined,
      };
    }

    // 恢复统计数据
    if (data.analytics || data._analytics) {
      const analytics = data.analytics || data._analytics;
      instance._analytics = {
        ...instance._analytics,
        ...analytics,
      };
    }

    // 恢复版本号
    if (data.version !== undefined || data._version !== undefined) {
      instance._version = data.version || data._version || 1;
    }

    return instance;
  }

  /**
   * 从JSON数据创建 TaskTemplate 实例（用于反序列化）
   * 保留所有原始状态信息
   */
  static fromDTO(data: ITaskTemplate): TaskTemplate {
    return TaskTemplate.fromCompleteData(data);
  }

  /**
   * 保持向后兼容性
   * @deprecated 请使用 fromDTO() 方法
   */
  static fromDto(data: ITaskTemplate): TaskTemplate {
    return TaskTemplate.fromDTO(data);
  }

  isTaskTemplate(): this is TaskTemplate {
    return this instanceof TaskTemplate;
  }
  /**
   * 克隆实例（用于创建副本）
   */
  clone(): TaskTemplate {
    return TaskTemplate.fromCompleteData(this.toDTO());
  }

  /**
   * 转换为数据传输对象
   */
  toDTO(): ITaskTemplate {
    console.log('🔄 [TaskTemplate] 开始转换为DTO');
    
    try {
      const dto = {
        uuid: this.uuid,
        title: this._title,
        description: this._description,
        timeConfig: this._timeConfig,
        reminderConfig: this._reminderConfig,
        schedulingPolicy: this._schedulingPolicy,
        metadata: this._metadata,
        lifecycle: this._lifecycle,
        analytics: this._analytics,
        keyResultLinks: this._keyResultLinks,
        version: this._version,
      };
      
      console.log('✅ [TaskTemplate] DTO 对象创建成功');
      console.log('🔍 [TaskTemplate] DTO 属性检查:');
      for (const key in dto) {
        const value = (dto as any)[key];
        console.log(`  - ${key}:`, typeof value);
        
        // 检查每个属性是否可序列化
        try {
          JSON.stringify(value);
          console.log(`    ✅ ${key} 可序列化`);
        } catch (err) {
          console.error(`    ❌ ${key} 不可序列化:`, err);
          console.error(`    ❌ ${key} 值:`, value);
        }
      }
      
      // 验证整个DTO对象
      try {
        const serialized = JSON.stringify(dto);
        console.log('✅ [TaskTemplate] 完整DTO对象可序列化，字符串长度:', serialized.length);
      } catch (error) {
        console.error('❌ [TaskTemplate] 完整DTO对象不可序列化:', error);
        
        // 尝试创建一个更安全的版本
        const safeDto = {
          uuid: String(this.uuid || ''),
          title: String(this._title || ''),
          description: String(this._description || ''),
          timeConfig: this._timeConfig ? JSON.parse(JSON.stringify(this._timeConfig)) : null,
          reminderConfig: this._reminderConfig ? JSON.parse(JSON.stringify(this._reminderConfig)) : null,
          schedulingPolicy: this._schedulingPolicy ? JSON.parse(JSON.stringify(this._schedulingPolicy)) : {
            allowReschedule: true,
            maxDelayDays: 3,
            skipWeekends: false,
            skipHolidays: false,
            workingHoursOnly: false
          },
          metadata: this._metadata ? JSON.parse(JSON.stringify(this._metadata)) : {},
          lifecycle: this._lifecycle ? JSON.parse(JSON.stringify(this._lifecycle)) : {},
          analytics: this._analytics ? JSON.parse(JSON.stringify(this._analytics)) : {},
          keyResultLinks: this._keyResultLinks ? JSON.parse(JSON.stringify(this._keyResultLinks)) : [],
          version: Number(this._version || 1),
        };
        
        console.log('🔄 [TaskTemplate] 创建安全版本DTO');
        try {
          JSON.stringify(safeDto);
          console.log('✅ [TaskTemplate] 安全版本DTO可序列化');
          return safeDto;
        } catch (safeError) {
          console.error('❌ [TaskTemplate] 连安全版本DTO也不可序列化:', safeError);
          throw new Error('Unable to create serializable DTO');
        }
      }
      
      return dto;
    } catch (error) {
      console.error('❌ [TaskTemplate] toDTO()过程中发生错误:', error);
      throw error;
    }
  }

  /**
   * 导出完整数据（用于序列化）
   * 为了兼容 JSON.stringify()，委托给 toDTO()
   */
  toJSON(): ITaskTemplate {
    return this.toDTO();
  }

  /**
   * 保持向后兼容性
   * @deprecated 请使用 toDTO() 方法
   */
  toDto(): ITaskTemplate {
    return this.toDTO();
  }
}