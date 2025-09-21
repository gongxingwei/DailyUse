import { ReminderInstanceCore } from '@dailyuse/domain-core';
import { ReminderContracts } from '@dailyuse/contracts';

/**
 * 提醒实例实体 - 服务端实现
 * 继承核心 ReminderInstance 类，添加服务端特有功能
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

  // ===== 服务端特有方法 =====

  /**
   * 调度提醒（服务端业务逻辑）
   */
  scheduleNotification(): void {
    if (this.status !== ReminderContracts.ReminderStatus.PENDING) {
      throw new Error('只有待触发状态的提醒可以调度');
    }

    // 这里可以添加实际的调度逻辑
    // 例如：添加到消息队列、设置定时器等
    console.log(`调度提醒: ${this.uuid} 在 ${this.scheduledTime.toISOString()}`);
  }

  /**
   * 取消调度
   */
  cancelSchedule(): void {
    if (this.status === ReminderContracts.ReminderStatus.PENDING) {
      // 这里可以添加实际的取消调度逻辑
      console.log(`取消调度: ${this.uuid}`);
    }
  }

  /**
   * 发送通知（服务端业务逻辑）
   */
  sendNotification(): void {
    if (this.status !== ReminderContracts.ReminderStatus.TRIGGERED) {
      throw new Error('只有已触发状态的提醒可以发送通知');
    }

    // 这里可以添加实际的通知发送逻辑
    // 例如：推送通知、发送邮件、短信等
    console.log(`发送通知: ${this.message}`);
  }

  /**
   * 记录用户交互（服务端埋点）
   */
  recordInteraction(action: 'view' | 'click' | 'dismiss' | 'snooze', metadata?: any): void {
    const interaction = {
      action,
      timestamp: new Date(),
      instanceUuid: this.uuid,
      metadata,
    };

    // 这里可以添加实际的埋点逻辑
    console.log('记录交互:', interaction);
  }

  /**
   * 计算响应时间
   */
  calculateResponseTime(): number {
    if (!this.triggeredTime || (!this.acknowledgedTime && !this.dismissedTime)) {
      return 0;
    }

    const responseTime = this.acknowledgedTime || this.dismissedTime;
    return responseTime!.getTime() - this.triggeredTime.getTime();
  }

  /**
   * 检查是否需要升级优先级
   */
  shouldEscalatePriority(): boolean {
    if (this.status !== ReminderContracts.ReminderStatus.TRIGGERED) {
      return false;
    }

    const now = new Date();
    const timeSinceTrigger = now.getTime() - (this.triggeredTime?.getTime() || 0);
    
    // 根据优先级设置不同的升级阈值
    const escalationThresholds = {
      [ReminderContracts.ReminderPriority.LOW]: 60 * 60 * 1000, // 1小时
      [ReminderContracts.ReminderPriority.NORMAL]: 30 * 60 * 1000, // 30分钟
      [ReminderContracts.ReminderPriority.HIGH]: 15 * 60 * 1000, // 15分钟
      [ReminderContracts.ReminderPriority.URGENT]: 5 * 60 * 1000, // 5分钟
    };

    return timeSinceTrigger > escalationThresholds[this.priority];
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
   * 从模板创建实例
   */
  static createFromTemplate(
    template: { uuid: string; message: string; priority: ReminderContracts.ReminderPriority },
    scheduledTime: Date,
    context?: any
  ): ReminderInstance {
    const now = new Date();
    return new ReminderInstance({
      templateUuid: template.uuid,
      title: context?.title,
      message: template.message,
      scheduledTime,
      status: ReminderContracts.ReminderStatus.PENDING,
      priority: template.priority,
      metadata: {
        category: context?.category || '',
        tags: context?.tags || [],
        sourceType: 'template',
        sourceId: template.uuid,
      },
      snoozeHistory: [],
      createdAt: now,
      updatedAt: now,
    });
  }
}