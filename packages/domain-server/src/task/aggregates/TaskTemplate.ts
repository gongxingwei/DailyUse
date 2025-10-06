import { TaskTemplateCore } from '@dailyuse/domain-core';
import type { TaskContracts } from '@dailyuse/contracts';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';
import { TaskInstance } from '../entities/TaskInstance';

/**
 * 任务模板聚合根 - 服务端实现
 */
export class TaskTemplate extends TaskTemplateCore {
  // 聚合根包含子实体：TaskInstance 列表
  private _instances: TaskInstance[] = [];

  constructor(params: {
    uuid?: string;
    accountUuid: string;
    title: string;
    description?: string;
    timeConfig: any;
    reminderConfig?: any;
    properties?: any;
    goalLinks?: any;
    createdAt?: Date;
    updatedAt?: Date;
    instances?: TaskInstance[]; // 直接接收实体形式
  }) {
    super(params);

    // 初始化子实体列表
    if (params.instances) {
      this._instances = params.instances;
    }
  }

  /**
   * 获取所有实例（只读）
   */
  get instances(): TaskInstance[] {
    return [...this._instances];
  }

  /**
   * 添加实例到聚合根
   */
  addInstance(instance: TaskInstance): void {
    this._instances.push(instance);
    this.updateStats(this._instances.length, this._instances.filter((i) => i.isCompleted).length);
  }

  /**
   * 移除实例
   */
  removeInstance(instanceUuid: string): void {
    this._instances = this._instances.filter((i) => i.uuid !== instanceUuid);
    this.updateStats(this._instances.length, this._instances.filter((i) => i.isCompleted).length);
  }

  /**
   * 获取特定实例
   */
  getInstance(instanceUuid: string): TaskInstance | undefined {
    return this._instances.find((i) => i.uuid === instanceUuid);
  }

  /**
   * 从 DTO 创建任务模板实例
   * 同时恢复所有子实体（TaskInstance）
   */
  static fromDTO(dto: TaskContracts.TaskTemplateDTO): TaskTemplate {
    // 首先转换子实体
    const instances = dto.instances?.map((instanceDTO) => TaskInstance.fromDTO(instanceDTO)) || [];

    return new TaskTemplate({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      title: dto.title,
      description: dto.description,
      timeConfig: {
        time: dto.timeConfig.time,
        date: {
          startDate: new Date(dto.timeConfig.date.startDate),
          endDate: dto.timeConfig.date.endDate ? new Date(dto.timeConfig.date.endDate) : undefined,
        },
        schedule: dto.timeConfig.schedule,
        timezone: dto.timeConfig.timezone,
      },
      reminderConfig: dto.reminderConfig,
      properties: dto.properties,
      goalLinks: dto.goalLinks,
      createdAt: new Date(dto.lifecycle.createdAt),
      updatedAt: new Date(dto.lifecycle.updatedAt),
      instances: instances, // 传入转换后的子实体
    });
  }

  /**
   * 创建新的任务模板
   */
  static create(params: {
    accountUuid: string;
    title: string;
    description?: string;
    timeConfig: {
      time: {
        timeType: TaskContracts.TaskTimeType;
        startTime?: string;
        endTime?: string;
      };
      date: {
        startDate: Date;
        endDate?: Date;
      };
      schedule: {
        mode: TaskContracts.TaskScheduleMode;
        intervalDays?: number;
        weekdays?: number[];
        monthDays?: number[];
      };
      timezone: string;
    };
    reminderConfig?: {
      enabled: boolean;
      minutesBefore: number;
      methods: ('notification' | 'sound')[];
    };
    properties?: {
      importance: ImportanceLevel;
      urgency: UrgencyLevel;
      location?: string;
      tags: string[];
    };
    goalLinks?: TaskContracts.KeyResultLink[];
  }): TaskTemplate {
    const taskTemplate = new TaskTemplate(params);

    // 发布领域事件
    taskTemplate.addDomainEvent({
      eventType: 'TaskTemplateCreated',
      aggregateId: taskTemplate.uuid,
      occurredOn: new Date(),
      accountUuid: params.accountUuid,
      payload: {
        title: params.title,
        timeConfig: {
          scheduleMode: params.timeConfig.schedule.mode,
          timezone: params.timeConfig.timezone,
        },
      },
    });

    return taskTemplate;
  }

  /**
   * 激活任务模板
   */
  activate(): void {
    if (this._lifecycle.status !== 'draft' && this._lifecycle.status !== 'paused') {
      throw new Error('只有草稿或暂停状态的模板才能被激活');
    }

    this._lifecycle.status = 'active';
    this.updateVersion();

    this.addDomainEvent({
      eventType: 'TaskTemplateActivated',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        activatedAt: new Date(),
      },
    });
  }

  /**
   * 暂停任务模板
   */
  pause(): void {
    if (this._lifecycle.status !== 'active') {
      throw new Error('只有激活状态的模板才能被暂停');
    }

    this._lifecycle.status = 'paused';
    this.updateVersion();

    this.addDomainEvent({
      eventType: 'TaskTemplatePaused',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        pausedAt: new Date(),
      },
    });
  }

  /**
   * 完成任务模板
   */
  complete(): void {
    if (this._lifecycle.status === 'completed') {
      throw new Error('模板已经完成');
    }

    this._lifecycle.status = 'completed';
    this.updateVersion();

    this.addDomainEvent({
      eventType: 'TaskTemplateCompleted',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        completedAt: new Date(),
        totalInstances: this._stats.totalInstances,
        completedInstances: this._stats.completedInstances,
      },
    });
  }

  /**
   * 归档任务模板
   */
  archive(): void {
    if (this._lifecycle.status === 'archived') {
      throw new Error('模板已经归档');
    }

    this._lifecycle.status = 'archived';
    this.updateVersion();

    this.addDomainEvent({
      eventType: 'TaskTemplateArchived',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        archivedAt: new Date(),
      },
    });
  }

  /**
   * 更新标题
   */
  updateTitle(newTitle: string): void {
    this.validateTitle(newTitle);

    const oldTitle = this._title;
    this._title = newTitle;
    this.updateVersion();

    this.addDomainEvent({
      eventType: 'TaskTemplateUpdated',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        updatedFields: ['title'],
        oldValues: { title: oldTitle },
        newValues: { title: newTitle },
      },
    });
  }

  /**
   * 更新时间配置
   */
  updateTimeConfig(newTimeConfig: {
    time?: {
      timeType?: TaskContracts.TaskTimeType;
      startTime?: string;
      endTime?: string;
    };
    date?: {
      startDate?: Date;
      endDate?: Date;
    };
    schedule?: {
      mode?: TaskContracts.TaskScheduleMode;
      intervalDays?: number;
      weekdays?: number[];
      monthDays?: number[];
    };
    timezone?: string;
  }): void {
    const oldTimeConfig = { ...this._timeConfig };

    if (newTimeConfig.time) {
      this._timeConfig.time = { ...this._timeConfig.time, ...newTimeConfig.time };
    }
    if (newTimeConfig.date) {
      this._timeConfig.date = { ...this._timeConfig.date, ...newTimeConfig.date };
    }
    if (newTimeConfig.schedule) {
      this._timeConfig.schedule = { ...this._timeConfig.schedule, ...newTimeConfig.schedule };
    }
    if (newTimeConfig.timezone) {
      this._timeConfig.timezone = newTimeConfig.timezone;
    }

    this.validateTimeConfig(this._timeConfig);
    this.updateVersion();

    this.addDomainEvent({
      eventType: 'TaskTemplateUpdated',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        updatedFields: ['timeConfig'],
        oldValues: { timeConfig: oldTimeConfig },
        newValues: { timeConfig: this._timeConfig },
      },
    });
  }

  /**
   * 更新提醒配置
   */
  updateReminderConfig(newReminderConfig: {
    enabled?: boolean;
    minutesBefore?: number;
    methods?: ('notification' | 'sound')[];
  }): void {
    const oldReminderConfig = { ...this._reminderConfig };
    this._reminderConfig = { ...this._reminderConfig, ...newReminderConfig };

    this.validateReminderConfig(this._reminderConfig);
    this.updateVersion();

    this.addDomainEvent({
      eventType: 'TaskTemplateUpdated',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        updatedFields: ['reminderConfig'],
        oldValues: { reminderConfig: oldReminderConfig },
        newValues: { reminderConfig: this._reminderConfig },
      },
    });
  }

  /**
   * 添加标签
   */
  addTag(tag: string): void {
    if (!tag || tag.trim().length === 0) {
      throw new Error('标签不能为空');
    }

    if (this._properties.tags.includes(tag)) {
      return; // 标签已存在
    }

    this._properties.tags.push(tag);
    this.updateVersion();

    this.addDomainEvent({
      eventType: 'TaskTemplateUpdated',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        updatedFields: ['properties.tags'],
        newValues: { tags: [...this._properties.tags] },
      },
    });
  }

  /**
   * 移除标签
   */
  removeTag(tag: string): void {
    const index = this._properties.tags.indexOf(tag);
    if (index === -1) {
      return; // 标签不存在
    }

    this._properties.tags.splice(index, 1);
    this.updateVersion();

    this.addDomainEvent({
      eventType: 'TaskTemplateUpdated',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        updatedFields: ['properties.tags'],
        newValues: { tags: [...this._properties.tags] },
      },
    });
  }

  /**
   * 更新统计信息
   */
  updateInstanceStats(totalInstances: number, completedInstances: number): void {
    this.updateStats(totalInstances, completedInstances);
  }

  /**
   * 转换为 DTO
   * 同时转换所有子实体（TaskInstance）为 DTO
   */
  toDTO(): TaskContracts.TaskTemplateDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      title: this._title,
      description: this._description,
      timeConfig: {
        time: this._timeConfig.time,
        date: {
          startDate: this._timeConfig.date.startDate.toISOString(),
          endDate: this._timeConfig.date.endDate?.toISOString(),
        },
        schedule: this._timeConfig.schedule,
        timezone: this._timeConfig.timezone,
      },
      reminderConfig: this._reminderConfig,
      properties: this._properties,
      lifecycle: {
        status: this._lifecycle.status,
        createdAt: this._lifecycle.createdAt.toISOString(),
        updatedAt: this._lifecycle.updatedAt.toISOString(),
      },
      stats: {
        totalInstances: this._stats.totalInstances,
        completedInstances: this._stats.completedInstances,
        completionRate: this._stats.completionRate,
        lastInstanceDate: this._stats.lastInstanceDate?.toISOString(),
      },
      goalLinks: this._goalLinks,
      // 转换子实体为 DTO
      instances: this._instances.map((instance) => instance.toDTO()),
    };
  }

  /**
   * 转换为持久化 DTO（扁平化格式，用于数据库存储）
   */
  toPersistence(accountUuid: string): TaskContracts.TaskTemplatePersistenceDTO {
    return {
      uuid: this.uuid,
      accountUuid,

      // 基本信息
      title: this._title,
      description: this._description,

      // 时间配置 - 扁平化
      timeType: this._timeConfig.time.timeType,
      startTime: this._timeConfig.time.startTime,
      endTime: this._timeConfig.time.endTime,
      startDate: this._timeConfig.date.startDate,
      endDate: this._timeConfig.date.endDate,
      scheduleMode: this._timeConfig.schedule.mode,
      intervalDays: this._timeConfig.schedule.intervalDays,
      weekdays: JSON.stringify(this._timeConfig.schedule.weekdays || []),
      monthDays: JSON.stringify(this._timeConfig.schedule.monthDays || []),
      timezone: this._timeConfig.timezone,

      // 提醒配置 - 扁平化
      reminderEnabled: this._reminderConfig.enabled,
      reminderMinutesBefore: this._reminderConfig.minutesBefore || 0,
      reminderMethods: JSON.stringify(this._reminderConfig.methods || []),

      // 属性 - 扁平化
      importance: this._properties.importance,
      urgency: this._properties.urgency,
      location: this._properties.location,
      tags: JSON.stringify(this._properties.tags || []),

      // 目标关联
      goalLinks: JSON.stringify(this._goalLinks || []),

      // 状态（强制转换为 TaskTemplateStatus）
      status: this._lifecycle.status as TaskContracts.TaskTemplateStatus,

      // 统计信息
      totalInstances: this._stats.totalInstances,
      completedInstances: this._stats.completedInstances,
      lastInstanceDate: this._stats.lastInstanceDate,

      // 生命周期
      createdAt: this._lifecycle.createdAt,
      updatedAt: this._lifecycle.updatedAt,

      // 版本控制（可选）
      version: undefined,
    };
  }

  /**
   * 从持久化 DTO 创建实体（不包含子实体）
   */
  static fromPersistence(data: TaskContracts.TaskTemplatePersistenceDTO): TaskTemplate {
    // 安全 JSON 解析
    const safeJsonParse = <T>(jsonString: string | T | null | undefined, defaultValue: T): T => {
      if (typeof jsonString === 'object' && jsonString !== null) {
        return jsonString as T;
      }
      if (!jsonString || (typeof jsonString === 'string' && jsonString.trim() === '')) {
        return defaultValue;
      }
      try {
        const parsed = JSON.parse(jsonString as string);
        return parsed !== null && parsed !== undefined ? parsed : defaultValue;
      } catch (error) {
        console.warn(`Failed to parse JSON: ${jsonString}`);
        return defaultValue;
      }
    };

    return new TaskTemplate({
      uuid: data.uuid,
      accountUuid: data.accountUuid,
      title: data.title,
      description: data.description,
      timeConfig: {
        time: {
          timeType: data.timeType,
          startTime: data.startTime,
          endTime: data.endTime,
        },
        date: {
          startDate: data.startDate instanceof Date ? data.startDate : new Date(data.startDate),
          endDate: data.endDate
            ? data.endDate instanceof Date
              ? data.endDate
              : new Date(data.endDate)
            : undefined,
        },
        schedule: {
          mode: data.scheduleMode,
          intervalDays: data.intervalDays,
          weekdays: safeJsonParse(data.weekdays, []),
          monthDays: safeJsonParse(data.monthDays, []),
        },
        timezone: data.timezone,
      },
      reminderConfig: {
        enabled: data.reminderEnabled,
        minutesBefore: data.reminderMinutesBefore,
        methods: safeJsonParse(data.reminderMethods, []),
      },
      properties: {
        importance: data.importance,
        urgency: data.urgency,
        location: data.location,
        tags: safeJsonParse(data.tags, []),
      },
      goalLinks: safeJsonParse(data.goalLinks, []),
      createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt),
      updatedAt: data.updatedAt instanceof Date ? data.updatedAt : new Date(data.updatedAt),
      // 子实体在加载时单独设置
      instances: [],
    });
  }

  /**
   * 转换为客户端 DTO（包含所有计算属性）
   */
  toClient(): TaskContracts.TaskTemplateClientDTO {
    const baseDTO = this.toDTO();
    const now = new Date();
    const daysSinceCreation = Math.floor(
      (now.getTime() - this._lifecycle.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    // 计算状态文本和颜色
    const statusMap: Record<string, { text: string; color: string }> = {
      draft: { text: '草稿', color: '#9E9E9E' },
      active: { text: '进行中', color: '#4CAF50' },
      paused: { text: '已暂停', color: '#FF9800' },
      completed: { text: '已完成', color: '#2196F3' },
      archived: { text: '已归档', color: '#607D8B' },
    };

    const statusInfo = statusMap[this._lifecycle.status] || { text: '未知', color: '#000000' };

    // 计算调度规则文本
    const scheduleTextMap: Record<string, string> = {
      once: '仅一次',
      daily: '每日',
      weekly: '每周',
      monthly: '每月',
      custom: '自定义',
    };
    const scheduleText = scheduleTextMap[this._timeConfig.schedule.mode] || '未设置';

    // 计算实例统计
    const activeInstances = this._instances.filter((i) => !i.isCompleted && !i.isCancelled);
    const pendingInstances = this._instances.filter((i) => !i.isCompleted && !i.isCancelled);
    const overdueInstances = this._instances.filter((i) => {
      if (i.isCompleted || i.isCancelled) return false;
      const scheduledDate = i.timeConfig.scheduledDate;
      return scheduledDate < now;
    });

    return {
      ...baseDTO,
      displayTitle: `${statusInfo.text} - ${this._title}`,
      statusText: statusInfo.text,
      statusColor: statusInfo.color,
      scheduleText,
      completionRateText: `${Math.round(this._stats.completionRate)}%`,
      canActivate: this._lifecycle.status === 'draft' || this._lifecycle.status === 'paused',
      canPause: this._lifecycle.status === 'active',
      canEdit: this._lifecycle.status !== 'archived',
      canDelete: this._lifecycle.status === 'draft' || this._lifecycle.status === 'archived',
      canCreateInstance: this._lifecycle.status === 'active',
      activeInstancesCount: activeInstances.length,
      totalInstancesCount: this._stats.totalInstances,
      completedInstancesCount: this._stats.completedInstances,
      instanceCompletionRate: this._stats.completionRate,
      nextScheduledTime: null, // TODO: 实现下次调度时间计算
      hasPendingInstances: pendingInstances.length > 0,
      hasOverdueInstances: overdueInstances.length > 0,
      daysSinceCreation,
      lastExecutedTime: this._stats.lastInstanceDate?.toISOString() || null,
      averageCompletionMinutes: null, // TODO: 实现平均完成时长计算
    };
  }
}
