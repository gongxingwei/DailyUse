import { ReminderTemplateCore } from '@dailyuse/domain-core';
import { ReminderContracts } from '@dailyuse/contracts';
import { timeConfigToCronExpression } from '../../schedule/services/cronHelper';

/**
 * 提醒模板聚合根 - 服务端实现
 *
 * ⚠️ 架构重构说明：
 * - 不再管理 instances 数组
 * - 所有提醒调度由 Schedule 模块的 RecurringScheduleTask 负责
 * - 通过事件驱动自动创建/更新/删除调度任务
 */
export class ReminderTemplate extends ReminderTemplateCore {
  constructor(params: {
    uuid?: string;
    groupUuid?: string;
    name: string;
    description?: string;
    message?: string;
    enabled?: boolean;
    selfEnabled?: boolean;
    importanceLevel?: any;
    timeConfig?: ReminderContracts.ReminderTimeConfig;
    priority?: ReminderContracts.ReminderPriority;
    category?: string;
    tags?: string[];
    icon?: string;
    color?: string;
    position?: { x: number; y: number };
    displayOrder?: number;
    notificationSettings?: ReminderContracts.NotificationSettings;
    snoozeConfig?: ReminderContracts.SnoozeConfig;
    lifecycle?: {
      createdAt?: Date;
      updatedAt?: Date;
      lastTriggered?: Date;
      triggerCount?: number;
    };
    analytics?: {
      totalTriggers?: number;
      acknowledgedCount?: number;
      dismissedCount?: number;
      snoozeCount?: number;
      avgResponseTime?: number;
    };
    version?: number;
  }) {
    super(params);
  }

  // ===== Schedule 模块集成方法 =====

  /**
   * 转换为 cron 表达式
   * 用于 Schedule 模块的定时调度
   */
  toCronExpression(): string | null {
    return timeConfigToCronExpression(this.timeConfig);
  }

  /**
   * 获取关联的调度任务元数据
   * 传递给 RecurringScheduleTask 使用
   */
  getScheduleTaskMetadata(): Record<string, any> {
    return {
      templateUuid: this.uuid,
      templateName: this.name,
      message: this.message,
      priority: this.priority,
      category: this.category,
      tags: this.tags,
      notificationSettings: this.notificationSettings,
      snoozeConfig: this.snoozeConfig,
      importanceLevel: this.importanceLevel,
      timeConfig: this.timeConfig,
    };
  }

  /**
   * 判断是否应该创建调度任务
   */
  shouldCreateScheduleTask(): boolean {
    return this.enabled && this.selfEnabled;
  }

  /**
   * 获取调度任务名称
   */
  getScheduleTaskName(): string {
    return `[提醒] ${this.name}`;
  }

  /**
   * 克隆模板
   */
  clone(): ReminderTemplate {
    return ReminderTemplate.fromDTO(this.toDTO());
  }

  // ===== 序列化方法 =====

  static fromDTO(dto: ReminderContracts.IReminderTemplate): ReminderTemplate {
    return new ReminderTemplate({
      uuid: dto.uuid,
      groupUuid: dto.groupUuid,
      name: dto.name,
      description: dto.description,
      message: dto.message,
      enabled: dto.enabled,
      selfEnabled: dto.selfEnabled,
      importanceLevel: dto.importanceLevel,
      timeConfig: dto.timeConfig,
      priority: dto.priority,
      category: dto.category,
      tags: dto.tags,
      icon: dto.icon,
      color: dto.color,
      position: dto.position,
      displayOrder: dto.displayOrder,
      notificationSettings: dto.notificationSettings,
      snoozeConfig: dto.snoozeConfig,
      lifecycle: dto.lifecycle,
      analytics: dto.analytics,
      version: dto.version,
    });
  }

  static fromPersistence(data: ReminderContracts.ReminderTemplatePersistenceDTO): ReminderTemplate {
    const parseTags = (tags: any): string[] => {
      if (Array.isArray(tags)) return tags;
      if (typeof tags === 'string') {
        try {
          const parsed = JSON.parse(tags);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return [];
    };

    const parseJsonObject = (value: any): any => {
      if (typeof value === 'object' && value !== null) return value;
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch {
          return {};
        }
      }
      return {};
    };

    const timeConfig = parseJsonObject(data.timeConfig) as ReminderContracts.ReminderTimeConfig;

    return new ReminderTemplate({
      uuid: data.uuid,
      groupUuid: data.groupUuid,
      name: data.name,
      description: data.description,
      message: data.message,
      enabled: Boolean(data.enabled),
      selfEnabled: Boolean(data.selfEnabled),
      importanceLevel: data.importanceLevel,
      timeConfig: timeConfig,
      priority: data.priority,
      category: data.category,
      tags: parseTags(data.tags),
      icon: data.icon,
      color: data.color,
      position: parseJsonObject(data.position),
      displayOrder: data.displayOrder,
      notificationSettings: parseJsonObject(data.notificationSettings),
      snoozeConfig: parseJsonObject(data.snoozeConfig),
      lifecycle: parseJsonObject(data.lifecycle),
      analytics: parseJsonObject(data.analytics),
      version: data.version,
    });
  }

  toPersistence(accountUuid: string): ReminderContracts.ReminderTemplatePersistenceDTO {
    return {
      uuid: this.uuid,
      groupUuid: this.groupUuid,
      name: this.name,
      description: this.description,
      message: this.message,
      enabled: this.enabled ? 1 : 0,
      selfEnabled: this.selfEnabled ? 1 : 0,
      importanceLevel: this.importanceLevel,
      timeConfig: JSON.stringify(this.timeConfig),
      priority: this.priority,
      category: this.category,
      tags: this.tags,
      icon: this.icon,
      color: this.color,
      position: this.position ? JSON.stringify(this.position) : undefined,
      displayOrder: this.displayOrder,
      notificationSettings: this.notificationSettings
        ? JSON.stringify(this.notificationSettings)
        : undefined,
      snoozeConfig: this.snoozeConfig ? JSON.stringify(this.snoozeConfig) : undefined,
      lifecycle: JSON.stringify(this.lifecycle),
      analytics: JSON.stringify(this.analytics),
      version: this.version,
    };
  }

  /**
   * 转换为客户端 DTO
   *
   * ⚠️ 架构更改：不再包含 instances 数组
   * 调度信息由 Schedule 模块提供
   */
  toClient(): ReminderContracts.ReminderTemplateClientDTO {
    const baseDTO = this.toDTO();

    return {
      uuid: baseDTO.uuid,
      groupUuid: baseDTO.groupUuid,
      name: baseDTO.name,
      description: baseDTO.description,
      message: baseDTO.message,
      enabled: baseDTO.enabled,
      selfEnabled: baseDTO.selfEnabled,
      importanceLevel: baseDTO.importanceLevel,
      timeConfig: baseDTO.timeConfig,
      priority: baseDTO.priority,
      category: baseDTO.category,
      tags: baseDTO.tags,
      icon: baseDTO.icon,
      color: baseDTO.color,
      position: baseDTO.position,
      displayOrder: baseDTO.displayOrder,
      notificationSettings: baseDTO.notificationSettings,
      snoozeConfig: baseDTO.snoozeConfig,
      lifecycle: {
        createdAt: baseDTO.lifecycle.createdAt.getTime(),
        updatedAt: baseDTO.lifecycle.updatedAt.getTime(),
        lastTriggered: baseDTO.lifecycle.lastTriggered?.getTime(),
        triggerCount: baseDTO.lifecycle.triggerCount,
      },
      analytics: baseDTO.analytics,
      version: baseDTO.version,
      // 删除了 instances 数组
      // 删除了 nextTriggerTime 和 activeInstancesCount
      // 这些信息由 Schedule 模块的 RecurringScheduleTask 提供
      effectiveEnabled: this.enabled && this.selfEnabled,
    };
  }
}
