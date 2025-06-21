// src/modules/Task/services/taskReminderService.ts
import { TResponse } from '@/shared/types/response';
import type { ITaskInstance, TaskTemplate } from '../../types/task';
import type { DateTime } from '../../types/timeStructure';
import { TimeUtils } from '../../utils/timeUtils';
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
   * 取消传入任务实例的所有提醒
   */
  async cancelTaskInstanceReminders(taskInstanceId: string): Promise<TResponse<void>> {
    try {
      const reminderTimes = this.activeReminders.get(taskInstanceId);
      if (!reminderTimes) {
        return {
          success: true,
          message: `任务实例 ${taskInstanceId} 没有活跃的提醒`,
          data: undefined
        };
      } else {
        for (const reminderTime of reminderTimes) {
          const reminderId = `task-reminder-${taskInstanceId}-${reminderTime.timestamp}`;
          await scheduleService.cancelSchedule(reminderId);
        }
        
        this.activeReminders.delete(taskInstanceId);
        return {
          success: true,
          message: `成功取消任务实例 ${taskInstanceId} 的所有提醒`,
          data: undefined
        }
      }
    } catch (error) {
      console.error(`取消任务实例 ${taskInstanceId} 的提醒失败:`, error);
      return {
        success: false,
        message: `取消任务实例 ${taskInstanceId} 的提醒失败: ${error instanceof Error ? error.message : '未知错误'}`,
        data: undefined
      };
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
      await this.cancelTaskInstanceReminders(taskId);
    }

    // 重新创建提醒
    for (const instance of instances) {
      const template = templates.find(t => t.id === instance.templateId);

      // 检查模板是否存在以及时间配置是否有效
      if (!template) {
        console.warn(`未找到任务模板 ${instance.templateId}，跳过提醒创建`);
        continue;
      }
      if(!template.timeConfig || !template.timeConfig.reminder) {
        console.warn(`任务模板 ${template.id} 没有有效的时间配置，跳过提醒创建`);
        continue;
      }


      if (template && template.timeConfig.reminder.enabled) { // 确保提醒已启用
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