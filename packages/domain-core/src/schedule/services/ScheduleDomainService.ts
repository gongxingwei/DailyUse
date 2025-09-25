/**
 * Schedule 领域服务
 * @description 处理Schedule模块的核心业务逻辑
 * @author DailyUse Team
 * @date 2025-01-09
 */

import { ScheduleTaskType, SchedulePriority, AlertMethod } from '@dailyuse/contracts';

import type { IScheduleTask, IAlertConfig, IScheduleTaskPayload } from '@dailyuse/contracts';
import { ScheduleTask } from '../aggregates/ScheduleTask';

/**
 * Schedule 领域服务
 * 提供Schedule模块的核心业务逻辑和规则验证
 */
export class ScheduleDomainService {
  /**
   * 验证任务调度时间是否合理
   */
  validateScheduleTime(scheduledTime: Date): { isValid: boolean; message?: string } {
    const now = new Date();

    // 检查是否是过去的时间
    if (scheduledTime <= now) {
      // 允许一定的容差（比如5分钟内）
      const timeDiff = now.getTime() - scheduledTime.getTime();
      if (timeDiff > 5 * 60 * 1000) {
        // 5分钟
        return {
          isValid: false,
          message: '调度时间不能早于当前时间超过5分钟',
        };
      }
    }

    // 检查是否太远的将来（比如10年后）
    const maxFutureTime = new Date();
    maxFutureTime.setFullYear(maxFutureTime.getFullYear() + 10);
    if (scheduledTime > maxFutureTime) {
      return {
        isValid: false,
        message: '调度时间不能超过10年',
      };
    }

    return { isValid: true };
  }

  /**
   * 验证提醒配置是否合理
   */
  validateAlertConfig(alertConfig: IAlertConfig): { isValid: boolean; message?: string } {
    // 检查提醒方式是否为空
    if (!alertConfig.methods || alertConfig.methods.length === 0) {
      return {
        isValid: false,
        message: '至少需要选择一种提醒方式',
      };
    }

    // 检查声音配置
    if (alertConfig.methods.includes(AlertMethod.SOUND)) {
      if (
        alertConfig.soundVolume &&
        (alertConfig.soundVolume < 0 || alertConfig.soundVolume > 100)
      ) {
        return {
          isValid: false,
          message: '声音音量必须在0-100之间',
        };
      }
    }

    // 检查弹窗配置
    if (alertConfig.methods.includes(AlertMethod.POPUP)) {
      if (alertConfig.popupDuration && alertConfig.popupDuration <= 0) {
        return {
          isValid: false,
          message: '弹窗持续时间必须大于0',
        };
      }
    }

    // 检查延后配置
    if (alertConfig.allowSnooze && alertConfig.snoozeOptions) {
      for (const option of alertConfig.snoozeOptions) {
        if (option <= 0) {
          return {
            isValid: false,
            message: '延后选项必须大于0分钟',
          };
        }
      }
    }

    return { isValid: true };
  }

  /**
   * 计算任务优先级权重
   * 用于任务队列的排序
   */
  calculatePriorityWeight(priority: SchedulePriority): number {
    switch (priority) {
      case SchedulePriority.URGENT:
        return 1000;
      case SchedulePriority.HIGH:
        return 750;
      case SchedulePriority.NORMAL:
        return 500;
      case SchedulePriority.LOW:
        return 250;
      default:
        return 500;
    }
  }

  /**
   * 检查任务是否可以合并
   * 用于优化相同类型的提醒
   */
  canMergeTasks(task1: ScheduleTask, task2: ScheduleTask): boolean {
    // 相同类型的任务
    if (task1.taskType !== task2.taskType) return false;

    // 相同创建者
    if (task1.createdBy !== task2.createdBy) return false;

    // 时间间隔在一定范围内（比如5分钟）
    const timeDiff = Math.abs(task1.scheduledTime.getTime() - task2.scheduledTime.getTime());
    if (timeDiff > 5 * 60 * 1000) return false;

    // 相同优先级
    if (task1.priority !== task2.priority) return false;

    return true;
  }

  /**
   * 创建快速提醒任务
   * 用于其他模块快速创建提醒
   */
  createQuickReminder(params: {
    title: string;
    message: string;
    reminderTime: Date;
    createdBy: string;
    taskType?: ScheduleTaskType;
    priority?: SchedulePriority;
    alertMethods?: AlertMethod[];
    sourceId?: string; // 来源任务/目标ID
  }): ScheduleTask {
    const alertConfig: IAlertConfig = {
      methods: params.alertMethods || [AlertMethod.POPUP, AlertMethod.SOUND],
      allowSnooze: true,
      snoozeOptions: [5, 10, 15, 30],
      popupDuration: 30,
      soundVolume: 80,
    };

    const payload: IScheduleTaskPayload = {
      type: params.taskType || ScheduleTaskType.GENERAL_REMINDER,
      data: {
        title: params.title,
        message: params.message,
        sourceId: params.sourceId,
      },
    };

    return ScheduleTask.create({
      name: params.title,
      taskType: params.taskType || ScheduleTaskType.GENERAL_REMINDER,
      payload,
      scheduledTime: params.reminderTime,
      createdBy: params.createdBy,
      description: params.message,
      priority: params.priority || SchedulePriority.NORMAL,
      alertConfig,
    });
  }

  /**
   * 创建任务提醒
   * 专门用于Task模块的提醒创建
   */
  createTaskReminder(params: {
    taskId: string;
    taskTitle: string;
    reminderTime: Date;
    createdBy: string;
    alertMethods?: AlertMethod[];
    priority?: SchedulePriority;
  }): ScheduleTask {
    return this.createQuickReminder({
      title: `任务提醒: ${params.taskTitle}`,
      message: `您有一个任务需要处理: ${params.taskTitle}`,
      reminderTime: params.reminderTime,
      createdBy: params.createdBy,
      taskType: ScheduleTaskType.TASK_REMINDER,
      priority: params.priority,
      alertMethods: params.alertMethods,
      sourceId: params.taskId,
    });
  }

  /**
   * 创建目标提醒
   * 专门用于Goal模块的提醒创建
   */
  createGoalReminder(params: {
    goalId: string;
    goalTitle: string;
    reminderTime: Date;
    createdBy: string;
    alertMethods?: AlertMethod[];
    priority?: SchedulePriority;
  }): ScheduleTask {
    return this.createQuickReminder({
      title: `目标提醒: ${params.goalTitle}`,
      message: `您需要关注目标进展: ${params.goalTitle}`,
      reminderTime: params.reminderTime,
      createdBy: params.createdBy,
      taskType: ScheduleTaskType.GOAL_REMINDER,
      priority: params.priority,
      alertMethods: params.alertMethods,
      sourceId: params.goalId,
    });
  }

  /**
   * 批量创建提醒
   * 用于一次性创建多个相关的提醒
   */
  createBatchReminders(params: {
    sourceId: string;
    sourceType: ScheduleTaskType;
    title: string;
    createdBy: string;
    reminderTimes: Date[];
    alertMethods?: AlertMethod[];
    priority?: SchedulePriority;
  }): ScheduleTask[] {
    return params.reminderTimes.map((time, index) => {
      const title =
        params.reminderTimes.length > 1 ? `${params.title} (第${index + 1}次提醒)` : params.title;

      return this.createQuickReminder({
        title,
        message: `这是您的${params.sourceType === ScheduleTaskType.TASK_REMINDER ? '任务' : '目标'}提醒`,
        reminderTime: time,
        createdBy: params.createdBy,
        taskType: params.sourceType,
        priority: params.priority,
        alertMethods: params.alertMethods,
        sourceId: params.sourceId,
      });
    });
  }

  /**
   * 验证任务载荷数据
   */
  validateTaskPayload(payload: IScheduleTaskPayload): { isValid: boolean; message?: string } {
    if (!payload.type) {
      return { isValid: false, message: '任务载荷必须包含类型' };
    }

    if (!payload.data) {
      return { isValid: false, message: '任务载荷必须包含数据' };
    }

    // 根据不同类型验证载荷数据
    switch (payload.type) {
      case ScheduleTaskType.TASK_REMINDER:
      case ScheduleTaskType.GOAL_REMINDER:
        if (!payload.data.sourceId) {
          return {
            isValid: false,
            message: `${payload.type}类型的载荷必须包含sourceId`,
          };
        }
        break;
    }

    return { isValid: true };
  }

  /**
   * 生成任务标签
   * 根据任务类型和内容自动生成标签
   */
  generateTaskTags(task: ScheduleTask): string[] {
    const tags: string[] = [];

    // 基于任务类型的标签
    tags.push(task.taskType.toLowerCase());

    // 基于优先级的标签
    tags.push(`priority-${task.priority.toLowerCase()}`);

    // 基于创建者的标签
    if (task.createdBy !== 'system') {
      tags.push('user-created');
    } else {
      tags.push('system-created');
    }

    // 基于提醒方式的标签
    if (task.alertConfig.methods.includes(AlertMethod.POPUP)) {
      tags.push('popup-reminder');
    }
    if (task.alertConfig.methods.includes(AlertMethod.SOUND)) {
      tags.push('sound-reminder');
    }

    return tags;
  }

  /**
   * 检查任务冲突
   * 检查是否存在时间冲突的高优先级任务
   */
  checkTaskConflicts(
    newTask: ScheduleTask,
    existingTasks: ScheduleTask[],
  ): { hasConflict: boolean; conflictingTasks: ScheduleTask[] } {
    const conflictingTasks: ScheduleTask[] = [];
    const newTaskTime = newTask.scheduledTime.getTime();

    // 定义冲突时间窗口（分钟）
    const conflictWindow = 5 * 60 * 1000; // 5分钟

    for (const existingTask of existingTasks) {
      if (existingTask.uuid === newTask.uuid) continue;

      const existingTaskTime = existingTask.scheduledTime.getTime();
      const timeDiff = Math.abs(newTaskTime - existingTaskTime);

      // 在时间窗口内且为高优先级任务
      if (
        timeDiff <= conflictWindow &&
        (existingTask.priority === SchedulePriority.URGENT ||
          existingTask.priority === SchedulePriority.HIGH)
      ) {
        conflictingTasks.push(existingTask);
      }
    }

    return {
      hasConflict: conflictingTasks.length > 0,
      conflictingTasks,
    };
  }
}
