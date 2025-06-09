import { v4 as uuidv4 } from 'uuid';
import type { TaskTemplate, ITaskInstance } from '../types/task';
import type { DateTime } from '../types/timeStructure';
import { TimeUtils } from '../utils/timeUtils';
import { useTaskStore } from '../stores/taskStore';
import { taskReminderService } from './taskReminderService';

export class TaskInstanceService {
  private taskStore = useTaskStore();

  /**
   * 根据任务模板生成任务实例
   */
  generateInstancesFromTemplate(template: TaskTemplate, maxInstances: number = 100): ITaskInstance[] {
    const instances: ITaskInstance[] = [];
    const { timeConfig } = template;
    
    if (timeConfig.recurrence.type === 'none') {
      return [this.createTaskInstance(template, timeConfig.baseTime.start)];
    }

    // 重复任务生成逻辑
    let currentTime = timeConfig.baseTime.start;
    let count = 0;
    const now = TimeUtils.now();

    while (count < maxInstances) {
      const nextTime = TimeUtils.getNextOccurrence(timeConfig, currentTime);
      
      if (!nextTime) break;

      if (this.shouldStopGeneration(timeConfig, nextTime, count)) {
        break;
      }

      if (nextTime.timestamp >= now.timestamp) {
        instances.push(this.createTaskInstance(template, nextTime));
      }

      currentTime = nextTime;
      count++;

      if (count > 1000) {
        console.warn('任务实例生成达到最大限制');
        break;
      }
    }

    return instances;
  }

  /**
   * 生成指定时间范围内的任务实例
   */
  generateInstancesInRange(
    template: TaskTemplate, 
    startDate: DateTime, 
    endDate: DateTime
  ): ITaskInstance[] {
    const instances: ITaskInstance[] = [];
    const { timeConfig } = template;

    if (timeConfig.recurrence.type === 'none') {
      if (TimeUtils.isInRange(timeConfig.baseTime.start, startDate, endDate)) {
        instances.push(this.createTaskInstance(template, timeConfig.baseTime.start));
      }
      return instances;
    }

    let currentTime = timeConfig.baseTime.start;
    if (currentTime.timestamp < startDate.timestamp) {
      currentTime = startDate;
    }

    let count = 0;
    const maxInstances = 1000;

    while (currentTime.timestamp <= endDate.timestamp && count < maxInstances) {
      const nextTime = TimeUtils.getNextOccurrence(timeConfig, currentTime);
      
      if (!nextTime || nextTime.timestamp > endDate.timestamp) break;

      if (this.shouldStopGeneration(timeConfig, nextTime, count)) {
        break;
      }

      instances.push(this.createTaskInstance(template, nextTime));
      currentTime = nextTime;
      count++;
    }

    return instances;
  }

  /**
   * 删除单个任务实例及其提醒
   */
  async deleteTaskInstance(taskId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const taskStore = useTaskStore();
      const instance = taskStore.getTaskInstanceById(taskId);

      if (!instance) {
        return {
          success: false,
          message: '任务实例不存在'
        };
      }

      // 1. 取消提醒
      await taskReminderService.cancelTaskInstanceReminders(taskId);

      // 2. 删除实例
      const deleteSuccess = taskStore.deleteTaskInstanceById(taskId);

      if (deleteSuccess) {
        return {
          success: true,
          message: '任务实例删除成功'
        };
      } else {
        return {
          success: false,
          message: '任务实例删除失败'
        };
      }

    } catch (error) {
      console.error('删除任务实例失败:', error);
      return {
        success: false,
        message: `删除任务实例失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 批量删除任务实例
   */
  async batchDeleteTaskInstances(taskIds: string[]): Promise<{
    successCount: number;
    failedCount: number;
    cancelledReminders: number;
  }> {
    let successCount = 0;
    let failedCount = 0;
    let cancelledReminders = 0;

    for (const taskId of taskIds) {
      try {
        // 取消提醒
        await taskReminderService.cancelTaskInstanceReminders(taskId);
        cancelledReminders++;

        // 删除实例
        const success = this.taskStore.deleteTaskInstanceById(taskId);
        if (success) {
          successCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        console.error(`删除任务实例 ${taskId} 失败:`, error);
        failedCount++;
      }
    }

    return {
      successCount,
      failedCount,
      cancelledReminders
    };
  }

  /**
   * 创建单个任务实例
   */
  private createTaskInstance(template: TaskTemplate, scheduledTime: DateTime): ITaskInstance {
    return {
      id: uuidv4(),
      templateId: template.id,
      title: template.title,
      description: template.description,
      scheduledTime,
      keyResultLinks: template.keyResultLinks ? [...template.keyResultLinks] : undefined,
      priority: template.priority || 3,
      status: 'pending',
      reminderStatus: {
        triggeredAlerts: [],
        snoozeCount: 0,
        nextReminderTime: template.timeConfig.reminder.enabled ? 
          TimeUtils.calculateReminderTimes(scheduledTime, template.timeConfig.reminder)[0] : undefined
      }
    };
  }

  /**
   * 批量添加任务实例到存储
   */
  async addInstancesToStore(instances: ITaskInstance[]): Promise<void> {
    instances.forEach(instance => {
      this.taskStore.taskInstances.push(instance);
    });
    await this.taskStore.saveTaskInstances();
  }

  /**
   * 为模板生成并保存未来的任务实例
   */
  async generateAndSaveInstances(template: TaskTemplate, daysAhead: number = 30): Promise<ITaskInstance[]> {
    const now = TimeUtils.now();
    const endDate = TimeUtils.addDays(now, daysAhead);
    
    const instances = this.generateInstancesInRange(template, now, endDate);
    await this.addInstancesToStore(instances);
    
    return instances;
  }

  /**
   * 检查是否应该停止生成
   */
  private shouldStopGeneration(timeConfig: any, nextTime: DateTime, count: number): boolean {
    if (timeConfig.recurrence.endCondition.type === 'date' && 
        timeConfig.recurrence.endCondition.endDate &&
        nextTime.timestamp > timeConfig.recurrence.endCondition.endDate.timestamp) {
      return true;
    }

    if (timeConfig.recurrence.endCondition.type === 'count' &&
        timeConfig.recurrence.endCondition.count &&
        count >= timeConfig.recurrence.endCondition.count) {
      return true;
    }

    return false;
  }
}

export const taskInstanceService = new TaskInstanceService();