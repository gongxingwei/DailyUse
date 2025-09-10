import { TaskTemplateCore } from '@dailyuse/domain-core';
import type { TaskContracts } from '@dailyuse/contracts';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';

/**
 * 任务模板聚合根 - 服务端实现
 */
export class TaskTemplate extends TaskTemplateCore {
  /**
   * 从 DTO 创建任务模板实例
   */
  static fromDTO(dto: TaskContracts.TaskTemplateDTO): TaskTemplate {
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
    };
  }
}
