/**
 * Alert Handler System
 * @description 提醒处理系统 - 统一处理各种提醒方式
 * @author DailyUse Team
 * @date 2025-01-09
 */

import { CrossPlatformEventBus } from '../domain/CrossPlatformEventBus';
import { AlertMethod, SchedulePriority } from '@dailyuse/contracts';

/**
 * 弹窗提醒数据
 */
export interface PopupAlertData {
  uuid: string;
  title: string;
  message: string;
  priority: SchedulePriority;
  duration?: number; // 持续时间(秒)
  actions?: Array<{
    label: string;
    action: string;
    style?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  }>;
}

/**
 * 声音提醒数据
 */
export interface SoundAlertData {
  uuid: string;
  priority: SchedulePriority;
  soundFile?: string;
  volume?: number; // 0-100
  repeat?: number; // 重复次数
}

/**
 * 系统通知数据
 */
export interface SystemNotificationData {
  uuid: string;
  title: string;
  message: string;
  icon?: string;
  urgent?: boolean;
}

/**
 * 桌面闪烁数据
 */
export interface DesktopFlashData {
  uuid: string;
  priority: SchedulePriority;
  flashCount?: number;
  flashInterval?: number; // 毫秒
}

/**
 * 提醒处理器接口
 */
export interface IAlertHandler {
  /**
   * 处理提醒
   */
  handle(data: any): Promise<{ success: boolean; error?: string }>;

  /**
   * 是否支持该优先级
   */
  supportsPriority(priority: SchedulePriority): boolean;
}

/**
 * 弹窗提醒处理器
 */
export class PopupAlertHandler implements IAlertHandler {
  constructor(private eventEmitter: CrossPlatformEventBus) {}

  async handle(data: PopupAlertData): Promise<{ success: boolean; error?: string }> {
    try {
      // 发送弹窗显示事件
      this.eventEmitter.send('show-popup-notification', {
        uuid: data.uuid,
        title: data.title,
        message: data.message,
        importance: this.priorityToImportance(data.priority),
        duration: data.duration || this.getDefaultDuration(data.priority),
        actions: data.actions || this.getDefaultActions(data.priority),
      });

      console.log(`弹窗提醒已触发: ${data.title}`);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '弹窗提醒失败';
      console.error('弹窗提醒处理失败:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  supportsPriority(priority: SchedulePriority): boolean {
    return true; // 弹窗支持所有优先级
  }

  private priorityToImportance(priority: SchedulePriority): string {
    switch (priority) {
      case SchedulePriority.URGENT:
        return 'Vital';
      case SchedulePriority.HIGH:
        return 'Important';
      case SchedulePriority.NORMAL:
        return 'Moderate';
      case SchedulePriority.LOW:
        return 'Low';
      default:
        return 'Moderate';
    }
  }

  private getDefaultDuration(priority: SchedulePriority): number {
    switch (priority) {
      case SchedulePriority.URGENT:
        return 0; // 不自动关闭
      case SchedulePriority.HIGH:
        return 30;
      case SchedulePriority.NORMAL:
        return 15;
      case SchedulePriority.LOW:
        return 10;
      default:
        return 15;
    }
  }

  private getDefaultActions(priority: SchedulePriority): Array<{
    label: string;
    action: string;
    style?: string;
  }> {
    const baseActions = [
      { label: '确定', action: 'confirm', style: 'primary' },
      { label: '关闭', action: 'dismiss', style: 'secondary' },
    ];

    if (priority === SchedulePriority.URGENT || priority === SchedulePriority.HIGH) {
      baseActions.splice(1, 0, { label: '稍后提醒', action: 'snooze', style: 'warning' });
    }

    return baseActions;
  }
}

/**
 * 声音提醒处理器
 */
export class SoundAlertHandler implements IAlertHandler {
  constructor(private eventEmitter: CrossPlatformEventBus) {}

  async handle(data: SoundAlertData): Promise<{ success: boolean; error?: string }> {
    try {
      const soundConfig = {
        uuid: data.uuid,
        soundFile: data.soundFile || this.getDefaultSoundFile(data.priority),
        volume: data.volume || this.getDefaultVolume(data.priority),
        repeat: data.repeat || this.getDefaultRepeat(data.priority),
      };

      // 发送声音播放事件
      this.eventEmitter.send('play-alert-sound', soundConfig);

      console.log(`声音提醒已触发: ${soundConfig.soundFile}`);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '声音提醒失败';
      console.error('声音提醒处理失败:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  supportsPriority(priority: SchedulePriority): boolean {
    return true; // 声音支持所有优先级
  }

  private getDefaultSoundFile(priority: SchedulePriority): string {
    switch (priority) {
      case SchedulePriority.URGENT:
        return 'sounds/urgent.wav';
      case SchedulePriority.HIGH:
        return 'sounds/important.wav';
      case SchedulePriority.NORMAL:
        return 'sounds/notification.wav';
      case SchedulePriority.LOW:
        return 'sounds/gentle.wav';
      default:
        return 'sounds/notification.wav';
    }
  }

  private getDefaultVolume(priority: SchedulePriority): number {
    switch (priority) {
      case SchedulePriority.URGENT:
        return 90;
      case SchedulePriority.HIGH:
        return 80;
      case SchedulePriority.NORMAL:
        return 70;
      case SchedulePriority.LOW:
        return 60;
      default:
        return 70;
    }
  }

  private getDefaultRepeat(priority: SchedulePriority): number {
    switch (priority) {
      case SchedulePriority.URGENT:
        return 3; // 重复3次
      case SchedulePriority.HIGH:
        return 2; // 重复2次
      case SchedulePriority.NORMAL:
        return 1; // 播放1次
      case SchedulePriority.LOW:
        return 1; // 播放1次
      default:
        return 1;
    }
  }
}

/**
 * 系统通知处理器
 */
export class SystemNotificationHandler implements IAlertHandler {
  constructor(private eventEmitter: CrossPlatformEventBus) {}

  async handle(data: SystemNotificationData): Promise<{ success: boolean; error?: string }> {
    try {
      // 发送系统通知事件
      this.eventEmitter.send('show-system-notification', {
        uuid: data.uuid,
        title: data.title,
        body: data.message,
        icon: data.icon || this.getDefaultIcon(),
        urgent: data.urgent || false,
        silent: false,
      });

      console.log(`系统通知已触发: ${data.title}`);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '系统通知失败';
      console.error('系统通知处理失败:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  supportsPriority(priority: SchedulePriority): boolean {
    // 系统通知支持中等以上优先级
    return priority !== SchedulePriority.LOW;
  }

  private getDefaultIcon(): string {
    return 'DailyUse-256.png';
  }
}

/**
 * 桌面闪烁处理器
 */
export class DesktopFlashHandler implements IAlertHandler {
  constructor(private eventEmitter: CrossPlatformEventBus) {}

  async handle(data: DesktopFlashData): Promise<{ success: boolean; error?: string }> {
    try {
      const flashConfig = {
        uuid: data.uuid,
        flashCount: data.flashCount || this.getDefaultFlashCount(data.priority),
        flashInterval: data.flashInterval || this.getDefaultFlashInterval(data.priority),
      };

      // 发送桌面闪烁事件
      this.eventEmitter.send('flash-window', flashConfig);

      console.log(`桌面闪烁已触发: ${flashConfig.flashCount}次`);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '桌面闪烁失败';
      console.error('桌面闪烁处理失败:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  supportsPriority(priority: SchedulePriority): boolean {
    // 桌面闪烁仅支持高优先级
    return priority === SchedulePriority.URGENT || priority === SchedulePriority.HIGH;
  }

  private getDefaultFlashCount(priority: SchedulePriority): number {
    switch (priority) {
      case SchedulePriority.URGENT:
        return 5;
      case SchedulePriority.HIGH:
        return 3;
      default:
        return 1;
    }
  }

  private getDefaultFlashInterval(priority: SchedulePriority): number {
    switch (priority) {
      case SchedulePriority.URGENT:
        return 300; // 300ms
      case SchedulePriority.HIGH:
        return 500; // 500ms
      default:
        return 1000; // 1s
    }
  }
}

/**
 * 提醒处理系统
 */
export class AlertHandlerSystem {
  private static instance: AlertHandlerSystem;
  private eventBus = new CrossPlatformEventBus();
  private alertHandlers = new Map<AlertMethod, IAlertHandler>();
  private globalConfig = {
    enabled: true,
    muteUntil: null as Date | null,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
    },
  };

  private constructor() {
    this.initializeDefaultHandlers();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): AlertHandlerSystem {
    if (!this.instance) {
      this.instance = new AlertHandlerSystem();
    }
    return this.instance;
  }

  /**
   * 初始化默认处理器
   */
  private initializeDefaultHandlers(): void {
    this.alertHandlers.set(AlertMethod.POPUP, new PopupAlertHandler(this.eventBus));
    this.alertHandlers.set(AlertMethod.SOUND, new SoundAlertHandler(this.eventBus));
    this.alertHandlers.set(
      AlertMethod.SYSTEM_NOTIFICATION,
      new SystemNotificationHandler(this.eventBus),
    );
    this.alertHandlers.set(AlertMethod.DESKTOP_FLASH, new DesktopFlashHandler(this.eventBus));
  }

  /**
   * 处理提醒
   */
  public async handleAlert(
    method: AlertMethod,
    data: any,
    priority: SchedulePriority,
  ): Promise<{ success: boolean; error?: string }> {
    // 检查全局设置
    if (!this.globalConfig.enabled) {
      return { success: false, error: '提醒已全局禁用' };
    }

    if (this.globalConfig.muteUntil && new Date() < this.globalConfig.muteUntil) {
      return { success: false, error: '当前处于静音状态' };
    }

    if (this.isInQuietHours()) {
      return { success: false, error: '当前处于静音时段' };
    }

    // 获取处理器
    const handler = this.alertHandlers.get(method);
    if (!handler) {
      return { success: false, error: `未找到 ${method} 的处理器` };
    }

    // 检查优先级支持
    if (!handler.supportsPriority(priority)) {
      return { success: false, error: `${method} 不支持优先级 ${priority}` };
    }

    // 执行处理
    return await handler.handle(data);
  }

  /**
   * 批量处理提醒
   */
  public async handleMultipleAlerts(
    methods: AlertMethod[],
    data: any,
    priority: SchedulePriority,
  ): Promise<Array<{ method: AlertMethod; success: boolean; error?: string }>> {
    const results = await Promise.allSettled(
      methods.map((method) => this.handleAlert(method, data, priority)),
    );

    return methods.map((method, index) => {
      const result = results[index];
      if (result.status === 'fulfilled') {
        return { method, ...result.value };
      } else {
        return {
          method,
          success: false,
          error: result.reason instanceof Error ? result.reason.message : '处理失败',
        };
      }
    });
  }

  /**
   * 注册自定义处理器
   */
  public registerHandler(method: AlertMethod, handler: IAlertHandler): void {
    this.alertHandlers.set(method, handler);
    console.log(`已注册 ${method} 处理器`);
  }

  /**
   * 移除处理器
   */
  public removeHandler(method: AlertMethod): boolean {
    const removed = this.alertHandlers.delete(method);
    if (removed) {
      console.log(`已移除 ${method} 处理器`);
    }
    return removed;
  }

  /**
   * 启用/禁用提醒
   */
  public setEnabled(enabled: boolean): void {
    this.globalConfig.enabled = enabled;
    console.log(`提醒系统${enabled ? '已启用' : '已禁用'}`);
  }

  /**
   * 设置静音到指定时间
   */
  public muteUntil(until: Date): void {
    this.globalConfig.muteUntil = until;
    console.log(`提醒已静音到: ${until.toISOString()}`);
  }

  /**
   * 取消静音
   */
  public unmute(): void {
    this.globalConfig.muteUntil = null;
    console.log('提醒静音已取消');
  }

  /**
   * 设置静音时段
   */
  public setQuietHours(enabled: boolean, start?: string, end?: string): void {
    this.globalConfig.quietHours.enabled = enabled;
    if (start) this.globalConfig.quietHours.start = start;
    if (end) this.globalConfig.quietHours.end = end;

    console.log(
      `静音时段${enabled ? '已启用' : '已禁用'}: ${this.globalConfig.quietHours.start} - ${this.globalConfig.quietHours.end}`,
    );
  }

  /**
   * 检查是否处于静音时段
   */
  private isInQuietHours(): boolean {
    if (!this.globalConfig.quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = this.globalConfig.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = this.globalConfig.quietHours.end.split(':').map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    // 处理跨日情况
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      return currentTime >= startTime && currentTime <= endTime;
    }
  }

  /**
   * 获取当前配置
   */
  public getConfig(): typeof this.globalConfig {
    return { ...this.globalConfig };
  }

  /**
   * 获取支持的提醒方式
   */
  public getSupportedMethods(): AlertMethod[] {
    return Array.from(this.alertHandlers.keys());
  }

  /**
   * 测试提醒方式
   */
  public async testAlert(
    method: AlertMethod,
    priority: SchedulePriority = SchedulePriority.NORMAL,
  ): Promise<boolean> {
    const testData = {
      uuid: 'test-' + Date.now(),
      title: '测试提醒',
      message: '这是一个测试提醒',
      priority,
    };

    const result = await this.handleAlert(method, testData, priority);
    return result.success;
  }

  /**
   * 获取事件总线实例（用于外部事件监听）
   */
  public getEventBus(): CrossPlatformEventBus {
    return this.eventBus;
  }

  /**
   * 注册事件监听器
   */
  public on(eventType: string, listener: (payload?: any) => void): void {
    this.eventBus.on(eventType, listener);
  }

  /**
   * 移除事件监听器
   */
  public off(eventType: string, listener?: (payload?: any) => void): void {
    this.eventBus.off(eventType, listener);
  }

  /**
   * 发送事件
   */
  public send(eventType: string, payload?: any): void {
    this.eventBus.send(eventType, payload);
  }
}

// 导出单例实例
export const alertHandlerSystem = AlertHandlerSystem.getInstance();
