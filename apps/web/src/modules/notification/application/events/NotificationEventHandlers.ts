/**
 * Notification 模块事件处理器
 * @description 监听Schedule模块的提醒触发事件，处理系统级通知
 */

import { eventBus } from '@dailyuse/utils';
import { NotificationService } from '../services/NotificationService';

import {
  NotificationType,
  NotificationPriority,
  NotificationMethod,
  SoundType,
} from '../../domain/types';

import type { ReminderTriggeredPayload, NotificationConfig, SoundConfig } from '../../domain/types';

import {
  NOTIFICATION_EVENTS,
  SCHEDULE_EVENTS,
  onReminderTriggered,
  onScheduleReminderTriggered,
} from '../events/notificationEvents';

/**
 * Notification模块事件处理器
 */
export class NotificationEventHandlers {
  private notificationService: NotificationService;
  private isInitialized = false;

  constructor() {
    this.notificationService = NotificationService.getInstance();
  }

  /**
   * 初始化事件监听器
   */
  initializeEventHandlers(): void {
    if (this.isInitialized) {
      console.warn('[NotificationEventHandlers] 事件处理器已初始化');
      return;
    }

    console.log('[NotificationEventHandlers] 初始化事件处理器...');

    // 监听Schedule模块的提醒触发事件
    this.setupScheduleEventListeners();

    // 监听Notification模块内部事件
    this.setupInternalEventListeners();

    // 监听系统事件
    this.setupSystemEventListeners();

    this.isInitialized = true;
    console.log('[NotificationEventHandlers] 事件处理器初始化完成');
  }

  /**
   * 设置Schedule模块事件监听器
   * 统一监听 reminder-triggered 事件，通过 sourceType 区分类型
   */
  private setupScheduleEventListeners(): void {
    console.log('[NotificationEventHandlers] 设置Schedule事件监听器');

    // ⚠️ 注意：此处理器已被 ReminderNotificationHandler 替代
    // ReminderNotificationHandler 专门处理 SSE 提醒事件
    // NotificationEventHandlers 保留用于监控和调试

    // 统一监听 reminder-triggered 事件（推荐方式）
    eventBus.on('reminder-triggered', async (payload: any) => {
      console.log('[NotificationEventHandlers] 📨 收到统一提醒事件:', {
        reminderId: payload.reminderId || payload.id,
        sourceType: payload.sourceType || payload.type,
        title: payload.title,
      });

      // 标准化数据格式
      const standardPayload = this.normalizeReminderPayload(payload);

      // 根据来源类型处理（已被 ReminderNotificationHandler 处理，此处仅记录）
      console.log('[NotificationEventHandlers] 提醒类型:', standardPayload.sourceType);
      console.log('[NotificationEventHandlers] ⚠️ 实际处理由 ReminderNotificationHandler 完成');
    });
  }

  /**
   * 设置内部事件监听器
   */
  private setupInternalEventListeners(): void {
    console.log('[NotificationEventHandlers] 设置内部事件监听器');

    // 监听通知创建事件（用于统计和日志）
    eventBus.on(NOTIFICATION_EVENTS.NOTIFICATION_CREATED, (payload) => {
      console.log('[NotificationEventHandlers] 通知已创建:', payload.notification.id);
    });

    // 监听通知显示事件
    eventBus.on(NOTIFICATION_EVENTS.NOTIFICATION_SHOWN, (payload) => {
      console.log(
        '[NotificationEventHandlers] 通知已显示:',
        payload.notification.id,
        payload.displayMethod,
      );
    });

    // 监听通知点击事件
    eventBus.on(NOTIFICATION_EVENTS.NOTIFICATION_CLICKED, (payload) => {
      console.log(
        '[NotificationEventHandlers] 通知被点击:',
        payload.notification.id,
        payload.actionId,
      );
    });

    // 监听权限变更事件
    eventBus.on(NOTIFICATION_EVENTS.PERMISSION_CHANGED, (payload) => {
      console.log(
        '[NotificationEventHandlers] 通知权限变更:',
        payload.oldPermission,
        '->',
        payload.newPermission,
      );
    });

    // 监听配置更新事件
    eventBus.on(NOTIFICATION_EVENTS.CONFIG_UPDATED, (payload) => {
      console.log('[NotificationEventHandlers] 通知配置已更新:', payload.changedFields);
    });

    // 监听错误事件
    eventBus.on(NOTIFICATION_EVENTS.ERROR, (payload) => {
      console.error(
        '[NotificationEventHandlers] 通知错误:',
        payload.error.message,
        payload.context,
      );
    });
  }

  /**
   * 设置系统事件监听器
   */
  private setupSystemEventListeners(): void {
    console.log('[NotificationEventHandlers] 设置系统事件监听器');

    // 监听用户登出事件
    eventBus.on('auth:user-logged-out', () => {
      console.log('[NotificationEventHandlers] 用户登出，清理通知');
      this.notificationService.dismissAll();
    });

    // 监听应用失去焦点事件
    window.addEventListener('blur', () => {
      console.log('[NotificationEventHandlers] 应用失去焦点');
    });

    // 监听应用获得焦点事件
    window.addEventListener('focus', () => {
      console.log('[NotificationEventHandlers] 应用获得焦点');
    });

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('[NotificationEventHandlers] 页面隐藏');
      } else {
        console.log('[NotificationEventHandlers] 页面显示');
      }
    });
  }

  /**
   * 处理提醒触发事件
   */
  private async handleReminderTriggered(payload: ReminderTriggeredPayload): Promise<void> {
    try {
      console.log('[NotificationEventHandlers] 处理提醒触发:', {
        reminderId: payload.reminderId,
        sourceType: payload.sourceType,
        sourceId: payload.sourceId,
        title: payload.title,
      });

      // 创建通知配置
      const notificationConfig = this.createNotificationFromReminder(payload);

      // 显示通知
      await this.notificationService.show(notificationConfig);

      console.log('[NotificationEventHandlers] 提醒通知已显示:', notificationConfig.id);
    } catch (error) {
      console.error('[NotificationEventHandlers] 处理提醒触发失败:', error);
    }
  }

  /**
   * 根据来源类型增强提醒配置
   * 不同类型的提醒有不同的默认配置
   */
  private enhanceBySourceType(payload: ReminderTriggeredPayload): ReminderTriggeredPayload {
    switch (payload.sourceType) {
      case 'task':
        // 任务提醒：高优先级，桌面+声音
        return {
          ...payload,
          priority: payload.priority || NotificationPriority.HIGH,
          methods: payload.methods || [NotificationMethod.DESKTOP, NotificationMethod.SOUND],
        };

      case 'goal':
        // 目标提醒：普通优先级，桌面+声音
        return {
          ...payload,
          priority: payload.priority || NotificationPriority.NORMAL,
          methods: payload.methods || [NotificationMethod.DESKTOP, NotificationMethod.SOUND],
        };

      case 'reminder':
        // 普通提醒：根据配置决定
        return {
          ...payload,
          priority: payload.priority || NotificationPriority.NORMAL,
          methods: payload.methods || [NotificationMethod.DESKTOP],
        };

      case 'custom':
        // 自定义提醒：保持原有配置
        return payload;

      default:
        console.warn('[NotificationEventHandlers] 未知的提醒类型:', payload.sourceType);
        return payload;
    }
  }

  /**
   * 从提醒载荷创建通知配置
   */
  private createNotificationFromReminder(payload: ReminderTriggeredPayload): NotificationConfig {
    // 根据来源类型确定通知类型
    const notificationType = this.mapSourceTypeToNotificationType(payload.sourceType);

    // 根据来源类型确定音效
    const soundConfig = this.createSoundConfigForSource(payload.sourceType);

    // 创建通知ID
    const notificationId = `reminder-${payload.reminderId}-${Date.now()}`;

    const config: NotificationConfig = {
      id: notificationId,
      title: payload.title,
      message: payload.message,
      type: notificationType,
      priority: payload.priority || NotificationPriority.NORMAL,
      methods: payload.methods || [NotificationMethod.DESKTOP, NotificationMethod.SOUND],
      timestamp: payload.actualTime,
      sourceModule: 'schedule',
      sourceId: payload.sourceId,
      sound: soundConfig,
      data: {
        reminderId: payload.reminderId,
        sourceType: payload.sourceType,
        scheduledTime: payload.scheduledTime,
        actualTime: payload.actualTime,
        metadata: payload.metadata,
      },
      actions: this.createActionsForReminder(payload),
      desktop: {
        icon: this.getIconForSourceType(payload.sourceType),
        requireInteraction: payload.priority === NotificationPriority.URGENT,
        tag: `reminder-${payload.sourceType}-${payload.sourceId}`,
      },
    };

    return config;
  }

  /**
   * 将源类型映射到通知类型
   */
  private mapSourceTypeToNotificationType(sourceType: string): NotificationType {
    const typeMap: Record<string, NotificationType> = {
      task: NotificationType.TASK,
      goal: NotificationType.GOAL,
      reminder: NotificationType.REMINDER,
      custom: NotificationType.SYSTEM,
    };

    return typeMap[sourceType] || NotificationType.REMINDER;
  }

  /**
   * 为来源类型创建音效配置
   */
  private createSoundConfigForSource(sourceType: string): SoundConfig {
    const soundMap: Record<string, SoundType> = {
      task: SoundType.REMINDER,
      goal: SoundType.ALERT,
      reminder: SoundType.NOTIFICATION,
      custom: SoundType.DEFAULT,
    };

    return {
      enabled: true,
      type: soundMap[sourceType] || SoundType.DEFAULT,
      volume: 0.7,
    };
  }

  /**
   * 为提醒创建操作按钮
   */
  private createActionsForReminder(payload: ReminderTriggeredPayload) {
    const actions = [
      {
        id: 'mark-done',
        label: '标记完成',
        action: 'mark-done',
        icon: '/icons/check.png',
        primary: true,
        handler: async (config: NotificationConfig) => {
          console.log('[NotificationEventHandlers] 标记提醒完成:', config.data?.reminderId);

          // 发布完成事件
          eventBus.emit('reminder:marked-done', {
            reminderId: config.data?.reminderId,
            sourceType: config.data?.sourceType,
            sourceId: config.data?.sourceId,
            completedAt: new Date(),
          });
        },
      },
    ];

    // 根据源类型添加特定操作
    if (payload.sourceType === 'task') {
      actions.push({
        id: 'view-task',
        label: '查看任务',
        action: 'view-task',
        icon: '/icons/task.png',
        primary: false,
        handler: async (config: NotificationConfig) => {
          console.log('[NotificationEventHandlers] 查看任务:', config.data?.sourceId);
          // 导航到任务详情页
          // router.push(`/tasks/${config.data?.sourceId}`);
        },
      });
    } else if (payload.sourceType === 'goal') {
      actions.push({
        id: 'view-goal',
        label: '查看目标',
        action: 'view-goal',
        icon: '/icons/goal.png',
        primary: false,
        handler: async (config: NotificationConfig) => {
          console.log('[NotificationEventHandlers] 查看目标:', config.data?.sourceId);
          // 导航到目标详情页
          // router.push(`/goals/${config.data?.sourceId}`);
        },
      });
    }

    return actions;
  }

  /**
   * 获取源类型对应的图标
   */
  private getIconForSourceType(sourceType: string): string {
    const iconMap: Record<string, string> = {
      task: '/icons/task-notification.png',
      goal: '/icons/goal-notification.png',
      reminder: '/icons/reminder-notification.png',
      custom: '/icons/custom-notification.png',
    };

    return iconMap[sourceType] || '/icons/default-notification.png';
  }

  /**
   * 标准化提醒载荷
   * 兼容不同来源的数据格式
   */
  private normalizeReminderPayload(payload: any): ReminderTriggeredPayload {
    // 如果已经是标准格式
    if (payload.reminderId && payload.sourceType) {
      return payload as ReminderTriggeredPayload;
    }

    // 兼容旧格式：调度器载荷
    return this.convertSchedulerPayloadToStandard(payload);
  }

  /**
   * 转换调度器载荷为标准格式（向后兼容）
   */
  private convertSchedulerPayloadToStandard(payload: any): ReminderTriggeredPayload {
    console.log('[NotificationEventHandlers] 转换调度器载荷:', payload);

    // 调度器发送的载荷格式
    return {
      reminderId: payload.id || `scheduler-${Date.now()}`,
      sourceType: payload.type || 'schedule',
      sourceId: payload.id,
      title: payload.title || '计划提醒',
      message: payload.message || '您有一个计划提醒',
      priority: this.mapSchedulerPriorityToNotificationPriority(payload.priority),
      methods: this.mapSchedulerAlertMethodsToNotificationMethods(payload.alertMethods),
      scheduledTime: new Date(), // 调度器发送时就是计划时间
      actualTime: payload.timestamp ? new Date(payload.timestamp) : new Date(),
      metadata: {
        taskType: payload.type,
        soundVolume: payload.soundVolume,
        popupDuration: payload.popupDuration,
        allowSnooze: payload.allowSnooze,
        snoozeOptions: payload.snoozeOptions,
        customActions: payload.customActions,
        originalPayload: payload,
      },
    };
  }

  /**
   * 转换调度器优先级到通知优先级
   */
  private mapSchedulerPriorityToNotificationPriority(
    schedulerPriority: string,
  ): NotificationPriority {
    const priorityMap: Record<string, NotificationPriority> = {
      LOW: NotificationPriority.LOW,
      NORMAL: NotificationPriority.NORMAL,
      HIGH: NotificationPriority.HIGH,
      URGENT: NotificationPriority.URGENT,
    };

    return priorityMap[schedulerPriority?.toUpperCase()] || NotificationPriority.NORMAL;
  }

  /**
   * 转换调度器提醒方式到通知方式
   */
  private mapSchedulerAlertMethodsToNotificationMethods(
    alertMethods: string[],
  ): NotificationMethod[] {
    if (!Array.isArray(alertMethods)) {
      return [NotificationMethod.DESKTOP, NotificationMethod.SOUND];
    }

    const methods: NotificationMethod[] = [];

    if (alertMethods.includes('POPUP')) {
      methods.push(NotificationMethod.DESKTOP);
    }
    if (alertMethods.includes('SOUND') || alertMethods.includes('AUDIO')) {
      methods.push(NotificationMethod.SOUND);
    }
    if (alertMethods.includes('VIBRATE')) {
      methods.push(NotificationMethod.VIBRATION);
    }

    // 如果没有匹配的方法，默认使用桌面通知
    return methods.length > 0 ? methods : [NotificationMethod.DESKTOP];
  }

  /**
   * 销毁事件监听器
   */
  destroy(): void {
    if (!this.isInitialized) return;

    console.log('[NotificationEventHandlers] 销毁事件监听器');

    // 移除统一提醒事件监听
    eventBus.off('reminder-triggered');

    // 移除Notification内部事件监听
    Object.values(NOTIFICATION_EVENTS).forEach((event) => {
      eventBus.off(event);
    });

    // 移除系统事件监听
    eventBus.off('auth:user-logged-out');

    this.isInitialized = false;
    console.log('[NotificationEventHandlers] 事件监听器已销毁');
  }
}
