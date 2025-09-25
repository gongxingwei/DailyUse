/**
 * 提醒触发处理器
 * @description 处理不同类型的提醒触发，包括弹窗、声音等
 * @author DailyUse Team
 * @date 2025-01-09
 */

import { eventBus } from '@dailyuse/utils';
import { AlertMethod, SchedulePriority } from '@dailyuse/contracts';

/**
 * 弹窗提醒配置接口
 */
export interface PopupReminderConfig {
  taskId: string;
  title: string;
  message: string;
  priority: SchedulePriority;
  alertConfig?: {
    popupDuration?: number;
    allowSnooze?: boolean;
    snoozeOptions?: number[];
    customActions?: Array<{
      label: string;
      action: string;
      style?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
    }>;
  };
}

/**
 * 声音提醒配置接口
 */
export interface SoundReminderConfig {
  taskId: string;
  priority: SchedulePriority;
  soundFile?: string;
  volume?: number;
  repeat?: number;
}

/**
 * 提醒触发处理器
 * 负责处理各种类型的提醒触发机制
 */
export class ReminderTriggerHandler {
  private static instance: ReminderTriggerHandler;
  private activePopups = new Map<string, any>(); // 存储活跃的弹窗
  private audioContext: AudioContext | null = null;
  private soundBuffers = new Map<string, AudioBuffer>(); // 缓存音频文件

  private constructor() {
    this.initializeAudioContext();
    this.registerEventHandlers();
  }

  static getInstance(): ReminderTriggerHandler {
    if (!this.instance) {
      this.instance = new ReminderTriggerHandler();
    }
    return this.instance;
  }

  // ========== 弹窗提醒处理 ==========

  /**
   * 显示弹窗提醒
   */
  async showPopupReminder(config: PopupReminderConfig): Promise<void> {
    try {
      console.log(`[ReminderTrigger] 显示弹窗提醒: ${config.title}`);

      // 检查是否已有相同任务的弹窗
      if (this.activePopups.has(config.taskId)) {
        console.log(`任务 ${config.taskId} 已有活跃弹窗，跳过`);
        return;
      }

      // 根据平台显示弹窗
      if (this.isElectronEnvironment()) {
        await this.showElectronPopup(config);
      } else {
        await this.showWebPopup(config);
      }

      // 记录活跃弹窗
      this.activePopups.set(config.taskId, {
        config,
        createdAt: new Date(),
      });

      // 设置自动关闭
      if (config.alertConfig?.popupDuration) {
        setTimeout(() => {
          this.closePopupReminder(config.taskId);
        }, config.alertConfig.popupDuration * 1000);
      }
    } catch (error) {
      console.error('[ReminderTrigger] 显示弹窗失败:', error);
    }
  }

  /**
   * 在Electron环境中显示弹窗
   */
  private async showElectronPopup(config: PopupReminderConfig): Promise<void> {
    // 通过IPC发送给主进程
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      (window as any).electronAPI.showReminderPopup({
        taskId: config.taskId,
        title: config.title,
        message: config.message,
        priority: config.priority,
        actions: this.generatePopupActions(config),
      });
    } else {
      console.warn('Electron API not available, falling back to web popup');
      await this.showWebPopup(config);
    }
  }

  /**
   * 在Web环境中显示弹窗
   */
  private async showWebPopup(config: PopupReminderConfig): Promise<void> {
    // 发送事件给UI层处理
    eventBus.emit('ui:show-reminder-dialog', {
      taskId: config.taskId,
      title: config.title,
      message: config.message,
      priority: config.priority,
      actions: this.generatePopupActions(config),
      autoClose: config.alertConfig?.popupDuration,
    });
  }

  /**
   * 生成弹窗操作按钮
   */
  private generatePopupActions(config: PopupReminderConfig): Array<{
    label: string;
    action: string;
    style: string;
  }> {
    const actions: Array<{ label: string; action: string; style: string }> = [];

    // 默认操作
    actions.push(
      { label: '确认', action: 'acknowledge', style: 'primary' },
      { label: '忽略', action: 'dismiss', style: 'secondary' },
    );

    // 延后选项
    if (config.alertConfig?.allowSnooze && config.alertConfig.snoozeOptions) {
      for (const minutes of config.alertConfig.snoozeOptions) {
        actions.push({
          label: `延后${minutes}分钟`,
          action: `snooze-${minutes}`,
          style: 'warning',
        });
      }
    }

    // 自定义操作
    if (config.alertConfig?.customActions) {
      actions.push(
        ...config.alertConfig.customActions.map((action) => ({
          label: action.label,
          action: action.action,
          style: action.style || 'secondary',
        })),
      );
    }

    return actions;
  }

  /**
   * 关闭弹窗提醒
   */
  closePopupReminder(taskId: string): void {
    if (this.activePopups.has(taskId)) {
      console.log(`[ReminderTrigger] 关闭弹窗: ${taskId}`);

      // 通知UI关闭弹窗
      eventBus.emit('ui:close-reminder-dialog', { taskId });

      // 如果是Electron环境
      if (this.isElectronEnvironment() && (window as any).electronAPI) {
        (window as any).electronAPI.closeReminderPopup({ taskId });
      }

      this.activePopups.delete(taskId);
    }
  }

  // ========== 声音提醒处理 ==========

  /**
   * 播放声音提醒
   */
  async playReminderSound(config: SoundReminderConfig): Promise<void> {
    try {
      console.log(`[ReminderTrigger] 播放声音提醒: ${config.taskId}`);

      const soundFile = config.soundFile || this.getDefaultSoundFile(config.priority);
      const volume = (config.volume || 80) / 100;
      const repeat = config.repeat || 1;

      if (this.isElectronEnvironment()) {
        await this.playElectronSound(soundFile, volume, repeat);
      } else {
        await this.playWebSound(soundFile, volume, repeat);
      }
    } catch (error) {
      console.error('[ReminderTrigger] 播放声音失败:', error);
    }
  }

  /**
   * 在Electron环境中播放声音
   */
  private async playElectronSound(
    soundFile: string,
    volume: number,
    repeat: number,
  ): Promise<void> {
    // 通过IPC发送给主进程
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      (window as any).electronAPI.playReminderSound({
        soundFile,
        volume,
        repeat,
      });
    } else {
      console.warn('Electron API not available, falling back to web sound');
      await this.playWebSound(soundFile, volume, repeat);
    }
  }

  /**
   * 在Web环境中播放声音
   */
  private async playWebSound(soundFile: string, volume: number, repeat: number): Promise<void> {
    if (!this.audioContext) {
      await this.initializeAudioContext();
    }

    if (!this.audioContext) {
      console.error('AudioContext not available');
      return;
    }

    try {
      // 获取音频缓冲区
      let audioBuffer = this.soundBuffers.get(soundFile);

      if (!audioBuffer) {
        audioBuffer = await this.loadSoundFile(soundFile);
        this.soundBuffers.set(soundFile, audioBuffer);
      }

      // 播放声音
      for (let i = 0; i < repeat; i++) {
        await this.playAudioBuffer(audioBuffer, volume);
        if (i < repeat - 1) {
          await this.delay(500); // 重复播放间隔
        }
      }
    } catch (error) {
      console.error('播放Web音频失败:', error);
    }
  }

  /**
   * 初始化AudioContext
   */
  private async initializeAudioContext(): Promise<void> {
    if (
      typeof window === 'undefined' ||
      (!window.AudioContext && !(window as any).webkitAudioContext)
    ) {
      return; // 不支持AudioContext的环境
    }

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // 处理需要用户激活的情况
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
    } catch (error) {
      console.error('初始化AudioContext失败:', error);
    }
  }

  /**
   * 加载音频文件
   */
  private async loadSoundFile(soundFile: string): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('AudioContext not available');
    }

    const response = await fetch(soundFile);
    const arrayBuffer = await response.arrayBuffer();
    return await this.audioContext.decodeAudioData(arrayBuffer);
  }

  /**
   * 播放音频缓冲区
   */
  private async playAudioBuffer(audioBuffer: AudioBuffer, volume: number): Promise<void> {
    if (!this.audioContext) {
      throw new Error('AudioContext not available');
    }

    return new Promise((resolve) => {
      const source = this.audioContext!.createBufferSource();
      const gainNode = this.audioContext!.createGain();

      source.buffer = audioBuffer;
      gainNode.gain.value = volume;

      source.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);

      source.onended = () => resolve();
      source.start();
    });
  }

  /**
   * 根据优先级获取默认声音文件
   */
  private getDefaultSoundFile(priority: SchedulePriority): string {
    const basePath = '/sounds/';

    switch (priority) {
      case SchedulePriority.URGENT:
        return `${basePath}urgent-reminder.mp3`;
      case SchedulePriority.HIGH:
        return `${basePath}high-reminder.mp3`;
      case SchedulePriority.NORMAL:
        return `${basePath}normal-reminder.mp3`;
      case SchedulePriority.LOW:
        return `${basePath}low-reminder.mp3`;
      default:
        return `${basePath}default-reminder.mp3`;
    }
  }

  // ========== 系统通知处理 ==========

  /**
   * 显示系统通知
   */
  async showSystemNotification(config: {
    title: string;
    body: string;
    icon?: string;
    tag?: string;
  }): Promise<void> {
    try {
      console.log(`[ReminderTrigger] 显示系统通知: ${config.title}`);

      if (this.isElectronEnvironment()) {
        await this.showElectronNotification(config);
      } else {
        await this.showWebNotification(config);
      }
    } catch (error) {
      console.error('[ReminderTrigger] 显示系统通知失败:', error);
    }
  }

  /**
   * 在Electron环境中显示系统通知
   */
  private async showElectronNotification(config: {
    title: string;
    body: string;
    icon?: string;
    tag?: string;
  }): Promise<void> {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      (window as any).electronAPI.showSystemNotification(config);
    } else {
      await this.showWebNotification(config);
    }
  }

  /**
   * 在Web环境中显示系统通知
   */
  private async showWebNotification(config: {
    title: string;
    body: string;
    icon?: string;
    tag?: string;
  }): Promise<void> {
    if (!('Notification' in window)) {
      console.warn('此浏览器不支持系统通知');
      return;
    }

    // 请求通知权限
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    if (Notification.permission === 'granted') {
      new Notification(config.title, {
        body: config.body,
        icon: config.icon || '/icons/notification-icon.png',
        tag: config.tag,
      });
    } else {
      console.warn('用户拒绝了通知权限');
    }
  }

  // ========== 桌面闪烁处理 ==========

  /**
   * 闪烁桌面窗口
   */
  async flashDesktop(config: { taskId: string }): Promise<void> {
    try {
      console.log(`[ReminderTrigger] 闪烁桌面: ${config.taskId}`);

      if (this.isElectronEnvironment()) {
        if (typeof window !== 'undefined' && (window as any).electronAPI) {
          (window as any).electronAPI.flashWindow();
        }
      } else {
        // Web环境中闪烁浏览器标题
        this.flashBrowserTitle('🔔 新提醒');
      }
    } catch (error) {
      console.error('[ReminderTrigger] 闪烁桌面失败:', error);
    }
  }

  /**
   * 闪烁浏览器标题
   */
  private flashBrowserTitle(message: string): void {
    const originalTitle = document.title;
    let count = 0;
    const maxFlashes = 6;

    const flashInterval = setInterval(() => {
      document.title = count % 2 === 0 ? message : originalTitle;
      count++;

      if (count >= maxFlashes) {
        clearInterval(flashInterval);
        document.title = originalTitle;
      }
    }, 1000);
  }

  // ========== 事件处理器 ==========

  /**
   * 注册事件处理器
   */
  private registerEventHandlers(): void {
    // 弹窗提醒事件
    eventBus.on('ui:show-popup-reminder', async (data: PopupReminderConfig) => {
      await this.showPopupReminder(data);
    });

    // 声音提醒事件
    eventBus.on('ui:play-reminder-sound', async (data: SoundReminderConfig) => {
      await this.playReminderSound(data);
    });

    // 系统通知事件
    eventBus.on(
      'system:show-notification',
      async (data: { title: string; body: string; icon?: string }) => {
        await this.showSystemNotification(data);
      },
    );

    // 桌面闪烁事件
    eventBus.on('system:flash-window', async (data: { taskId: string }) => {
      await this.flashDesktop(data);
    });

    // 用户操作事件
    eventBus.on('reminder:user-action', (data: { taskId: string; action: string }) => {
      this.handleUserAction(data.taskId, data.action);
    });
  }

  /**
   * 处理用户操作
   */
  private handleUserAction(taskId: string, action: string): void {
    console.log(`[ReminderTrigger] 处理用户操作: ${taskId} - ${action}`);

    // 关闭相关弹窗
    this.closePopupReminder(taskId);

    // 根据操作类型处理
    if (action === 'acknowledge') {
      eventBus.emit('schedule:acknowledge-reminder', { taskId });
    } else if (action === 'dismiss') {
      eventBus.emit('schedule:dismiss-reminder', { taskId });
    } else if (action.startsWith('snooze-')) {
      const minutes = parseInt(action.split('-')[1]);
      eventBus.emit('schedule:snooze-reminder', { taskId, delayMinutes: minutes });
    }
  }

  // ========== 工具方法 ==========

  /**
   * 检查是否在Electron环境
   */
  private isElectronEnvironment(): boolean {
    return typeof window !== 'undefined' && (window as any).electronAPI;
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 获取活跃弹窗列表
   */
  getActivePopups(): Array<{ taskId: string; config: PopupReminderConfig; createdAt: Date }> {
    return Array.from(this.activePopups.entries()).map(([taskId, popup]) => ({
      taskId,
      config: popup.config,
      createdAt: popup.createdAt,
    }));
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    // 关闭所有活跃弹窗
    for (const taskId of this.activePopups.keys()) {
      this.closePopupReminder(taskId);
    }

    // 清理音频资源
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.soundBuffers.clear();

    console.log('[ReminderTrigger] 资源清理完成');
  }
}

// 导出单例实例
export const reminderTriggerHandler = ReminderTriggerHandler.getInstance();
