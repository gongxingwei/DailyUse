/**
 * Notification Domain Events
 * @description Notification 模块领域事件定义
 * @author DailyUse Team
 * @date 2025-01-10
 */

import { DomainEvent } from '@dailyuse/domain-core';
import { NotificationChannel } from '@dailyuse/contracts';

/**
 * 通知已创建事件
 *
 * 触发时机：Notification 聚合根创建时
 * 用途：
 * - 审计日志
 * - 统计分析
 * - 触发后续流程（如准备发送）
 */
export class NotificationCreatedEvent extends DomainEvent {
  static readonly EVENT_TYPE = 'notification.created';

  constructor(
    notificationUuid: string,
    public readonly accountUuid: string,
    public readonly payload: {
      title: string;
      content: string;
      type: string;
      priority: string;
      channels: NotificationChannel[];
      scheduledTime?: Date;
      metadata?: Record<string, any>;
    },
  ) {
    super(notificationUuid, NotificationCreatedEvent.EVENT_TYPE);
  }

  toPrimitives(): Record<string, any> {
    return {
      notificationUuid: this.aggregateId,
      accountUuid: this.accountUuid,
      payload: this.payload,
      occurredOn: this.occurredOn.toISOString(),
      eventId: this.eventId,
    };
  }
}

/**
 * 通知发送中事件
 *
 * 触发时机：开始发送通知到各个渠道时
 * 用途：
 * - 记录发送开始时间
 * - 监控发送流程
 */
export class NotificationSendingEvent extends DomainEvent {
  static readonly EVENT_TYPE = 'notification.sending';

  constructor(
    notificationUuid: string,
    public readonly accountUuid: string,
    public readonly payload: {
      channels: NotificationChannel[];
      sentAt: Date;
    },
  ) {
    super(notificationUuid, NotificationSendingEvent.EVENT_TYPE);
  }

  toPrimitives(): Record<string, any> {
    return {
      notificationUuid: this.aggregateId,
      accountUuid: this.accountUuid,
      payload: this.payload,
      occurredOn: this.occurredOn.toISOString(),
      eventId: this.eventId,
    };
  }
}

/**
 * 通知已发送事件
 *
 * 触发时机：通知发送到所有渠道后（无论成功失败）
 * 用途：
 * - 记录发送完成
 * - 统计发送成功率
 * - 触发后续流程（如发送报告）
 */
export class NotificationSentEvent extends DomainEvent {
  static readonly EVENT_TYPE = 'notification.sent';

  constructor(
    notificationUuid: string,
    public readonly accountUuid: string,
    public readonly payload: {
      sentChannels: NotificationChannel[];
      failedChannels: NotificationChannel[];
      totalChannels: number;
      successRate: number;
      sentAt: Date;
    },
  ) {
    super(notificationUuid, NotificationSentEvent.EVENT_TYPE);
  }

  toPrimitives(): Record<string, any> {
    return {
      notificationUuid: this.aggregateId,
      accountUuid: this.accountUuid,
      payload: this.payload,
      occurredOn: this.occurredOn.toISOString(),
      eventId: this.eventId,
    };
  }
}

/**
 * 通知渠道发送成功事件
 *
 * 触发时机：单个渠道发送成功时
 * 用途：
 * - 记录单个渠道的发送结果
 * - 实时监控各渠道发送状态
 * - 用于重试逻辑
 */
export class NotificationChannelSentEvent extends DomainEvent {
  static readonly EVENT_TYPE = 'notification.channel.sent';

  constructor(
    notificationUuid: string,
    public readonly accountUuid: string,
    public readonly payload: {
      channel: NotificationChannel;
      sentAt: Date;
      deliveredAt?: Date;
      metadata?: Record<string, any>;
    },
  ) {
    super(notificationUuid, NotificationChannelSentEvent.EVENT_TYPE);
  }

  toPrimitives(): Record<string, any> {
    return {
      notificationUuid: this.aggregateId,
      accountUuid: this.accountUuid,
      payload: this.payload,
      occurredOn: this.occurredOn.toISOString(),
      eventId: this.eventId,
    };
  }
}

/**
 * 通知渠道发送失败事件
 *
 * 触发时机：单个渠道发送失败时
 * 用途：
 * - 记录失败原因
 * - 触发重试机制
 * - 保存到死信队列
 * - 告警通知
 */
export class NotificationChannelFailedEvent extends DomainEvent {
  static readonly EVENT_TYPE = 'notification.channel.failed';

  constructor(
    notificationUuid: string,
    public readonly accountUuid: string,
    public readonly payload: {
      channel: NotificationChannel;
      failureReason: string;
      retryCount: number;
      canRetry: boolean;
      failedAt: Date;
    },
  ) {
    super(notificationUuid, NotificationChannelFailedEvent.EVENT_TYPE);
  }

  toPrimitives(): Record<string, any> {
    return {
      notificationUuid: this.aggregateId,
      accountUuid: this.accountUuid,
      payload: this.payload,
      occurredOn: this.occurredOn.toISOString(),
      eventId: this.eventId,
    };
  }
}

/**
 * 通知已读事件
 *
 * 触发时机：用户标记通知为已读时
 * 用途：
 * - 更新未读计数
 * - 统计阅读率
 * - 触发后续动作（如标记相关任务完成）
 */
export class NotificationReadEvent extends DomainEvent {
  static readonly EVENT_TYPE = 'notification.read';

  constructor(
    notificationUuid: string,
    public readonly accountUuid: string,
    public readonly payload: {
      readAt: Date;
      readDuration?: number; // 从发送到阅读的时间（毫秒）
    },
  ) {
    super(notificationUuid, NotificationReadEvent.EVENT_TYPE);
  }

  toPrimitives(): Record<string, any> {
    return {
      notificationUuid: this.aggregateId,
      accountUuid: this.accountUuid,
      payload: this.payload,
      occurredOn: this.occurredOn.toISOString(),
      eventId: this.eventId,
    };
  }
}

/**
 * 通知已忽略事件
 *
 * 触发时机：用户忽略通知时
 * 用途：
 * - 更新通知状态
 * - 统计忽略率
 * - 调整推送策略
 */
export class NotificationDismissedEvent extends DomainEvent {
  static readonly EVENT_TYPE = 'notification.dismissed';

  constructor(
    notificationUuid: string,
    public readonly accountUuid: string,
    public readonly payload: {
      dismissedAt: Date;
    },
  ) {
    super(notificationUuid, NotificationDismissedEvent.EVENT_TYPE);
  }

  toPrimitives(): Record<string, any> {
    return {
      notificationUuid: this.aggregateId,
      accountUuid: this.accountUuid,
      payload: this.payload,
      occurredOn: this.occurredOn.toISOString(),
      eventId: this.eventId,
    };
  }
}

/**
 * 通知已过期事件
 *
 * 触发时机：通知超过有效期时
 * 用途：
 * - 自动清理过期通知
 * - 统计过期率
 * - 优化调度策略
 */
export class NotificationExpiredEvent extends DomainEvent {
  static readonly EVENT_TYPE = 'notification.expired';

  constructor(
    notificationUuid: string,
    public readonly accountUuid: string,
    public readonly payload: {
      expiredAt: Date;
      wasRead: boolean;
    },
  ) {
    super(notificationUuid, NotificationExpiredEvent.EVENT_TYPE);
  }

  toPrimitives(): Record<string, any> {
    return {
      notificationUuid: this.aggregateId,
      accountUuid: this.accountUuid,
      payload: this.payload,
      occurredOn: this.occurredOn.toISOString(),
      eventId: this.eventId,
    };
  }
}

/**
 * 通知发送失败事件（所有渠道失败）
 *
 * 触发时机：所有渠道都发送失败时
 * 用途：
 * - 触发告警
 * - 记录严重错误
 * - 通知运维团队
 */
export class NotificationFailedEvent extends DomainEvent {
  static readonly EVENT_TYPE = 'notification.failed';

  constructor(
    notificationUuid: string,
    public readonly accountUuid: string,
    public readonly payload: {
      failedChannels: NotificationChannel[];
      failureReasons: Record<string, string>; // channel -> reason
      failedAt: Date;
    },
  ) {
    super(notificationUuid, NotificationFailedEvent.EVENT_TYPE);
  }

  toPrimitives(): Record<string, any> {
    return {
      notificationUuid: this.aggregateId,
      accountUuid: this.accountUuid,
      payload: this.payload,
      occurredOn: this.occurredOn.toISOString(),
      eventId: this.eventId,
    };
  }
}

/**
 * 通知重试事件
 *
 * 触发时机：通知开始重试发送时
 * 用途：
 * - 记录重试次数
 * - 监控重试效果
 * - 调整重试策略
 */
export class NotificationRetryingEvent extends DomainEvent {
  static readonly EVENT_TYPE = 'notification.retrying';

  constructor(
    notificationUuid: string,
    public readonly accountUuid: string,
    public readonly payload: {
      channel: NotificationChannel;
      retryCount: number;
      maxRetries: number;
      nextRetryAt?: Date;
    },
  ) {
    super(notificationUuid, NotificationRetryingEvent.EVENT_TYPE);
  }

  toPrimitives(): Record<string, any> {
    return {
      notificationUuid: this.aggregateId,
      accountUuid: this.accountUuid,
      payload: this.payload,
      occurredOn: this.occurredOn.toISOString(),
      eventId: this.eventId,
    };
  }
}
