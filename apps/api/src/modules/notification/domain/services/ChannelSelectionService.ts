import { NotificationPreference } from '../aggregates/NotificationPreference';
import { NotificationType, NotificationPriority, NotificationChannel } from '@dailyuse/contracts';

/**
 * 渠道选择服务
 *
 * 职责：
 * - 根据用户偏好选择投递渠道
 * - 根据通知类型/优先级推荐渠道
 * - 处理免打扰逻辑
 */
export class ChannelSelectionService {
  /**
   * 根据用户偏好和通知属性选择渠道
   */
  selectChannels(params: {
    preference: NotificationPreference;
    type: NotificationType;
    priority: NotificationPriority;
    requestedChannels?: NotificationChannel[];
  }): NotificationChannel[] {
    const { preference, type, priority, requestedChannels } = params;

    // 1. 获取用户允许的渠道
    const allowedChannels = preference.getAllowedChannels(type);

    if (allowedChannels.length === 0) {
      return [];
    }

    // 2. 如果明确指定了渠道，取交集
    if (requestedChannels && requestedChannels.length > 0) {
      const selected = requestedChannels.filter((ch) => allowedChannels.includes(ch));
      return selected.length > 0 ? selected : allowedChannels;
    }

    // 3. 根据优先级推荐渠道
    return this.recommendChannels(allowedChannels, priority);
  }

  /**
   * 根据优先级推荐渠道
   */
  private recommendChannels(
    availableChannels: NotificationChannel[],
    priority: NotificationPriority,
  ): NotificationChannel[] {
    const channels = [...availableChannels];

    // 紧急通知：使用所有可用渠道
    if (priority === NotificationPriority.URGENT) {
      return channels;
    }

    // 高优先级：推荐 IN_APP + SSE + SYSTEM
    if (priority === NotificationPriority.HIGH) {
      const preferred = [
        NotificationChannel.IN_APP,
        NotificationChannel.SSE,
        NotificationChannel.SYSTEM,
      ];
      const selected = channels.filter((ch) => preferred.includes(ch));
      return selected.length > 0 ? selected : channels;
    }

    // 普通和低优先级：只使用应用内通知
    const inAppOnly = channels.filter((ch) =>
      [NotificationChannel.IN_APP, NotificationChannel.SSE].includes(ch),
    );

    return inAppOnly.length > 0 ? inAppOnly : channels;
  }

  /**
   * 检查是否可以立即发送
   */
  canSendNow(
    preference: NotificationPreference,
    channels: NotificationChannel[],
  ): {
    canSend: boolean;
    blockedChannels: NotificationChannel[];
    reason?: string;
  } {
    const blockedChannels: NotificationChannel[] = [];

    for (const channel of channels) {
      if (preference.isInQuietHours(channel)) {
        blockedChannels.push(channel);
      }
    }

    if (blockedChannels.length === channels.length) {
      return {
        canSend: false,
        blockedChannels,
        reason: 'All channels are in quiet hours',
      };
    }

    return {
      canSend: true,
      blockedChannels,
    };
  }

  /**
   * 获取推荐的默认渠道
   */
  getDefaultChannels(type: NotificationType): NotificationChannel[] {
    // 根据通知类型返回推荐的默认渠道
    switch (type) {
      case NotificationType.SYSTEM:
        return [NotificationChannel.IN_APP, NotificationChannel.SSE];

      case NotificationType.REMINDER:
        return [NotificationChannel.IN_APP, NotificationChannel.SSE, NotificationChannel.SYSTEM];

      case NotificationType.ERROR:
      case NotificationType.WARNING:
        return [NotificationChannel.IN_APP, NotificationChannel.SSE];

      case NotificationType.SUCCESS:
      case NotificationType.INFO:
        return [NotificationChannel.IN_APP, NotificationChannel.SSE];

      default:
        return [NotificationChannel.IN_APP];
    }
  }
}
