import { ReminderInstanceCore } from '@dailyuse/domain-core';
import { ReminderContracts } from '@dailyuse/contracts';

/**
 * 提醒实例实体 - 客户端实现
 * 继承核心 ReminderInstance 类，添加客户端特有功能
 */
export class ReminderInstance extends ReminderInstanceCore {
  constructor(params: {
    uuid?: string;
    templateUuid: string;
    title?: string;
    message: string;
    scheduledTime: Date;
    triggeredTime?: Date;
    acknowledgedTime?: Date;
    dismissedTime?: Date;
    snoozedUntil?: Date;
    status: ReminderContracts.ReminderStatus;
    priority: ReminderContracts.ReminderPriority;
    metadata: {
      category: string;
      tags: string[];
      sourceType?: 'template' | 'task' | 'goal' | 'manual';
      sourceId?: string;
    };
    snoozeHistory: Array<{
      snoozedAt: Date;
      snoozeUntil: Date;
      snoozeType?: ReminderContracts.SnoozeType;
      customMinutes?: number;
      reason?: string;
    }>;
    createdAt?: Date;
    updatedAt?: Date;
    version?: number;
  }) {
    super(params);
  }

  // ===== 抽象方法实现 =====

  /**
   * 克隆实例
   */
  clone(): ReminderInstance {
    return ReminderInstance.fromDTO(this.toDTO());
  }

  // ===== 客户端特有方法 =====

  /**
   * 获取状态颜色（UI相关）
   */
  get statusColor(): string {
    switch (this.status) {
      case ReminderContracts.ReminderStatus.PENDING:
        return '#2196F3';
      case ReminderContracts.ReminderStatus.TRIGGERED:
        return '#FF9800';
      case ReminderContracts.ReminderStatus.ACKNOWLEDGED:
        return '#4CAF50';
      case ReminderContracts.ReminderStatus.DISMISSED:
        return '#9E9E9E';
      case ReminderContracts.ReminderStatus.SNOOZED:
        return '#9C27B0';
      default:
        return '#000000';
    }
  }

  /**
   * 获取状态文本
   */
  get statusText(): string {
    switch (this.status) {
      case ReminderContracts.ReminderStatus.PENDING:
        return '待触发';
      case ReminderContracts.ReminderStatus.TRIGGERED:
        return '已触发';
      case ReminderContracts.ReminderStatus.ACKNOWLEDGED:
        return '已确认';
      case ReminderContracts.ReminderStatus.DISMISSED:
        return '已忽略';
      case ReminderContracts.ReminderStatus.SNOOZED:
        return '已延后';
      default:
        return '未知';
    }
  }

  /**
   * 获取优先级颜色
   */
  get priorityColor(): string {
    switch (this.priority) {
      case ReminderContracts.ReminderPriority.LOW:
        return '#4CAF50';
      case ReminderContracts.ReminderPriority.NORMAL:
        return '#2196F3';
      case ReminderContracts.ReminderPriority.HIGH:
        return '#FF9800';
      case ReminderContracts.ReminderPriority.URGENT:
        return '#F44336';
      default:
        return '#000000';
    }
  }

  /**
   * 检查是否可以编辑
   */
  get canEdit(): boolean {
    return this.status === ReminderContracts.ReminderStatus.PENDING;
  }

  /**
   * 检查是否可以删除
   */
  get canDelete(): boolean {
    return true; // 实例总是可以删除的
  }

  /**
   * 检查是否可以延后
   */
  get canSnooze(): boolean {
    return this.status === ReminderContracts.ReminderStatus.TRIGGERED;
  }

  // ===== 序列化方法 =====

  static fromDTO(dto: ReminderContracts.IReminderInstance): ReminderInstance {
    return new ReminderInstance({
      uuid: dto.uuid,
      templateUuid: dto.templateUuid,
      title: dto.title,
      message: dto.message,
      scheduledTime: dto.scheduledTime,
      triggeredTime: dto.triggeredTime,
      acknowledgedTime: dto.acknowledgedTime,
      dismissedTime: dto.dismissedTime,
      snoozedUntil: dto.snoozedUntil,
      status: dto.status,
      priority: dto.priority,
      metadata: dto.metadata,
      snoozeHistory: dto.snoozeHistory,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      version: dto.version,
    });
  }

  /**
   * 转换为 API 响应格式（包含计算属性）
   * 注意：这个方法需要 accountUuid 等额外信息，通常不在客户端实体中使用
   * 建议直接使用服务端实体的 toClient() 方法
   */
  toApiResponse(
    accountUuid: string,
    templateName?: string,
    groupName?: string,
  ): ReminderContracts.ReminderInstanceResponse {
    const dto = this.toDTO();
    const now = new Date();
    const scheduledTime = dto.scheduledTime.getTime();
    const timeUntil = scheduledTime - now.getTime();
    const isOverdue = now.getTime() > scheduledTime;

    // 格式化时间显示
    let formattedTime: string;
    const absTimeUntil = Math.abs(timeUntil);
    const hours = Math.floor(absTimeUntil / (60 * 60 * 1000));
    const minutes = Math.floor((absTimeUntil % (60 * 60 * 1000)) / (60 * 1000));

    if (isOverdue) {
      if (hours > 0) {
        formattedTime = `已逾期 ${hours} 小时 ${minutes} 分钟`;
      } else {
        formattedTime = `已逾期 ${minutes} 分钟`;
      }
    } else {
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        formattedTime = `${days} 天后`;
      } else if (hours > 0) {
        formattedTime = `${hours} 小时 ${minutes} 分钟后`;
      } else {
        formattedTime = `${minutes} 分钟后`;
      }
    }

    return {
      uuid: dto.uuid,
      accountUuid,
      templateUuid: dto.templateUuid,
      title: dto.title,
      message: dto.message,
      scheduledTime: dto.scheduledTime.getTime(),
      triggeredTime: dto.triggeredTime?.getTime(),
      acknowledgedTime: dto.acknowledgedTime?.getTime(),
      dismissedTime: dto.dismissedTime?.getTime(),
      snoozedUntil: dto.snoozedUntil?.getTime(),
      status: dto.status,
      priority: dto.priority,
      metadata: dto.metadata,
      snoozeHistory: dto.snoozeHistory.map((item) => ({
        ...item,
        snoozedAt: item.snoozedAt.getTime(),
        snoozeUntil: item.snoozeUntil.getTime(),
      })),
      currentSnoozeCount: dto.currentSnoozeCount || 0,
      createdAt: dto.createdAt?.getTime() || Date.now(),
      updatedAt: dto.updatedAt?.getTime() || Date.now(),
      version: dto.version,
      // 计算属性
      isOverdue,
      timeUntil,
      formattedTime,
      templateName,
      groupName,
    };
  }

  /**
   * 从 API 响应创建实例
   */
  static fromResponse(response: any): ReminderInstance {
    return new ReminderInstance({
      uuid: response.uuid,
      templateUuid: response.templateUuid,
      title: response.title,
      message: response.message,
      scheduledTime: response.scheduledTime ? new Date(response.scheduledTime) : new Date(),
      triggeredTime: response.triggeredTime ? new Date(response.triggeredTime) : undefined,
      acknowledgedTime: response.acknowledgedTime ? new Date(response.acknowledgedTime) : undefined,
      dismissedTime: response.dismissedTime ? new Date(response.dismissedTime) : undefined,
      snoozedUntil: response.snoozedUntil ? new Date(response.snoozedUntil) : undefined,
      status: response.status,
      priority: response.priority,
      metadata: response.metadata,
      snoozeHistory: response.snoozeHistory || [],
      createdAt: response.createdAt ? new Date(response.createdAt) : new Date(),
      updatedAt: response.updatedAt ? new Date(response.updatedAt) : new Date(),
      version: response.version,
    });
  }

  /**
   * 创建一个空的实例（用于新建表单）
   */
  static forCreate(templateUuid: string): ReminderInstance {
    const now = new Date();
    return new ReminderInstance({
      templateUuid,
      message: '',
      scheduledTime: now,
      status: ReminderContracts.ReminderStatus.PENDING,
      priority: ReminderContracts.ReminderPriority.NORMAL,
      metadata: {
        category: '',
        tags: [],
        sourceType: 'template',
        sourceId: templateUuid,
      },
      snoozeHistory: [],
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 从客户端 DTO 创建实体（用于 API 响应）
   */
  static fromClientDTO(dto: ReminderContracts.ReminderInstanceClientDTO): ReminderInstance {
    return new ReminderInstance({
      uuid: dto.uuid,
      templateUuid: dto.templateUuid,
      title: dto.title,
      message: dto.message,
      scheduledTime: new Date(dto.scheduledTime),
      triggeredTime: dto.triggeredTime ? new Date(dto.triggeredTime) : undefined,
      acknowledgedTime: dto.acknowledgedTime ? new Date(dto.acknowledgedTime) : undefined,
      dismissedTime: dto.dismissedTime ? new Date(dto.dismissedTime) : undefined,
      snoozedUntil: dto.snoozedUntil ? new Date(dto.snoozedUntil) : undefined,
      status: dto.status,
      priority: dto.priority,
      metadata: {
        category: dto.metadata.category,
        tags: [...dto.metadata.tags],
        sourceType: dto.metadata.sourceType,
        sourceId: dto.metadata.sourceId,
      },
      snoozeHistory: dto.snoozeHistory.map((h) => ({
        snoozedAt: new Date(h.snoozedAt),
        snoozeUntil: new Date(h.snoozeUntil),
        snoozeType: h.snoozeType,
        customMinutes: h.customMinutes,
        reason: h.reason,
      })),
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      version: dto.version,
    });
  }
}
