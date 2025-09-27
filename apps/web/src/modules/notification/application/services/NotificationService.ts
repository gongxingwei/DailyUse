/**
 * 通知服务主类
 * @description 统一管理所有类型的通知
 */

import {
  NotificationType,
  NotificationPriority,
  NotificationMethod,
  NotificationPermission,
  SoundType,
} from '../../domain/types';

import type {
  NotificationConfig,
  NotificationServiceConfig,
  NotificationStats,
  NotificationHistory,
  NotificationFilter,
  NotificationSearchResult,
  INotificationService,
  SoundConfig,
} from '../../domain/types';

import { DesktopNotificationService } from '../../infrastructure/services/DesktopNotificationService';
import { AudioNotificationService } from '../../infrastructure/services/AudioNotificationService';

import {
  publishNotificationCreated,
  publishNotificationShown,
  publishNotificationFailed,
  publishConfigUpdated,
  publishServiceInitialized,
  NOTIFICATION_EVENTS,
} from '../../application/events/notificationEvents';

import { eventBus } from '@dailyuse/utils';

/**
 * 通知队列项
 */
interface NotificationQueueItem {
  config: NotificationConfig;
  timestamp: Date;
  retryCount: number;
}

/**
 * 主通知服务
 */
export class NotificationService implements INotificationService {
  private static instance: NotificationService;

  private desktopService: DesktopNotificationService;
  private audioService: AudioNotificationService;

  private config: NotificationServiceConfig;
  private notificationQueue: NotificationQueueItem[] = [];
  private notificationHistory: NotificationHistory[] = [];
  private activeNotifications = new Map<string, NotificationConfig>();

  private isProcessingQueue = false;
  private doNotDisturbMode = false;

  constructor() {
    this.desktopService = new DesktopNotificationService();
    this.audioService = new AudioNotificationService();

    this.config = this.getDefaultConfig();
    this.initialize();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): NotificationServiceConfig {
    return {
      maxConcurrentNotifications: 3,
      defaultAutoClose: 5000,
      enablePersistence: true,
      soundEnabled: true,
      vibrationEnabled: false,
      desktopEnabled: true,
      globalVolume: 0.7,
      doNotDisturbEnabled: false,
    };
  }

  /**
   * 初始化服务
   */
  private initialize(): void {
    console.log('[NotificationService] 初始化通知服务...');

    // 设置音频音量
    this.audioService.setGlobalVolume(this.config.globalVolume);

    // 启动队列处理
    this.startQueueProcessor();

    // 发布初始化完成事件
    publishServiceInitialized();

    console.log('[NotificationService] 通知服务初始化完成');
  }

  /**
   * 显示通知
   */
  async show(config: NotificationConfig): Promise<string> {
    console.log('[NotificationService] 创建通知:', config.id, config.title);

    // 验证配置
    this.validateNotificationConfig(config);

    // 检查勿扰模式
    if (this.isInDoNotDisturbMode()) {
      console.log('[NotificationService] 勿扰模式已开启，跳过通知');
      return config.id;
    }

    // 添加到队列
    this.enqueueNotification(config);

    // 添加到历史记录
    this.addToHistory(config, 'pending');

    // 发布创建事件
    publishNotificationCreated(config, this.notificationQueue.length);

    return config.id;
  }

  /**
   * 验证通知配置
   */
  private validateNotificationConfig(config: NotificationConfig): void {
    if (!config.id) {
      throw new Error('通知ID不能为空');
    }
    if (!config.title) {
      throw new Error('通知标题不能为空');
    }
    if (!config.message) {
      throw new Error('通知消息不能为空');
    }
    if (!config.methods || config.methods.length === 0) {
      throw new Error('至少需要指定一种通知方式');
    }
  }

  /**
   * 将通知加入队列
   */
  private enqueueNotification(config: NotificationConfig): void {
    const queueItem: NotificationQueueItem = {
      config,
      timestamp: new Date(),
      retryCount: 0,
    };

    // 根据优先级插入到合适位置
    const insertIndex = this.findInsertPosition(config.priority);
    this.notificationQueue.splice(insertIndex, 0, queueItem);

    // 检查队列长度
    if (this.notificationQueue.length > this.config.maxConcurrentNotifications * 2) {
      console.warn('[NotificationService] 通知队列过长，移除最旧的通知');
      this.notificationQueue.shift();
    }
  }

  /**
   * 根据优先级查找插入位置
   */
  private findInsertPosition(priority: NotificationPriority): number {
    const priorityOrder = {
      [NotificationPriority.URGENT]: 0,
      [NotificationPriority.HIGH]: 1,
      [NotificationPriority.NORMAL]: 2,
      [NotificationPriority.LOW]: 3,
    };

    const targetPriority = priorityOrder[priority];

    for (let i = 0; i < this.notificationQueue.length; i++) {
      const itemPriority = priorityOrder[this.notificationQueue[i].config.priority];
      if (itemPriority > targetPriority) {
        return i;
      }
    }

    return this.notificationQueue.length;
  }

  /**
   * 启动队列处理器
   */
  private startQueueProcessor(): void {
    if (this.isProcessingQueue) return;

    this.isProcessingQueue = true;
    this.processQueue();
  }

  /**
   * 处理通知队列
   */
  private async processQueue(): Promise<void> {
    while (this.notificationQueue.length > 0 && this.isProcessingQueue) {
      // 检查并发限制
      if (this.activeNotifications.size >= this.config.maxConcurrentNotifications) {
        await this.wait(500); // 等待500ms再检查
        continue;
      }

      const item = this.notificationQueue.shift();
      if (!item) continue;

      try {
        await this.processNotification(item);
      } catch (error) {
        console.error('[NotificationService] 处理通知失败:', error);

        // 重试逻辑
        if (item.retryCount < 3) {
          item.retryCount++;
          this.notificationQueue.unshift(item);
          await this.wait(1000 * item.retryCount); // 递增等待时间
        } else {
          publishNotificationFailed(item.config, error as Error);
          this.updateHistoryStatus(item.config.id, 'dismissed');
        }
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * 处理单个通知
   */
  private async processNotification(item: NotificationQueueItem): Promise<void> {
    const { config } = item;

    console.log('[NotificationService] 处理通知:', config.id);

    // 添加到活跃通知
    this.activeNotifications.set(config.id, config);

    // 更新历史状态
    this.updateHistoryStatus(config.id, 'shown');

    try {
      // 并行处理不同的通知方式
      const tasks: Promise<void>[] = [];

      // 桌面通知
      if (config.methods.includes(NotificationMethod.DESKTOP) && this.config.desktopEnabled) {
        tasks.push(this.showDesktopNotification(config));
      }

      // 音效播放
      if (
        config.methods.includes(NotificationMethod.SOUND) &&
        this.config.soundEnabled &&
        config.sound
      ) {
        tasks.push(this.playNotificationSound(config));
      }

      // 等待所有通知方式完成
      await Promise.allSettled(tasks);

      // 设置自动关闭
      this.scheduleAutoClose(config);
    } catch (error) {
      this.activeNotifications.delete(config.id);
      throw error;
    }
  }

  /**
   * 显示桌面通知
   */
  private async showDesktopNotification(config: NotificationConfig): Promise<void> {
    try {
      await this.desktopService.show(config);
      publishNotificationShown(config, 'desktop', config.autoClose);
    } catch (error) {
      console.error('[NotificationService] 桌面通知失败:', error);
      // 不抛出错误，允许其他通知方式继续
    }
  }

  /**
   * 播放通知音效
   */
  private async playNotificationSound(config: NotificationConfig): Promise<void> {
    if (!config.sound) return;

    try {
      await this.audioService.play(config.sound, config.id);
    } catch (error) {
      console.error('[NotificationService] 音效播放失败:', error);
      // 不抛出错误，允许其他通知方式继续
    }
  }

  /**
   * 安排自动关闭
   */
  private scheduleAutoClose(config: NotificationConfig): void {
    const closeTime = config.autoClose ?? this.config.defaultAutoClose;

    if (closeTime > 0) {
      setTimeout(() => {
        this.dismiss(config.id);
      }, closeTime);
    }
  }

  /**
   * 关闭指定通知
   */
  async dismiss(id: string): Promise<void> {
    console.log('[NotificationService] 关闭通知:', id);

    // 从活跃通知中移除
    const config = this.activeNotifications.get(id);
    if (config) {
      this.activeNotifications.delete(id);

      // 关闭桌面通知
      this.desktopService.close(id);

      // 停止音效
      this.audioService.stop(id);

      // 更新历史状态
      this.updateHistoryStatus(id, 'closed');
    }
  }

  /**
   * 关闭所有通知
   */
  async dismissAll(): Promise<void> {
    console.log('[NotificationService] 关闭所有通知');

    // 清空队列
    this.notificationQueue.length = 0;

    // 关闭所有活跃通知
    const activeIds = Array.from(this.activeNotifications.keys());
    for (const id of activeIds) {
      await this.dismiss(id);
    }

    // 关闭所有服务的通知
    this.desktopService.closeAll();
    this.audioService.stopAll();
  }

  // =============== 快捷方法 ===============

  async showInfo(message: string, options?: Partial<NotificationConfig>): Promise<string> {
    return this.show(this.createQuickNotification(message, NotificationType.INFO, options));
  }

  async showSuccess(message: string, options?: Partial<NotificationConfig>): Promise<string> {
    return this.show(this.createQuickNotification(message, NotificationType.SUCCESS, options));
  }

  async showWarning(message: string, options?: Partial<NotificationConfig>): Promise<string> {
    return this.show(this.createQuickNotification(message, NotificationType.WARNING, options));
  }

  async showError(message: string, options?: Partial<NotificationConfig>): Promise<string> {
    return this.show(this.createQuickNotification(message, NotificationType.ERROR, options));
  }

  /**
   * 创建快捷通知配置
   */
  private createQuickNotification(
    message: string,
    type: NotificationType,
    options?: Partial<NotificationConfig>,
  ): NotificationConfig {
    const id = options?.id || `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      id,
      title: options?.title || this.getDefaultTitle(type),
      message,
      type,
      priority: options?.priority || NotificationPriority.NORMAL,
      methods: options?.methods || [NotificationMethod.DESKTOP, NotificationMethod.SOUND],
      autoClose: options?.autoClose ?? this.config.defaultAutoClose,
      timestamp: new Date(),
      sound: options?.sound || this.getDefaultSound(type),
      ...options,
    };
  }

  /**
   * 获取默认标题
   */
  private getDefaultTitle(type: NotificationType): string {
    const titleMap = {
      [NotificationType.INFO]: '信息',
      [NotificationType.SUCCESS]: '成功',
      [NotificationType.WARNING]: '警告',
      [NotificationType.ERROR]: '错误',
      [NotificationType.REMINDER]: '提醒',
      [NotificationType.TASK]: '任务',
      [NotificationType.GOAL]: '目标',
      [NotificationType.SYSTEM]: '系统',
    };

    return titleMap[type] || '通知';
  }

  /**
   * 获取默认音效配置
   */
  private getDefaultSound(type: NotificationType): SoundConfig {
    const soundMap = {
      [NotificationType.INFO]: SoundType.NOTIFICATION,
      [NotificationType.SUCCESS]: SoundType.SUCCESS,
      [NotificationType.WARNING]: SoundType.ALERT,
      [NotificationType.ERROR]: SoundType.ERROR,
      [NotificationType.REMINDER]: SoundType.REMINDER,
      [NotificationType.TASK]: SoundType.DEFAULT,
      [NotificationType.GOAL]: SoundType.DEFAULT,
      [NotificationType.SYSTEM]: SoundType.DEFAULT,
    };

    return {
      enabled: this.config.soundEnabled,
      type: soundMap[type] || SoundType.DEFAULT,
      volume: this.config.globalVolume,
    };
  }

  // =============== 权限管理 ===============

  async requestPermission(): Promise<NotificationPermission> {
    return this.desktopService.requestPermission();
  }

  getPermission(): NotificationPermission {
    return this.desktopService.getPermission();
  }

  // =============== 配置管理 ===============

  updateConfig(newConfig: Partial<NotificationServiceConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };

    // 应用配置变更
    if (newConfig.globalVolume !== undefined) {
      this.audioService.setGlobalVolume(newConfig.globalVolume);
    }

    if (newConfig.soundEnabled !== undefined) {
      if (newConfig.soundEnabled) {
        this.audioService.enable();
      } else {
        this.audioService.disable();
      }
    }

    // 发布配置更新事件
    const changedFields = Object.keys(newConfig);
    publishConfigUpdated(oldConfig, this.config, changedFields);
  }

  getConfig(): NotificationServiceConfig {
    return { ...this.config };
  }

  // =============== 统计和历史 ===============

  getStats(): NotificationStats {
    const byType = {} as Record<NotificationType, number>;
    const byPriority = {} as Record<NotificationPriority, number>;

    // 初始化统计
    Object.values(NotificationType).forEach((type) => {
      byType[type] = 0;
    });
    Object.values(NotificationPriority).forEach((priority) => {
      byPriority[priority] = 0;
    });

    // 统计历史记录
    let unread = 0;
    let todayCount = 0;
    const today = new Date().toDateString();

    this.notificationHistory.forEach((item) => {
      byType[item.notification.type]++;
      byPriority[item.notification.priority]++;

      if (item.status === 'shown') {
        unread++;
      }

      if (item.createdAt.toDateString() === today) {
        todayCount++;
      }
    });

    return {
      total: this.notificationHistory.length,
      unread,
      byType,
      byPriority,
      todayCount,
    };
  }

  async getHistory(filter?: NotificationFilter): Promise<NotificationSearchResult> {
    let items = [...this.notificationHistory];

    // 应用过滤器
    if (filter) {
      if (filter.types) {
        items = items.filter((item) => filter.types!.includes(item.notification.type));
      }
      if (filter.priorities) {
        items = items.filter((item) => filter.priorities!.includes(item.notification.priority));
      }
      if (filter.dateFrom) {
        items = items.filter((item) => item.createdAt >= filter.dateFrom!);
      }
      if (filter.dateTo) {
        items = items.filter((item) => item.createdAt <= filter.dateTo!);
      }
      if (filter.sourceModule) {
        items = items.filter((item) => item.notification.sourceModule === filter.sourceModule);
      }
      if (filter.status) {
        items = items.filter((item) => filter.status!.includes(item.status));
      }
    }

    // 排序（最新的在前）
    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // 分页
    const offset = filter?.offset || 0;
    const limit = filter?.limit || 50;
    const paginatedItems = items.slice(offset, offset + limit);

    return {
      items: paginatedItems,
      total: items.length,
      hasMore: offset + limit < items.length,
    };
  }

  async clearHistory(): Promise<void> {
    this.notificationHistory.length = 0;
    console.log('[NotificationService] 通知历史已清空');
  }

  // =============== 私有辅助方法 ===============

  /**
   * 添加到历史记录
   */
  private addToHistory(config: NotificationConfig, status: NotificationHistory['status']): void {
    const historyItem: NotificationHistory = {
      id: `history-${config.id}`,
      notification: config,
      createdAt: new Date(),
      status,
      userAgent: navigator.userAgent,
    };

    this.notificationHistory.push(historyItem);

    // 限制历史记录数量
    if (this.notificationHistory.length > 1000) {
      this.notificationHistory.shift();
    }
  }

  /**
   * 更新历史记录状态
   */
  private updateHistoryStatus(notificationId: string, status: NotificationHistory['status']): void {
    const item = this.notificationHistory.find((h) => h.notification.id === notificationId);
    if (item) {
      item.status = status;

      switch (status) {
        case 'shown':
          item.shownAt = new Date();
          break;
        case 'clicked':
          item.clickedAt = new Date();
          break;
        case 'closed':
        case 'dismissed':
          item.closedAt = new Date();
          break;
      }
    }
  }

  /**
   * 检查是否在勿扰模式
   */
  private isInDoNotDisturbMode(): boolean {
    if (!this.config.doNotDisturbEnabled) {
      return false;
    }

    // 检查勿扰时间段
    if (this.config.doNotDisturbSchedule) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();

      const [startHour, startMinute] = this.config.doNotDisturbSchedule.start
        .split(':')
        .map(Number);
      const [endHour, endMinute] = this.config.doNotDisturbSchedule.end.split(':').map(Number);

      const startTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;

      // 处理跨天的情况
      if (startTime > endTime) {
        return currentTime >= startTime || currentTime <= endTime;
      } else {
        return currentTime >= startTime && currentTime <= endTime;
      }
    }

    return this.doNotDisturbMode;
  }

  /**
   * 等待指定毫秒数
   */
  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 清理资源
   */
  destroy(): void {
    console.log('[NotificationService] 销毁通知服务');

    this.isProcessingQueue = false;
    this.dismissAll();

    this.desktopService.destroy();
    this.audioService.destroy();

    this.notificationQueue.length = 0;
    this.notificationHistory.length = 0;
    this.activeNotifications.clear();
  }
}
