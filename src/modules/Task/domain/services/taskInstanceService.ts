import { v4 as uuidv4 } from 'uuid';
import { TaskInstance } from '../entities/taskInstance';
import { TaskTemplate } from '../entities/taskTemplate';
import type { DateTime } from '@/shared/types/myDateTime';
import type { CreateTaskInstanceOptions, TaskReminderConfig, TaskInstanceReminderStatus } from '../types/task';
import { TaskTimeUtils } from '@/modules/Task/domain/utils/taskTimeUtils';


export class TaskInstanceService {
  /**
   * 从模板创建单个任务实例
   */
  createInstanceFromTemplate(
    template: TaskTemplate,
    scheduledTime?: DateTime,
    customOptions?: Partial<CreateTaskInstanceOptions> & {
      title?: string;
      description?: string;
      priority?: 1 | 2 | 3 | 4;
      endTime?: DateTime;
    }
  ): TaskInstance {
    const instanceId = uuidv4();
    
    // 使用提供的时间或模板的基础时间
    const instanceScheduledTime = scheduledTime || template.timeConfig.baseTime.start;
    const instanceEndTime = customOptions?.endTime || template.timeConfig.baseTime.end;
    
    const instanceReminderConfig = this.convertTemplateRemindersToInstanceReminders(
      template.reminderConfig,
      instanceScheduledTime
    );

    return TaskInstance.fromTemplate(
      instanceId,
      {
        id: template.id,
        title: customOptions?.title || template.title,
        description: customOptions?.description || template.description,
        timeConfig: template.timeConfig,
        metadata: template.metadata,
        keyResultLinks: template.keyResultLinks,
        reminderConfig: template.reminderConfig,
        schedulingPolicy: template.schedulingPolicy
      },
      instanceScheduledTime,
      instanceEndTime
    );
  }

  private convertTemplateRemindersToInstanceReminders(
    templateReminderConfig: TaskReminderConfig,
    scheduledTime: DateTime
  ): TaskInstanceReminderStatus {
    // 如果模板没有启用提醒，返回禁用状态
    if (!templateReminderConfig.enabled || !templateReminderConfig.alerts.length) {
      return {
        enabled: false,
        alerts: [],
        globalSnoozeCount: 0
      };
    }

    const alerts = templateReminderConfig.alerts.map(alert => ({
      id: alert.id,
      alertConfig: alert, // 保持原始配置
      status: 'pending' as const,
      scheduledTime: scheduledTime, // 临时使用任务时间，后续在调度时重新计算
      snoozeHistory: []
    }));

    return {
      enabled: true,
      alerts,
      globalSnoozeCount: 0
    };
  }
  /**
   * 根据模板的重复配置生成多个实例
   */
  generateInstancesFromTemplate(
    template: TaskTemplate,
    maxInstances: number = 100
  ): TaskInstance[] {
    const instances: TaskInstance[] = [];
    const { timeConfig } = template;
    
    // 如果不是重复任务，只创建一个实例
    if (timeConfig.recurrence.type === 'none') {
      return [this.createInstanceFromTemplate(template)];
    }

    let currentTime = timeConfig.baseTime.start;
    let count = 0;
    const now = TaskTimeUtils.now();

    while (count < maxInstances) {
      const nextTime = TaskTimeUtils.getNextOccurrence(timeConfig, currentTime);
      
      if (!nextTime) break;
      if (this.shouldStopGeneration(timeConfig, nextTime, count)) break;
      
      // 只生成未来的实例
      if (nextTime.timestamp >= now.timestamp) {
        const endTime = timeConfig.baseTime.end ? 
          TaskTimeUtils.addMinutes(nextTime, TaskTimeUtils.getMinutesBetween(timeConfig.baseTime.start, timeConfig.baseTime.end)) :
          undefined;
          
        instances.push(this.createInstanceFromTemplate(template, nextTime, { endTime }));
      }

      currentTime = nextTime;
      count++;

      // 防止无限循环
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
  ): TaskInstance[] {
    const instances: TaskInstance[] = [];
    const { timeConfig } = template;

    // 非重复任务
    if (timeConfig.recurrence.type === 'none') {
      if (TaskTimeUtils.isInRange(timeConfig.baseTime.start, startDate, endDate)) {
        instances.push(this.createInstanceFromTemplate(template));
      }
      return instances;
    }

    // 重复任务
    let currentTime = timeConfig.baseTime.start;
    if (currentTime.timestamp < startDate.timestamp) {
      currentTime = startDate;
    }

    let count = 0;
    const maxInstances = 1000;

    while (currentTime.timestamp <= endDate.timestamp && count < maxInstances) {
      const nextTime = TaskTimeUtils.getNextOccurrence(timeConfig, currentTime);
      
      if (!nextTime || nextTime.timestamp > endDate.timestamp) break;
      if (this.shouldStopGeneration(timeConfig, nextTime, count)) break;

      const endTime = timeConfig.baseTime.end ? 
        TaskTimeUtils.addMinutes(nextTime, TaskTimeUtils.getMinutesBetween(timeConfig.baseTime.start, timeConfig.baseTime.end)) :
        undefined;

      instances.push(this.createInstanceFromTemplate(template, nextTime, { endTime }));
      currentTime = nextTime;
      count++;
    }

    return instances;
  }

  /**
   * 验证实例状态转换
   */
  canChangeStatus(instance: TaskInstance, newStatus: string): boolean {
    const currentStatus = instance.status;
    
    const allowedTransitions: Record<"pending" | "inProgress" | "completed" | "cancelled" | "overdue", string[]> = {
      'pending': ['inProgress', 'cancelled'],
      'inProgress': ['completed', 'cancelled', 'pending'],
      'completed': ['pending'], // 允许撤销完成
      'cancelled': ['pending'],
      'overdue': ['pending', 'inProgress', 'cancelled']
    };

    return allowedTransitions[currentStatus]?.includes(newStatus) ?? false;
  }

  /**
   * 检查时间冲突
   */
  checkTimeConflicts(
    instances: TaskInstance[],
    newInstance: TaskInstance
  ): TaskInstance[] {
    return instances.filter(instance => {
      if (instance.id === newInstance.id) return false;
      if (instance.status === 'completed' || instance.status === 'cancelled') return false;

      return this.hasTimeOverlap(instance, newInstance);
    });
  }

  /**
   * 验证任务实例
   */
  validateInstance(instance: TaskInstance): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!instance.title.trim()) {
      errors.push('任务标题不能为空');
    }

    if (instance.timeConfig.type === 'timeRange' && !instance.timeConfig.endTime) {
      errors.push('时间段类型的任务必须设置结束时间');
    }

    if (instance.timeConfig.endTime && 
        instance.timeConfig.endTime.timestamp <= instance.timeConfig.scheduledTime.timestamp) {
      errors.push('结束时间必须晚于开始时间');
    }

    if (instance.priority < 1 || instance.priority > 4) {
      errors.push('优先级必须在1-4之间');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 重新调度任务实例
   */
  rescheduleInstance(
    instance: TaskInstance,
    newScheduledTime: DateTime,
    newEndTime?: DateTime
  ): void {
    try {
      instance.reschedule(newScheduledTime, newEndTime);
    } catch (error) {
      throw new Error(`重新调度失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // ... 其他私有方法保持不变
  private shouldStopGeneration(timeConfig: any, nextTime: DateTime, count: number): boolean {
    // 按结束日期停止
    if (timeConfig.recurrence.endCondition.type === 'date' && 
        timeConfig.recurrence.endCondition.endDate &&
        nextTime.timestamp > timeConfig.recurrence.endCondition.endDate.timestamp) {
      return true;
    }

    // 按次数停止
    if (timeConfig.recurrence.endCondition.type === 'count' &&
        timeConfig.recurrence.endCondition.count &&
        count >= timeConfig.recurrence.endCondition.count) {
      return true;
    }

    return false;
  }

  private hasTimeOverlap(instance1: TaskInstance, instance2: TaskInstance): boolean {
    const start1 = instance1.timeConfig.scheduledTime.timestamp;
    const end1 = instance1.timeConfig.endTime?.timestamp || start1 + (instance1.timeConfig.estimatedDuration || 60) * 60 * 1000;
    
    const start2 = instance2.timeConfig.scheduledTime.timestamp;
    const end2 = instance2.timeConfig.endTime?.timestamp || start2 + (instance2.timeConfig.estimatedDuration || 60) * 60 * 1000;

    return start1 < end2 && start2 < end1;
  }
}

export const taskInstanceService = new TaskInstanceService();