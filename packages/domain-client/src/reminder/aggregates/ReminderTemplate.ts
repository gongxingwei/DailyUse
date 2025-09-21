import { ReminderTemplateCore } from '@dailyuse/domain-core';
import { ReminderContracts } from '@dailyuse/contracts';
import { ReminderInstance } from '../entities/ReminderInstance';

/**
 * 客户端 ReminderTemplate 实体
 * 继承核心 ReminderTemplate 类，添加客户端特有功能
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

  // ===== 客户端特有方法 =====

  /**
   * 获取进度颜色（UI相关）
   */
  get progressColor(): string {
    const completionRate = this.completionRate;
    if (completionRate >= 80) return 'success';
    if (completionRate >= 60) return 'warning';
    if (completionRate >= 40) return 'info';
    if (completionRate >= 20) return 'primary';
    return 'error';
  }

  /**
   * 获取状态文本
   */
  get statusText(): string {
    if (!this.enabled) return '已禁用';
    if (!this.isActuallyEnabled) return '组禁用';
    if (this.activeInstanceCount > 0) return '活跃';
    return '待触发';
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

  /**
   * 转换为 API 响应格式
   */
  toApiResponse(): ReminderContracts.ReminderTemplateResponse {
    const dto = this.toDTO();
    return {
      ...dto,
      lifecycle: dto.lifecycle
        ? {
            createdAt: dto.lifecycle.createdAt.toISOString(),
            updatedAt: dto.lifecycle.updatedAt.toISOString(),
            lastTriggered: dto.lifecycle.lastTriggered?.toISOString(),
            triggerCount: dto.lifecycle.triggerCount,
          }
        : {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            triggerCount: 0,
          },
    };
  }

  /**
   * 从 API 响应创建模板实例
   */
  static fromApiResponse(response: any): ReminderTemplate {
    return new ReminderTemplate({
      uuid: response.uuid,
      groupUuid: response.groupUuid,
      name: response.name,
      description: response.description,
      message: response.message,
      enabled: response.enabled,
      selfEnabled: response.selfEnabled,
      importanceLevel: response.importanceLevel,
      timeConfig: response.timeConfig,
      priority: response.priority,
      category: response.category,
      tags: response.tags,
      icon: response.icon,
      color: response.color,
      position: response.position,
      displayOrder: response.displayOrder,
      notificationSettings: response.notificationSettings,
      snoozeConfig: response.snoozeConfig,
      lifecycle: response.lifecycle
        ? {
            createdAt: response.lifecycle.createdAt
              ? new Date(response.lifecycle.createdAt)
              : new Date(),
            updatedAt: response.lifecycle.updatedAt
              ? new Date(response.lifecycle.updatedAt)
              : new Date(),
            lastTriggered: response.lifecycle.lastTriggered
              ? new Date(response.lifecycle.lastTriggered)
              : undefined,
            triggerCount: response.lifecycle.triggerCount || 0,
          }
        : undefined,
      analytics: response.analytics,
      version: response.version,
    });
  }

  /**
   * 创建一个空的模板实例（用于新建表单）
   */
  static forCreate(): ReminderTemplate {
    return new ReminderTemplate({
      name: '',
      message: '',
      category: '',
      tags: [],
      enabled: true,
      selfEnabled: true,
      priority: ReminderContracts.ReminderPriority.NORMAL,
      timeConfig: {
        type: 'daily',
        times: ['09:00'],
      },
    });
  }
}
