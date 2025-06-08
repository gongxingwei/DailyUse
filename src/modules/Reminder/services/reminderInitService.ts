// src/modules/Reminder/services/reminderInitService.ts
import { useReminderStore } from '@/modules/Reminder/stores/reminderStore';
import { scheduleService } from '@/modules/schedule/services/scheduleService';
import { notificationService } from '@/modules/notification/services/notificationService';
import type { UrgencyLevel } from '@/shared/types/time';

export class ReminderInitService {
  private static cleanup: (() => void) | null = null;
  private static isInitialized = false;

  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('提醒系统已经初始化');
      return;
    }

    try {
      const reminderStore = useReminderStore();
      
      if (reminderStore.reminders.length === 0) {
        console.warn('提醒数据尚未加载，等待数据加载完成...');
        return;
      }

      console.log(`开始初始化 ${reminderStore.reminders.length} 个提醒...`);
      await reminderStore.initializeSchedules();

      this.cleanup = scheduleService.onScheduleTriggered(({ task }) => {
        if (task.type === 'REMINDER') {
          this.handleReminderNotification(task.payload);
        }
      });

      this.isInitialized = true;
      console.log('提醒系统初始化完成');
    } catch (error) {
      console.error('提醒系统初始化失败:', error);
      throw error;
    }
  }

  private static async handleReminderNotification(reminder: { 
    title: string; 
    body: string; 
    urgency: UrgencyLevel 
  }): Promise<void> {
    try {
      switch (reminder.urgency) {
        case 'critical':
          await notificationService.showNotification({
            title: reminder.title,
            body: reminder.body,
            urgency: 'critical'
          });
          break;
        case 'normal':
        case 'low':
          await notificationService.showNotification({
            title: reminder.title,
            body: reminder.body,
            urgency: 'normal'
          });
          break;
      }
    } catch (error) {
      console.error('显示提醒通知失败:', error);
    }
  }

  static destroy(): void {
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }
    this.isInitialized = false;
    console.log('提醒系统已清理');
  }

  static isReady(): boolean {
    return this.isInitialized;
  }
}