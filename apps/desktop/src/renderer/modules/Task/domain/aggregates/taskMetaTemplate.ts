import { AggregateRoot } from '@dailyuse/utils';
import { TaskTemplate } from './taskTemplate';

import type {
  IMainProcessTaskMetaTemplate,
  ITaskMetaTemplateDTO,
} from '@common/modules/task/types/task';
import { ImportanceLevel } from '@dailyuse/contracts';
import { UrgencyLevel } from '@dailyuse/contracts';

export class TaskMetaTemplate extends AggregateRoot implements IMainProcessTaskMetaTemplate {
  private _name: string;
  private _description?: string;
  private _icon?: string;
  private _color?: string;
  private _category: string;
  private _defaultTimeConfig: TaskTemplate['timeConfig'];
  private _defaultReminderConfig: TaskTemplate['reminderConfig'];
  private _defaultMetadata: TaskTemplate['metadata'];
  private _lifecycle: {
    createdAt: Date;
    updatedAt: Date;
  };

  private DefaultTimeConfig: TaskTemplate['timeConfig'] = {
    type: 'timed',
    baseTime: {
      start: new Date(),
      end: new Date(Date.now() + 60 * 60 * 1000), // 默认持续时间为60分钟
      duration: 60, // 默认持续时间为60分钟
    },
    recurrence: {
      type: 'none',
    },
    timezone: 'UTC',
    dstHandling: 'ignore',
  };

  private DefaultReminderConfig: TaskTemplate['reminderConfig'] = {
    enabled: false,
    alerts: [],
    snooze: {
      enabled: false,
      interval: 5, // 默认5分钟
      maxCount: 1, // 默认最多一次
    },
  };

  private DefaultMetadata: TaskTemplate['metadata'] = {
    category: 'general',
    tags: [],
    importance: ImportanceLevel.Moderate,
    urgency: UrgencyLevel.Medium,
    estimatedDuration: 60, // 默认估计持续时间为60分钟
  };

  constructor(params: {
    uuid?: string;
    name: string;
    category: string;
    icon?: string;
    color?: string;
    description?: string;
    defaultTimeConfig?: TaskTemplate['timeConfig'];
    defaultReminderConfig?: TaskTemplate['reminderConfig'];
    defaultMetadata?: TaskTemplate['metadata'];
  }) {
    super(params.uuid || AggregateRoot.generateUUID());
    const now = new Date();

    this._name = params.name;
    this._description = params.description;
    this._category = params.category;
    this._icon = params.icon;
    this._color = params.color;
    this._defaultTimeConfig = params.defaultTimeConfig || this.DefaultTimeConfig;
    this._defaultReminderConfig = params.defaultReminderConfig || this.DefaultReminderConfig;
    this._defaultMetadata = params.defaultMetadata || this.DefaultMetadata;

    this._lifecycle = {
      createdAt: now,
      updatedAt: now,
    };
  }

  // Getters
  get name(): string {
    return this._name;
  }
  get description(): string | undefined {
    return this._description;
  }

  get icon(): string | undefined {
    return this._icon;
  }

  get color(): string | undefined {
    return this._color;
  }

  get category(): string {
    return this._category;
  }
  get defaultTimeConfig(): TaskTemplate['timeConfig'] {
    return this._defaultTimeConfig;
  }
  get defaultReminderConfig(): TaskTemplate['reminderConfig'] {
    return this._defaultReminderConfig;
  }
  get defaultMetadata(): TaskTemplate['metadata'] {
    return this._defaultMetadata;
  }
  get lifecycle() {
    return this._lifecycle;
  }

  /**
   * 从完整数据创建 TaskMetaTemplate 实例（用于反序列化）
   * 保留所有原始状态信息
   */
  static fromDTO(data: ITaskMetaTemplateDTO): TaskMetaTemplate {
    const metaTemplate = new TaskMetaTemplate({
      uuid: data.uuid,
      name: data.name,
      category: data.category,
      icon: data.icon,
      color: data.color,
      description: data.description,
      defaultTimeConfig: {
        ...data.defaultTimeConfig,
        baseTime: {
          ...data.defaultTimeConfig.baseTime,
          start: new Date(data.defaultTimeConfig.baseTime.start),
          end: data.defaultTimeConfig.baseTime.end
            ? new Date(data.defaultTimeConfig.baseTime.end)
            : undefined,
        },
        recurrence: {
          ...data.defaultTimeConfig.recurrence,
          endCondition: data.defaultTimeConfig.recurrence.endCondition
            ? {
                ...data.defaultTimeConfig.recurrence.endCondition,
                endDate: data.defaultTimeConfig.recurrence.endCondition.endDate
                  ? new Date(data.defaultTimeConfig.recurrence.endCondition.endDate)
                  : undefined,
              }
            : undefined,
        },
      },
      defaultReminderConfig: {
        ...data.defaultReminderConfig,
        enabled: !!data.defaultReminderConfig.enabled,
        alerts: data.defaultReminderConfig.alerts.map((alert) => ({
          ...alert,
          timing: {
            ...alert.timing,
            absoluteTime: alert.timing.absoluteTime
              ? new Date(alert.timing.absoluteTime)
              : undefined,
          },
        })),
        snooze: {
          ...data.defaultReminderConfig.snooze,
          enabled: !!data.defaultReminderConfig.snooze.enabled,
        },
      },
      defaultMetadata: {
        category: data.defaultMetadata.category,
        tags: data.defaultMetadata.tags,
        estimatedDuration: data.defaultMetadata.estimatedDuration,
        importance: data.defaultMetadata.importance ?? ImportanceLevel.Moderate,
        urgency: data.defaultMetadata.urgency ?? UrgencyLevel.Medium,
        location: data.defaultMetadata.location,
      },
    });

    // 手动设置生命周期信息
    metaTemplate._lifecycle = {
      createdAt: new Date(data.lifecycle.createdAt),
      updatedAt: new Date(data.lifecycle.updatedAt),
    };

    return metaTemplate;
  }

  clone(): TaskMetaTemplate {
    return new TaskMetaTemplate({
      uuid: this.uuid,
      name: this._name,
      description: this._description,
      category: this._category,
      defaultTimeConfig: { ...this._defaultTimeConfig },
      defaultReminderConfig: { ...this._defaultReminderConfig },
      defaultMetadata: { ...this._defaultMetadata },
    });
  }

  /**
   * 转换为数据传输对象
   */
  toDTO(): ITaskMetaTemplateDTO {
    return {
      uuid: this.uuid,
      name: this._name,
      description: this._description,
      category: this._category,
      defaultTimeConfig: {
        type: this._defaultTimeConfig.type,
        baseTime: {
          start: this._defaultTimeConfig.baseTime.start.getTime(),
          end: this._defaultTimeConfig.baseTime.end?.getTime(),
          duration: this._defaultTimeConfig.baseTime.duration,
        },
        recurrence: {
          type: this._defaultTimeConfig.recurrence.type,
          interval: this._defaultTimeConfig.recurrence.interval,
          endCondition: this._defaultTimeConfig.recurrence.endCondition
            ? {
                type: this._defaultTimeConfig.recurrence.endCondition.type,
                endDate: this._defaultTimeConfig.recurrence.endCondition.endDate?.getTime(),
                count: this._defaultTimeConfig.recurrence.endCondition.count,
              }
            : undefined,
          config: this._defaultTimeConfig.recurrence.config,
        },
        timezone: this._defaultTimeConfig.timezone,
        dstHandling: this._defaultTimeConfig.dstHandling,
      },
      defaultReminderConfig: {
        enabled: this._defaultReminderConfig.enabled ? 1 : 0,
        alerts: this._defaultReminderConfig.alerts.map((alert) => ({
          uuid: alert.uuid,
          timing: {
            type: alert.timing.type,
            minutesBefore: alert.timing.minutesBefore,
            absoluteTime: alert.timing.absoluteTime?.getTime(),
          },
          type: alert.type,
          message: alert.message,
        })),
        snooze: {
          enabled: this._defaultReminderConfig.snooze.enabled ? 1 : 0,
          interval: this._defaultReminderConfig.snooze.interval,
          maxCount: this._defaultReminderConfig.snooze.maxCount,
        },
      },
      defaultMetadata: this._defaultMetadata,
      lifecycle: {
        createdAt: this._lifecycle.createdAt.getTime(),
        updatedAt: this._lifecycle.updatedAt.getTime(),
      },
    };
  }

  /**
   * 从此元模板创建一个完整的任务模板
   * 渲染进程可以调用此方法返回一个可以被直接修改的完整对象
   */
  createTaskTemplate(): TaskTemplate {
    const taskTemplate = new TaskTemplate({
      title: '',
      description: '',
      timeConfig: { ...this._defaultTimeConfig },
      reminderConfig: { ...this._defaultReminderConfig },
      importance: this._defaultMetadata.importance,
      urgency: this._defaultMetadata.urgency,
      category: this._defaultMetadata.category,
      tags: this._defaultMetadata.tags,
      estimatedDuration: this._defaultMetadata.estimatedDuration,
      location: this._defaultMetadata.location,
      schedulingPolicy: {
        allowReschedule: true,
        maxDelayDays: 7,
        skipWeekends: false,
      },
    });

    return taskTemplate;
  }
}
