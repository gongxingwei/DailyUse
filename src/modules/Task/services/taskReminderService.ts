// src/modules/Task/services/taskReminderService.ts
import type { ITaskInstance, TaskTemplate } from '../types/task';
import type { DateTime } from '../types/timeStructure';
import { TimeUtils } from '../utils/timeUtils';
import { scheduleService } from '@/modules/schedule/services/scheduleService';

export class TaskReminderService {
  private static instance: TaskReminderService;
  private activeReminders = new Map<string, DateTime[]>();

  static getInstance(): TaskReminderService {
    if (!this.instance) {
      this.instance = new TaskReminderService();
    }
    return this.instance;
  }

  /**
   * 为任务实例创建所有提醒
   */
  async createTaskReminders(task: ITaskInstance, template: TaskTemplate): Promise<void> {
    const { timeConfig } = template;
    const reminderTimes = TimeUtils.calculateReminderTimes(
      task.scheduledTime,
      timeConfig.reminder
    );

    for (const reminderTime of reminderTimes) {
      await this.createSingleReminder(task, template, reminderTime);
    }

    this.activeReminders.set(task.id, reminderTimes);
  }

  /**
   * 创建单个提醒
   */
  private async createSingleReminder(
    task: ITaskInstance,
    template: TaskTemplate,
    reminderTime: DateTime
  ): Promise<void> {
    const reminderId = `task-reminder-${task.id}-${reminderTime.timestamp}`;
    
    // 使用更精确的 cron 表达式
    const cronExpression = this.createCronExpression(reminderTime);

    await scheduleService.createSchedule({
      id: reminderId,
      cron: cronExpression,
      task: {
        type: 'taskReminder',
        payload: {
          taskId: task.id,
          templateId: template.id,
          title: `任务提醒: ${task.title}`,
          body: this.generateReminderMessage(task, template, reminderTime),
          reminderTime: reminderTime.isoString,
          taskTime: task.scheduledTime.isoString
        }
      }
    });
  }

  

  /**
   * 创建精确的 cron 表达式
   */
  private createCronExpression(dateTime: DateTime): string {
    const { time, date } = dateTime;
    
    if (!time) {
      throw new Error('提醒时间必须包含具体时间');
    }

    // 格式: 分 时 日 月 星期
    return `${time.minute} ${time.hour} ${date.day} ${date.month} *`;
  }

  /**
   * 生成提醒消息
   */
  private generateReminderMessage(
    task: ITaskInstance,
    template: TaskTemplate,
    reminderTime: DateTime
  ): string {
    const timeDiff = task.scheduledTime.timestamp - reminderTime.timestamp;
    const minutesBefore = Math.round(timeDiff / (1000 * 60));
    
    const timeConfig = template.timeConfig;
    let timeStr = '';
    
    if (timeConfig.type === 'allDay') {
      timeStr = '今日';
    } else if (timeConfig.type === 'timed') {
      timeStr = `${task.scheduledTime.time?.hour}:${task.scheduledTime.time?.minute?.toString().padStart(2, '0')}`;
    } else if (timeConfig.type === 'timeRange' && timeConfig.baseTime.end) {
      const startTime = task.scheduledTime.time;
      const endTime = timeConfig.baseTime.end.time;
      timeStr = `${startTime?.hour}:${startTime?.minute?.toString().padStart(2, '0')} - ${endTime?.hour}:${endTime?.minute?.toString().padStart(2, '0')}`;
    }

    return `任务 "${task.title}" 将在 ${minutesBefore} 分钟后 (${timeStr}) 开始。`;
  }

  /**
   * 取消任务的所有提醒
   */
  async cancelTaskReminders(taskId: string): Promise<void> {
    const reminderTimes = this.activeReminders.get(taskId);
    
    if (reminderTimes) {
      for (const reminderTime of reminderTimes) {
        const reminderId = `task-reminder-${taskId}-${reminderTime.timestamp}`;
        await scheduleService.cancelSchedule(reminderId);
      }
      
      this.activeReminders.delete(taskId);
    }
  }

  /**
   * 重新初始化所有提醒
   */
  async reinitializeAllReminders(
    templates: TaskTemplate[],
    instances: ITaskInstance[]
  ): Promise<void> {
    // 清除所有现有提醒
    for (const [taskId] of this.activeReminders) {
      await this.cancelTaskReminders(taskId);
    }

    // 重新创建提醒
    for (const instance of instances) {
      const template = templates.find(t => t.id === instance.templateId);
      if (template && template.timeConfig.reminder.enabled) {
        await this.createTaskReminders(instance, template);
      }
    }
  }

  /**
   * 获取即将到来的提醒
   */
  getUpcomingReminders(withinMinutes: number = 60): Array<{
    taskId: string;
    reminderTime: DateTime;
    minutesUntil: number;
  }> {
    const now = TimeUtils.now();
    const cutoffTime = now.timestamp + (withinMinutes * 60 * 1000);
    const upcoming: Array<{
      taskId: string;
      reminderTime: DateTime;
      minutesUntil: number;
    }> = [];

    for (const [taskId, reminderTimes] of this.activeReminders) {
      for (const reminderTime of reminderTimes) {
        if (reminderTime.timestamp > now.timestamp && reminderTime.timestamp <= cutoffTime) {
          upcoming.push({
            taskId,
            reminderTime,
            minutesUntil: Math.round((reminderTime.timestamp - now.timestamp) / (1000 * 60))
          });
        }
      }
    }

    return upcoming.sort((a, b) => a.reminderTime.timestamp - b.reminderTime.timestamp);
  }
}

export const taskReminderService = TaskReminderService.getInstance();