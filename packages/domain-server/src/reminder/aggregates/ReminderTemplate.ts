import { ReminderTemplateCore } from '@dailyuse/domain-core';
import { ReminderContracts } from '@dailyuse/contracts';
import { ReminderInstance } from '../entities/ReminderInstance';

/**
 * 提醒模板聚合根 - 服务端实现
 * 继承核心 ReminderTemplate 类，添加服务端特有功能
 */
export class ReminderTemplate extends ReminderTemplateCore {
  // 重新声明属性类型为具体的实体类型
  declare instances: ReminderInstance[];

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
    instances?: any[];
  }) {
    super(params);

    this.instances =
      params.instances?.map((inst) =>
        inst instanceof ReminderInstance ? inst : ReminderInstance.fromDTO(inst),
      ) || [];
  }

  // ===== 抽象方法实现 =====

  /**
   * 创建提醒实例
   */
  createInstance(triggerTime: Date, context?: any): string {
    const instanceUuid = this.generateUUID();
    const now = new Date();

    const instance = new ReminderInstance({
      uuid: instanceUuid,
      templateUuid: this.uuid,
      title: context?.title,
      message: this.message,
      scheduledTime: triggerTime,
      status: ReminderContracts.ReminderStatus.PENDING,
      priority: this.priority,
      metadata: {
        category: this.category,
        tags: this.tags,
        sourceType: 'template',
        sourceId: this.uuid,
      },
      snoozeHistory: [],
      createdAt: now,
      updatedAt: now,
    });

    this.instances.push(instance);
    this.updateVersion();

    return instanceUuid;
  }

  /**
   * 获取指定实例
   */
  getInstance(instanceUuid: string): ReminderInstance | undefined {
    return this.instances.find((inst) => inst.uuid === instanceUuid);
  }

  /**
   * 删除实例
   */
  removeInstance(instanceUuid: string): void {
    const index = this.instances.findIndex((inst) => inst.uuid === instanceUuid);
    if (index === -1) {
      throw new Error(`提醒实例不存在: ${instanceUuid}`);
    }

    this.instances.splice(index, 1);
    this.updateVersion();
  }

  /**
   * 克隆模板
   */
  clone(): ReminderTemplate {
    return ReminderTemplate.fromDTO(this.toDTO());
  }

  // ===== 服务端特有方法 =====

  /**
   * 根据时间配置生成下一次触发时间
   */
  getNextTriggerTime(fromTime?: Date): Date | null {
    const baseTime = fromTime || new Date();

    switch (this.timeConfig.type) {
      case 'daily':
        return this.calculateDailyTrigger(baseTime);
      case 'weekly':
        return this.calculateWeeklyTrigger(baseTime);
      case 'monthly':
        return this.calculateMonthlyTrigger(baseTime);
      case 'absolute':
        return this.calculateAbsoluteTrigger(baseTime);
      default:
        return null;
    }
  }

  /**
   * 计算每日触发时间
   */
  private calculateDailyTrigger(baseTime: Date): Date {
    const triggerTime = new Date(baseTime);
    const times = this.timeConfig.times || ['09:00'];
    const [hours, minutes] = times[0].split(':').map(Number);

    triggerTime.setHours(hours, minutes, 0, 0);

    // 如果今天的时间已过，设置为明天
    if (triggerTime <= baseTime) {
      triggerTime.setDate(triggerTime.getDate() + 1);
    }

    return triggerTime;
  }

  /**
   * 计算每周触发时间
   */
  private calculateWeeklyTrigger(baseTime: Date): Date {
    // 简化实现 - 设置为下周同一天
    const triggerTime = new Date(baseTime);
    triggerTime.setDate(triggerTime.getDate() + 7);
    return triggerTime;
  }

  /**
   * 计算每月触发时间
   */
  private calculateMonthlyTrigger(baseTime: Date): Date {
    // 简化实现 - 设置为下月同一天
    const triggerTime = new Date(baseTime);
    triggerTime.setMonth(triggerTime.getMonth() + 1);
    return triggerTime;
  }

  /**
   * 计算绝对时间触发
   */
  private calculateAbsoluteTrigger(baseTime: Date): Date | null {
    // 一次性提醒只触发一次
    if (this.analytics.totalTriggers > 0) {
      return null;
    }

    // 如果有指定时间，使用指定时间
    if (this.timeConfig.times && this.timeConfig.times.length > 0) {
      return new Date(this.timeConfig.times[0]);
    }

    return baseTime;
  }

  /**
   * 触发提醒（服务端业务逻辑）
   */
  triggerReminder(instanceUuid: string): void {
    const instance = this.getInstance(instanceUuid);
    if (!instance) {
      throw new Error(`提醒实例不存在: ${instanceUuid}`);
    }

    instance.trigger();

    // 更新统计信息
    this._analytics.totalTriggers++;
    this._lifecycle.lastTriggered = new Date();
    this._lifecycle.triggerCount++;

    this.updateVersion();
  }

  /**
   * 生成UUID
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
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
    // 安全解析 JSON 字段
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
      enabled: Boolean(data.enabled), // Convert number to boolean
      selfEnabled: Boolean(data.selfEnabled), // Convert number to boolean
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
      instances: [], // 子实体单独设置
    });
  }

  toPersistence(accountUuid: string): ReminderContracts.ReminderTemplatePersistenceDTO {
    return {
      uuid: this.uuid,
      groupUuid: this.groupUuid,
      name: this.name,
      description: this.description,
      message: this.message,
      enabled: this.enabled ? 1 : 0, // Convert boolean to number for DB
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
   * 转换为客户端 DTO（包含计算属性）
   */
  toClient(): ReminderContracts.ReminderTemplateClientDTO {
    const baseDTO = this.toDTO();

    // 计算下次触发时间
    const nextTriggerTime = this.getNextTriggerTime();

    // 计算活跃实例数量（pending 和 triggered 状态）
    const activeInstancesCount = this.instances.filter(
      (inst) =>
        inst.status === ReminderContracts.ReminderStatus.PENDING ||
        inst.status === ReminderContracts.ReminderStatus.TRIGGERED,
    ).length;

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
      // 子实体序列化（参考 Goal 模块）
      instances: this.instances.map((inst) => inst.toClient()),
      // 计算属性
      effectiveEnabled: this.enabled && this.selfEnabled,
      nextTriggerTime: nextTriggerTime?.getTime(),
      activeInstancesCount,
    };
  }
}
