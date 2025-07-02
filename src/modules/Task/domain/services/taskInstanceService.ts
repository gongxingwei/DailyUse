import { v4 as uuidv4 } from 'uuid';
import { TaskInstance } from '../entities/taskInstance';
import { TaskTemplate } from '../entities/taskTemplate';
import type { DateTime } from '@/shared/types/myDateTime';
import type { CreateTaskInstanceOptions } from '../types/task';
import { TaskTimeUtils } from '@/modules/Task/domain/utils/taskTimeUtils';

/**
 * 任务实例服务
 * 负责任务实例的创建、生成、验证等操作
 */
export class TaskInstanceService {
  /**
   * 从任务模板创建单个任务实例
   * @param {TaskTemplate} taskTemplate - 任务模板
   * @param {DateTime} scheduledTime - 计划时间（可选）
   * @param {object} customOptions - 自定义选项（可选）
   * @returns {TaskInstance} 创建的任务实例
   */
  createInstanceFromTemplate(
    taskTemplate: TaskTemplate,
    scheduledTime?: DateTime,
    customOptions?: Partial<CreateTaskInstanceOptions> & {
      title?: string;
      description?: string;
      priority?: 1 | 2 | 3 | 4;
      endTime?: DateTime;
    }
  ): TaskInstance {
    const instanceId = uuidv4();
    
    const instanceScheduledTime = scheduledTime || taskTemplate.timeConfig.baseTime.start;
    const instanceEndTime = customOptions?.endTime || taskTemplate.timeConfig.baseTime.end;

    return TaskInstance.fromTemplate(
      instanceId,
      {
        id: taskTemplate.id,
        title: customOptions?.title || taskTemplate.title,
        description: customOptions?.description || taskTemplate.description,
        timeConfig: taskTemplate.timeConfig,
        metadata: taskTemplate.metadata,
        keyResultLinks: taskTemplate.keyResultLinks,
        reminderConfig: taskTemplate.reminderConfig,
        schedulingPolicy: taskTemplate.schedulingPolicy
      },
      instanceScheduledTime,
      instanceEndTime
    );
  }

  /**
   * 根据任务模板的重复配置生成多个任务实例
   * @param {TaskTemplate} taskTemplate - 任务模板
   * @param {number} maxInstances - 最大生成实例数量
   * @returns {TaskInstance[]} 生成的任务实例数组
   */
  generateInstancesFromTemplate(
    taskTemplate: TaskTemplate,
    maxInstances: number = 100
  ): TaskInstance[] {
    const instances: TaskInstance[] = [];
    const { timeConfig } = taskTemplate;
    
    if (timeConfig.recurrence.type === 'none') {
      return [this.createInstanceFromTemplate(taskTemplate)];
    }

    let currentTime = timeConfig.baseTime.start;
    let count = 0;
    const now = TaskTimeUtils.now();

    while (count < maxInstances) {
      const nextTime = TaskTimeUtils.getNextOccurrence(timeConfig, currentTime);
      
      if (!nextTime) break;
      if (this.shouldStopGeneration(timeConfig, nextTime, count)) break;
      
      if (nextTime.timestamp >= now.timestamp) {
        const endTime = timeConfig.baseTime.end ? 
          TaskTimeUtils.addMinutes(nextTime, TaskTimeUtils.getMinutesBetween(timeConfig.baseTime.start, timeConfig.baseTime.end)) :
          undefined;
          
        instances.push(this.createInstanceFromTemplate(taskTemplate, nextTime, { endTime }));
      }

      currentTime = nextTime;
      count++;

      if (count > 1000) {
        console.warn('任务实例生成达到最大限制');
        break;
      }
    }
    console.log(`生成了 ${instances.length} 个任务实例`);
    console.log('生成实例时的taskTemplate', taskTemplate)
    return instances;
  }

  /**
   * 生成指定时间范围内的任务实例
   * @param {TaskTemplate} taskTemplate - 任务模板
   * @param {DateTime} startDate - 开始日期
   * @param {DateTime} endDate - 结束日期
   * @returns {TaskInstance[]} 生成的任务实例数组
   */
  generateInstancesInRange(
    taskTemplate: TaskTemplate, 
    startDate: DateTime, 
    endDate: DateTime
  ): TaskInstance[] {
    const instances: TaskInstance[] = [];
    const { timeConfig } = taskTemplate;

    if (timeConfig.recurrence.type === 'none') {
      if (TaskTimeUtils.isInRange(timeConfig.baseTime.start, startDate, endDate)) {
        instances.push(this.createInstanceFromTemplate(taskTemplate));
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
      const nextTime = TaskTimeUtils.getNextOccurrence(timeConfig, currentTime);
      
      if (!nextTime || nextTime.timestamp > endDate.timestamp) break;
      if (this.shouldStopGeneration(timeConfig, nextTime, count)) break;

      const endTime = timeConfig.baseTime.end ? 
        TaskTimeUtils.addMinutes(nextTime, TaskTimeUtils.getMinutesBetween(timeConfig.baseTime.start, timeConfig.baseTime.end)) :
        undefined;

      instances.push(this.createInstanceFromTemplate(taskTemplate, nextTime, { endTime }));
      currentTime = nextTime;
      count++;
    }

    return instances;
  }

  /**
   * 验证任务实例状态转换是否允许
   * @param {TaskInstance} taskInstance - 任务实例
   * @param {string} newStatus - 新状态
   * @returns {boolean} 是否允许状态转换
   */
  canChangeStatus(taskInstance: TaskInstance, newStatus: string): boolean {
    const currentStatus = taskInstance.status;
    
    const allowedTransitions: Record<"pending" | "inProgress" | "completed" | "cancelled" | "overdue", string[]> = {
      'pending': ['inProgress', 'cancelled'],
      'inProgress': ['completed', 'cancelled', 'pending'],
      'completed': ['pending'],
      'cancelled': ['pending'],
      'overdue': ['pending', 'inProgress', 'cancelled']
    };

    return allowedTransitions[currentStatus]?.includes(newStatus) ?? false;
  }

  /**
   * 检查任务实例之间的时间冲突
   * @param {TaskInstance[]} taskInstances - 现有任务实例数组
   * @param {TaskInstance} newTaskInstance - 新任务实例
   * @returns {TaskInstance[]} 冲突的任务实例数组
   */
  checkTimeConflicts(
    taskInstances: TaskInstance[],
    newTaskInstance: TaskInstance
  ): TaskInstance[] {
    return taskInstances.filter(taskInstance => {
      if (taskInstance.id === newTaskInstance.id) return false;
      if (taskInstance.status === 'completed' || taskInstance.status === 'cancelled') return false;

      return this.hasTimeOverlap(taskInstance, newTaskInstance);
    });
  }

  /**
   * 验证任务实例的有效性
   * @param {TaskInstance} taskInstance - 任务实例
   * @returns {object} 验证结果，包含是否有效和错误信息
   */
  validateInstance(taskInstance: TaskInstance): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!taskInstance.title.trim()) {
      errors.push('任务标题不能为空');
    }

    if (taskInstance.timeConfig.type === 'timeRange' && !taskInstance.timeConfig.endTime) {
      errors.push('时间段类型的任务必须设置结束时间');
    }

    if (taskInstance.timeConfig.endTime && 
        taskInstance.timeConfig.endTime.timestamp <= taskInstance.timeConfig.scheduledTime.timestamp) {
      errors.push('结束时间必须晚于开始时间');
    }

    if (taskInstance.priority < 1 || taskInstance.priority > 4) {
      errors.push('优先级必须在1-4之间');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 重新调度任务实例
   * @param {TaskInstance} taskInstance - 任务实例
   * @param {DateTime} newScheduledTime - 新的计划时间
   * @param {DateTime} newEndTime - 新的结束时间（可选）
   * @throws {Error} 重新调度失败时抛出错误
   */
  rescheduleInstance(
    taskInstance: TaskInstance,
    newScheduledTime: DateTime,
    newEndTime?: DateTime
  ): void {
    try {
      taskInstance.reschedule(newScheduledTime, newEndTime);
    } catch (error) {
      throw new Error(`重新调度失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 判断是否应该停止生成任务实例
   * @param {any} timeConfig - 时间配置
   * @param {DateTime} nextTime - 下一个时间点
   * @param {number} count - 当前生成数量
   * @returns {boolean} 是否应该停止生成
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

  /**
   * 检查两个任务实例是否有时间重叠
   * @param {TaskInstance} taskInstance1 - 任务实例1
   * @param {TaskInstance} taskInstance2 - 任务实例2
   * @returns {boolean} 是否有时间重叠
   */
  private hasTimeOverlap(taskInstance1: TaskInstance, taskInstance2: TaskInstance): boolean {
    const start1 = taskInstance1.timeConfig.scheduledTime.timestamp;
    const end1 = taskInstance1.timeConfig.endTime?.timestamp || start1 + (taskInstance1.timeConfig.estimatedDuration || 60) * 60 * 1000;
    
    const start2 = taskInstance2.timeConfig.scheduledTime.timestamp;
    const end2 = taskInstance2.timeConfig.endTime?.timestamp || start2 + (taskInstance2.timeConfig.estimatedDuration || 60) * 60 * 1000;

    return start1 < end2 && start2 < end1;
  }
}

export const taskInstanceService = new TaskInstanceService();