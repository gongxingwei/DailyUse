import { v4 as uuidv4 } from 'uuid';
import { TaskInstance } from '../aggregates/taskInstance';
import { TaskTemplate } from '../aggregates/taskTemplate';

import { TaskTimeUtils } from '@common/modules/task/utils/taskTimeUtils';
import { addMinutes } from 'date-fns/addMinutes';

/**
 * 任务实例服务
 * 负责任务实例的创建、生成、验证、冲突检测等操作。
 *
 * 常用场景：从模板批量生成实例、校验实例、判断时间冲突、状态流转等。
 */
export class TaskInstanceService {
  /**
   * 从任务模板创建单个任务实例
   * @param taskTemplate 任务模板
   * @param scheduledTime 计划时间（可选，默认取模板的 baseTime.start）
   * @param customOptions 自定义选项（可选：title/description/priority/endTime）
   * @returns 创建的 TaskInstance 实体
   * @example
   * ```ts
   * const instance = service.createInstanceFromTemplate(template, myTime, { title: "自定义标题" });
   * ```
   */
  createInstanceFromTemplate(
    taskTemplate: TaskTemplate,
    scheduledTime?: Date,
    customOptions?: {
      title?: string;
      description?: string;
      priority?: 1 | 2 | 3 | 4;
      endTime?: Date;
    },
  ): TaskInstance {
    const instanceId = uuidv4();
    const instanceScheduledTime = scheduledTime || taskTemplate.timeConfig.baseTime.start;
    const instanceEndTime = customOptions?.endTime || taskTemplate.timeConfig.baseTime.end;

    return TaskInstance.fromTemplate(
      instanceId,
      {
        uuid: taskTemplate.uuid,
        title: customOptions?.title || taskTemplate.title,
        description: customOptions?.description || taskTemplate.description,
        timeConfig: taskTemplate.timeConfig,
        metadata: taskTemplate.metadata,
        keyResultLinks: taskTemplate.keyResultLinks,
        reminderConfig: taskTemplate.reminderConfig,
        schedulingPolicy: taskTemplate.schedulingPolicy,
      },
      instanceScheduledTime,
      instanceEndTime,
    );
  }

  /**
   * 根据任务模板的重复配置批量生成任务实例
   * @param taskTemplate 任务模板
   * @param maxInstances 最大生成数量（默认100）
   * @returns 生成的 TaskInstance 实体数组
   * @example
   * ```ts
   * const instances = service.generateInstancesFromTemplate(template, 10);
   * ```
   */
  generateInstancesFromTemplate(
    taskTemplate: TaskTemplate,
    maxInstances: number = 100,
  ): TaskInstance[] {
    const instances: TaskInstance[] = [];
    const { timeConfig } = taskTemplate;

    // 非重复任务直接生成一个实例
    if (timeConfig.recurrence.type === 'none') {
      return [this.createInstanceFromTemplate(taskTemplate)];
    }

    let currentTime = timeConfig.baseTime.start;
    let count = 0;
    const now = new Date();

    while (count < maxInstances) {
      const nextTime = TaskTimeUtils.getNextOccurrence(timeConfig, currentTime);
      if (!nextTime) break;
      if (this.shouldStopGeneration(timeConfig, nextTime, count)) break;

      // 只生成未来的实例
      if (nextTime.getTime() >= now.getTime()) {
        const endTime = timeConfig.baseTime.end
          ? addMinutes(
              nextTime,
              TaskTimeUtils.getMinutesBetween(timeConfig.baseTime.start, timeConfig.baseTime.end),
            )
          : undefined;
        instances.push(this.createInstanceFromTemplate(taskTemplate, nextTime, { endTime }));
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
   * @param taskTemplate 任务模板
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 生成的 TaskInstance 实体数组
   * @example
   * ```ts
   * const arr = service.generateInstancesInRange(template, start, end);
   * ```
   */
  generateInstancesInRange(
    taskTemplate: TaskTemplate,
    startDate: Date,
    endDate: Date,
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
    if (currentTime.getTime() < startDate.getTime()) {
      currentTime = startDate;
    }

    let count = 0;
    const maxInstances = 1000;

    while (currentTime.getTime() <= endDate.getTime() && count < maxInstances) {
      const nextTime = TaskTimeUtils.getNextOccurrence(timeConfig, currentTime);
      if (!nextTime || nextTime.getTime() > endDate.getTime()) break;
      if (this.shouldStopGeneration(timeConfig, nextTime, count)) break;

      const endTime = timeConfig.baseTime.end
        ? addMinutes(
            nextTime,
            TaskTimeUtils.getMinutesBetween(timeConfig.baseTime.start, timeConfig.baseTime.end),
          )
        : undefined;

      instances.push(this.createInstanceFromTemplate(taskTemplate, nextTime, { endTime }));
      currentTime = nextTime;
      count++;
    }

    return instances;
  }

  /**
   * 验证任务实例状态转换是否合法
   * @param taskInstance 任务实例
   * @param newStatus 新状态字符串（"pending"|"inProgress"|"completed"|"cancelled"|"overdue"）
   * @returns 是否允许状态转换
   * @example
   * ```ts
   * if (service.canChangeStatus(instance, "completed")) { ... }
   * ```
   */
  canChangeStatus(taskInstance: TaskInstance, newStatus: string): boolean {
    const currentStatus = taskInstance.status;
    const allowedTransitions: Record<
      'pending' | 'inProgress' | 'completed' | 'cancelled' | 'overdue',
      string[]
    > = {
      pending: ['inProgress', 'cancelled'],
      inProgress: ['completed', 'cancelled', 'pending'],
      completed: ['pending'],
      cancelled: ['pending'],
      overdue: ['pending', 'inProgress', 'cancelled'],
    };
    return allowedTransitions[currentStatus]?.includes(newStatus) ?? false;
  }

  /**
   * 检查任务实例之间的时间冲突
   * @param taskInstances 现有任务实例数组
   * @param newTaskInstance 新任务实例
   * @returns 冲突的任务实例数组
   * @example
   * ```ts
   * const conflicts = service.checkTimeConflicts(existing, newInstance);
   * ```
   */
  checkTimeConflicts(taskInstances: TaskInstance[], newTaskInstance: TaskInstance): TaskInstance[] {
    return taskInstances.filter((taskInstance) => {
      if (taskInstance.uuid === newTaskInstance.uuid) return false;
      if (taskInstance.status === 'completed' || taskInstance.status === 'cancelled') return false;
      return this.hasTimeOverlap(taskInstance, newTaskInstance);
    });
  }

  /**
   * 验证任务实例的有效性
   * @param taskInstance 任务实例
   * @returns 验证结果对象 { valid: boolean, errors: string[] }
   * @example
   * ```ts
   * const result = service.validateInstance(instance);
   * if (!result.valid) alert(result.errors.join('\n'));
   * ```
   * 返回示例：
   * { valid: false, errors: ['任务标题不能为空', ...] }
   */
  validateInstance(taskInstance: TaskInstance): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!taskInstance.title.trim()) {
      errors.push('任务标题不能为空');
    }
    if (taskInstance.timeConfig.type === 'timeRange' && !taskInstance.timeConfig.endTime) {
      errors.push('时间段类型的任务必须设置结束时间');
    }
    if (
      taskInstance.timeConfig.endTime &&
      taskInstance.timeConfig.endTime.getTime() <= taskInstance.timeConfig.scheduledTime.getTime()
    ) {
      errors.push('结束时间必须晚于开始时间');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 重新调度任务实例
   * @param taskInstance 任务实例
   * @param newScheduledTime 新的计划时间
   * @param newEndTime 新的结束时间（可选）
   * @throws 重新调度失败时抛出错误
   * @example
   * ```ts
   * service.rescheduleInstance(instance, newTime, newEndTime);
   * ```
   */
  rescheduleInstance(taskInstance: TaskInstance, newScheduledTime: Date, newEndTime?: Date): void {
    try {
      taskInstance.reschedule(newScheduledTime, newEndTime);
    } catch (error) {
      throw new Error(`重新调度失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 检查两个任务实例是否有时间重叠
   * @param taskInstance1 任务实例1
   * @param taskInstance2 任务实例2
   * @returns 是否有时间重叠
   * @example
   * ```ts
   * if (service.hasTimeOverlap(a, b)) { ... }
   * ```
   */
  private hasTimeOverlap(taskInstance1: TaskInstance, taskInstance2: TaskInstance): boolean {
    const start1 = taskInstance1.timeConfig.scheduledTime.getTime();
    const end1 =
      taskInstance1.timeConfig.endTime?.getTime() ||
      start1 + (taskInstance1.timeConfig.estimatedDuration || 60) * 60 * 1000;
    const start2 = taskInstance2.timeConfig.scheduledTime.getTime();
    const end2 =
      taskInstance2.timeConfig.endTime?.getTime() ||
      start2 + (taskInstance2.timeConfig.estimatedDuration || 60) * 60 * 1000;
    return start1 < end2 && start2 < end1;
  }

  /**
   * 判断是否应该停止生成任务实例（内部辅助方法）
   * @param timeConfig 时间配置
   * @param nextTime 下一个时间点
   * @param count 当前生成数量
   * @returns 是否应该停止生成
   */
  private shouldStopGeneration(timeConfig: any, nextTime: Date, count: number): boolean {
    if (
      timeConfig.recurrence.endCondition.type === 'date' &&
      timeConfig.recurrence.endCondition.endDate &&
      nextTime.getTime() > timeConfig.recurrence.endCondition.endDate.getTime()
    ) {
      return true;
    }
    if (
      timeConfig.recurrence.endCondition.type === 'count' &&
      timeConfig.recurrence.endCondition.count &&
      count >= timeConfig.recurrence.endCondition.count
    ) {
      return true;
    }
    return false;
  }
}

/**
 * 单例导出，方便直接使用
 * @example
 * import { taskInstanceService } from '.../taskInstanceService'
 * taskInstanceService.createInstanceFromTemplate(...)
 */
export const taskInstanceService = new TaskInstanceService();
