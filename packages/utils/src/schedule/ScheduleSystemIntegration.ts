/**
 * Schedule Integration Example for Electron Apps
 * @description 在Electron应用中集成调度和提醒系统的示例
 * @author DailyUse Team
 * @date 2025-01-09
 */

import { scheduleService, SimpleScheduleService } from './SimpleScheduleService';
import { alertHandlerSystem, AlertHandlerSystem } from './AlertHandlerSystem';
import { AlertMethod, SchedulePriority, ScheduleTaskType } from '@dailyuse/contracts';

/**
 * 调度系统集成类
 */
export class ScheduleSystemIntegration {
  private scheduleService: SimpleScheduleService;
  private alertSystem: AlertHandlerSystem;

  constructor() {
    this.scheduleService = scheduleService;
    this.alertSystem = alertHandlerSystem;
    this.setupEventHandlers();
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    // 监听提醒触发事件
    this.scheduleService.on('reminder-triggered', async (reminderData) => {
      await this.handleReminderTriggered(reminderData);
    });

    // 监听特定类型的提醒
    this.scheduleService.on('task-reminder', async (reminderData) => {
      console.log('任务提醒触发:', reminderData);
    });

    this.scheduleService.on('goal-reminder', async (reminderData) => {
      console.log('目标提醒触发:', reminderData);
    });

    this.scheduleService.on('general-reminder', async (reminderData) => {
      console.log('通用提醒触发:', reminderData);
    });

    // 监听弹窗提醒事件
    this.alertSystem.on('show-popup-notification', (data) => {
      this.showElectronNotificationWindow(data);
    });

    // 监听声音提醒事件
    this.alertSystem.on('play-alert-sound', (data) => {
      this.playSystemSound(data);
    });

    // 监听系统通知事件
    this.alertSystem.on('show-system-notification', (data) => {
      this.showSystemNotification(data);
    });

    // 监听桌面闪烁事件
    this.alertSystem.on('flash-window', (data) => {
      this.flashMainWindow(data);
    });
  }

  /**
   * 处理提醒触发
   */
  private async handleReminderTriggered(reminderData: any): Promise<void> {
    console.log('提醒触发:', reminderData);

    // 使用提醒处理系统执行所有配置的提醒方式
    const results = await this.alertSystem.handleMultipleAlerts(
      reminderData.alertMethods,
      {
        uuid: reminderData.taskUuid,
        title: reminderData.title,
        message: reminderData.message,
        priority: reminderData.priority,
      },
      reminderData.priority,
    );

    // 输出处理结果
    results.forEach((result) => {
      if (result.success) {
        console.log(`✓ ${result.method} 提醒执行成功`);
      } else {
        console.error(`✗ ${result.method} 提醒执行失败:`, result.error);
      }
    });
  }

  /**
   * 显示Electron通知窗口
   */
  private showElectronNotificationWindow(data: any): void {
    // 在实际的Electron应用中，这里会调用notificationService
    console.log('显示Electron通知窗口:', data);

    // 示例代码 - 实际实现时使用你们现有的notificationService
    /*
    import { notificationService } from '@electron/shared/notification';
    
    notificationService.showNotification({
      uuid: data.uuid,
      title: data.title,
      body: data.message,
      importance: data.importance,
      actions: data.actions
    });
    */
  }

  /**
   * 播放系统声音
   */
  private playSystemSound(data: any): void {
    console.log('播放系统声音:', data);

    // 在实际的Electron应用中，这里可能会：
    // 1. 使用HTML5 Audio API播放声音文件
    // 2. 调用系统API播放系统声音
    // 3. 使用electron的shell.beep()方法

    // 示例代码
    /*
    const { shell } = require('electron');
    
    if (data.soundFile && data.soundFile !== 'system') {
      // 播放自定义声音文件
      const audio = new Audio(data.soundFile);
      audio.volume = (data.volume || 70) / 100;
      audio.play().catch(console.error);
      
      // 根据repeat设置重复播放
      if (data.repeat > 1) {
        let playCount = 1;
        const interval = setInterval(() => {
          if (playCount < data.repeat) {
            audio.currentTime = 0;
            audio.play().catch(console.error);
            playCount++;
          } else {
            clearInterval(interval);
          }
        }, 1000);
      }
    } else {
      // 播放系统哔声
      shell.beep();
    }
    */
  }

  /**
   * 显示系统通知
   */
  private showSystemNotification(data: any): void {
    console.log('显示系统通知:', data);

    // 在实际的Electron应用中，这里会使用Notification API
    /*
    const { Notification } = require('electron');
    
    if (Notification.isSupported()) {
      const notification = new Notification({
        title: data.title,
        body: data.body,
        icon: data.icon,
        urgent: data.urgent,
        silent: data.silent
      });
      
      notification.show();
      
      notification.on('click', () => {
        // 处理点击事件
        console.log('系统通知被点击');
      });
    }
    */
  }

  /**
   * 闪烁主窗口
   */
  private flashMainWindow(data: any): void {
    console.log('闪烁主窗口:', data);

    // 在实际的Electron应用中，这里会操作BrowserWindow
    /*
    import { BrowserWindow } from 'electron';
    
    const mainWindow = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      let flashCount = 0;
      const interval = setInterval(() => {
        if (flashCount < data.flashCount) {
          mainWindow.flashFrame(true);
          setTimeout(() => mainWindow.flashFrame(false), data.flashInterval / 2);
          flashCount++;
        } else {
          clearInterval(interval);
        }
      }, data.flashInterval);
    }
    */
  }

  // ==================== 公共API ====================

  /**
   * 创建任务提醒
   */
  public createTaskReminder(
    taskId: string,
    taskTitle: string,
    reminderTime: Date,
    options?: {
      message?: string;
      alertMethods?: AlertMethod[];
      priority?: SchedulePriority;
    },
  ): string {
    return this.scheduleService.createTaskReminder(
      taskId,
      taskTitle,
      options?.message || `任务提醒: ${taskTitle}`,
      reminderTime,
      options?.alertMethods || [AlertMethod.POPUP, AlertMethod.SOUND],
      'system',
    );
  }

  /**
   * 创建目标提醒
   */
  public createGoalReminder(
    goalId: string,
    goalTitle: string,
    reminderTime: Date,
    options?: {
      message?: string;
      alertMethods?: AlertMethod[];
      priority?: SchedulePriority;
    },
  ): string {
    return this.scheduleService.createGoalReminder(
      goalId,
      goalTitle,
      options?.message || `目标提醒: ${goalTitle}`,
      reminderTime,
      options?.alertMethods || [AlertMethod.POPUP, AlertMethod.SOUND],
      'system',
    );
  }

  /**
   * 创建快速提醒
   */
  public createQuickReminder(
    title: string,
    message: string,
    reminderTime: Date,
    options?: {
      priority?: SchedulePriority;
      alertMethods?: AlertMethod[];
    },
  ): string {
    return this.scheduleService.createQuickReminder(title, message, reminderTime, {
      priority: options?.priority,
      alertMethods: options?.alertMethods,
      createdBy: 'user',
    });
  }

  /**
   * 延后提醒
   */
  public snoozeReminder(taskUuid: string, delayMinutes: number): boolean {
    return this.scheduleService.snoozeTask(taskUuid, delayMinutes);
  }

  /**
   * 取消提醒
   */
  public cancelReminder(taskUuid: string): boolean {
    return this.scheduleService.cancelSchedule(taskUuid);
  }

  /**
   * 获取即将到来的提醒
   */
  public getUpcomingReminders(withinMinutes: number = 60): Array<{
    task: any;
    minutesUntil: number;
  }> {
    return this.scheduleService.getUpcomingTasks(withinMinutes);
  }

  /**
   * 设置提醒系统配置
   */
  public configureAlertSystem(config: {
    enabled?: boolean;
    muteUntil?: Date;
    quietHours?: {
      enabled: boolean;
      start?: string;
      end?: string;
    };
  }): void {
    if (config.enabled !== undefined) {
      this.alertSystem.setEnabled(config.enabled);
    }

    if (config.muteUntil) {
      this.alertSystem.muteUntil(config.muteUntil);
    }

    if (config.quietHours) {
      this.alertSystem.setQuietHours(
        config.quietHours.enabled,
        config.quietHours.start,
        config.quietHours.end,
      );
    }
  }

  /**
   * 测试提醒方式
   */
  public async testAlertMethod(method: AlertMethod): Promise<boolean> {
    return await this.alertSystem.testAlert(method);
  }

  /**
   * 获取系统状态
   */
  public getSystemStatus(): {
    schedule: any;
    alert: any;
  } {
    return {
      schedule: this.scheduleService.getStatus(),
      alert: this.alertSystem.getConfig(),
    };
  }

  /**
   * 清理过期任务
   */
  public cleanup(): number {
    return this.scheduleService.cleanup();
  }

  /**
   * 停止系统
   */
  public stop(): void {
    this.scheduleService.stop();
    console.log('调度系统集成已停止');
  }
}

// 导出单例实例
export const scheduleSystemIntegration = new ScheduleSystemIntegration();

// 导出类型和接口
export type {
  PopupAlertData,
  SoundAlertData,
  SystemNotificationData,
  DesktopFlashData,
} from './AlertHandlerSystem';

export type { SimpleScheduleTask, ReminderEventData } from './SimpleScheduleService';
