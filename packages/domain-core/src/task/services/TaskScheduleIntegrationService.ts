/**
 * Task模块Schedule集成服务
 * @description 为Task模块提供与Schedule模块集成的接口
 * @author DailyUse Team
 * @date 2025-01-09
 */

import { eventBus } from '@dailyuse/utils';
import { AlertMethod, SchedulePriority } from '@dailyuse/contracts';

/**
 * 任务提醒配置接口
 */
export interface TaskReminderConfig {
  enabled: boolean;
  alerts: Array<{
    uuid: string;
    alertTime: string; // ISO时间字符串
    alertMethods: AlertMethod[];
    message?: string;
    priority?: SchedulePriority;
  }>;
}

/**
 * 任务调度集成服务
 * 为Task模块提供与Schedule模块的集成功能
 */
export class TaskScheduleIntegrationService {
  /**
   * 为任务实例创建提醒调度
   * 当创建TaskInstance时调用
   */
  static async createTaskReminders(params: {
    taskInstance: {
      uuid: string;
      title: string;
      scheduledTime: string;
      reminderConfig?: TaskReminderConfig;
    };
    accountUuid: string;
  }): Promise<{ success: boolean; createdReminders: number; message?: string }> {
    try {
      const { taskInstance, accountUuid } = params;

      // 发布任务实例创建事件，Schedule模块会监听并处理
      eventBus.emit('task:instance-created', {
        taskInstance,
        accountUuid,
      });

      const reminderCount = taskInstance.reminderConfig?.alerts.length || 0;
      console.log(`[TaskSchedule] 已请求为任务 ${taskInstance.uuid} 创建 ${reminderCount} 个提醒`);

      return {
        success: true,
        createdReminders: reminderCount,
      };
    } catch (error) {
      console.error('[TaskSchedule] 创建任务提醒失败:', error);
      return {
        success: false,
        createdReminders: 0,
        message: error instanceof Error ? error.message : '创建提醒失败',
      };
    }
  }

  /**
   * 更新任务提醒调度
   * 当更新TaskInstance时调用
   */
  static async updateTaskReminders(params: {
    taskInstance: {
      uuid: string;
      title: string;
      scheduledTime: string;
      reminderConfig?: TaskReminderConfig;
    };
    accountUuid: string;
    changes: string[]; // 变更的字段列表
  }): Promise<{ success: boolean; message?: string }> {
    try {
      const { taskInstance, accountUuid, changes } = params;

      // 发布任务实例更新事件
      eventBus.emit('task:instance-updated', {
        taskInstance,
        accountUuid,
        changes,
      });

      console.log(`[TaskSchedule] 已请求更新任务 ${taskInstance.uuid} 的提醒`);

      return { success: true };
    } catch (error) {
      console.error('[TaskSchedule] 更新任务提醒失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '更新提醒失败',
      };
    }
  }

  /**
   * 取消任务的所有提醒
   * 当删除TaskInstance时调用
   */
  static async cancelTaskReminders(params: {
    taskInstanceUuid: string;
    accountUuid: string;
  }): Promise<{ success: boolean; message?: string }> {
    try {
      const { taskInstanceUuid, accountUuid } = params;

      // 发布任务实例删除事件
      eventBus.emit('task:instance-deleted', {
        taskInstanceUuid,
        accountUuid,
      });

      console.log(`[TaskSchedule] 已请求取消任务 ${taskInstanceUuid} 的所有提醒`);

      return { success: true };
    } catch (error) {
      console.error('[TaskSchedule] 取消任务提醒失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '取消提醒失败',
      };
    }
  }

  /**
   * 标记任务完成并取消提醒
   * 当完成TaskInstance时调用
   */
  static async completeTaskReminders(params: {
    taskInstanceUuid: string;
    completedAt: Date;
    accountUuid: string;
  }): Promise<{ success: boolean; message?: string }> {
    try {
      const { taskInstanceUuid, completedAt, accountUuid } = params;

      // 发布任务完成事件
      eventBus.emit('task:instance-completed', {
        taskInstanceUuid,
        completedAt: completedAt.toISOString(),
        accountUuid,
      });

      console.log(`[TaskSchedule] 任务 ${taskInstanceUuid} 已完成，取消相关提醒`);

      return { success: true };
    } catch (error) {
      console.error('[TaskSchedule] 处理任务完成失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '处理任务完成失败',
      };
    }
  }

  /**
   * 更新任务状态
   * 当任务状态发生变化时调用
   */
  static async updateTaskStatus(params: {
    taskInstanceUuid: string;
    oldStatus: string;
    newStatus: string;
    accountUuid: string;
  }): Promise<{ success: boolean; message?: string }> {
    try {
      const { taskInstanceUuid, oldStatus, newStatus, accountUuid } = params;

      // 发布任务状态变更事件
      eventBus.emit('task:status-changed', {
        taskInstanceUuid,
        oldStatus,
        newStatus,
        accountUuid,
      });

      console.log(
        `[TaskSchedule] 任务 ${taskInstanceUuid} 状态从 ${oldStatus} 变更为 ${newStatus}`,
      );

      return { success: true };
    } catch (error) {
      console.error('[TaskSchedule] 更新任务状态失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '更新任务状态失败',
      };
    }
  }

  /**
   * 创建快速提醒
   * 为任务创建一个简单的提醒，不依赖TaskInstance
   */
  static async createQuickTaskReminder(params: {
    taskId: string;
    taskTitle: string;
    message: string;
    reminderTime: Date;
    accountUuid: string;
    priority?: SchedulePriority;
    alertMethods?: AlertMethod[];
  }): Promise<{ success: boolean; reminderId?: string; message?: string }> {
    try {
      // 使用eventBus的invoke方法进行请求-响应通信
      const result = await eventBus.invoke('schedule:create-task-reminder', {
        taskId: params.taskId,
        taskTitle: params.taskTitle,
        reminderTime: params.reminderTime,
        createdBy: params.accountUuid,
        priority: params.priority || SchedulePriority.NORMAL,
        alertMethods: params.alertMethods || [AlertMethod.POPUP],
      });

      if (result.success) {
        console.log(`[TaskSchedule] 快速提醒已创建: ${result.taskId}`);
        return {
          success: true,
          reminderId: result.taskId,
        };
      } else {
        return {
          success: false,
          message: result.message,
        };
      }
    } catch (error) {
      console.error('[TaskSchedule] 创建快速提醒失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '创建快速提醒失败',
      };
    }
  }

  /**
   * 批量创建任务提醒
   * 为一个任务创建多个不同时间的提醒
   */
  static async createBatchTaskReminders(params: {
    taskId: string;
    taskTitle: string;
    reminders: Array<{
      reminderTime: Date;
      message: string;
      priority?: SchedulePriority;
      alertMethods?: AlertMethod[];
    }>;
    accountUuid: string;
  }): Promise<{
    success: boolean;
    createdCount: number;
    failedCount: number;
    results: Array<{ success: boolean; reminderId?: string; error?: string }>;
  }> {
    const results: Array<{ success: boolean; reminderId?: string; error?: string }> = [];
    let createdCount = 0;
    let failedCount = 0;

    for (const reminder of params.reminders) {
      try {
        const result = await this.createQuickTaskReminder({
          taskId: params.taskId,
          taskTitle: params.taskTitle,
          message: reminder.message,
          reminderTime: reminder.reminderTime,
          accountUuid: params.accountUuid,
          priority: reminder.priority,
          alertMethods: reminder.alertMethods,
        });

        results.push(result);

        if (result.success) {
          createdCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : '未知错误',
        });
        failedCount++;
      }
    }

    return {
      success: createdCount > 0,
      createdCount,
      failedCount,
      results,
    };
  }

  /**
   * 延后任务提醒
   * 当用户选择延后提醒时调用
   */
  static async snoozeTaskReminder(params: {
    reminderId: string;
    delayMinutes: number;
  }): Promise<{ success: boolean; message?: string }> {
    try {
      const result = await eventBus.invoke('schedule:snooze-reminder', {
        taskId: params.reminderId,
        delayMinutes: params.delayMinutes,
      });

      if (result.success) {
        console.log(`[TaskSchedule] 提醒 ${params.reminderId} 已延后 ${params.delayMinutes} 分钟`);
      }

      return result;
    } catch (error) {
      console.error('[TaskSchedule] 延后提醒失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '延后提醒失败',
      };
    }
  }

  /**
   * 确认任务提醒
   * 当用户确认收到提醒时调用
   */
  static async acknowledgeTaskReminder(params: {
    reminderId: string;
  }): Promise<{ success: boolean; message?: string }> {
    try {
      const result = await eventBus.invoke('schedule:acknowledge-reminder', {
        taskId: params.reminderId,
      });

      if (result.success) {
        console.log(`[TaskSchedule] 提醒 ${params.reminderId} 已确认`);
      }

      return result;
    } catch (error) {
      console.error('[TaskSchedule] 确认提醒失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '确认提醒失败',
      };
    }
  }

  /**
   * 生成任务提醒配置
   * 根据任务信息自动生成合理的提醒配置
   */
  static generateReminderConfig(params: {
    taskScheduledTime: Date;
    taskPriority?: SchedulePriority;
    taskDuration?: number; // 分钟
  }): TaskReminderConfig {
    const { taskScheduledTime, taskPriority = SchedulePriority.NORMAL, taskDuration = 30 } = params;
    const alerts: TaskReminderConfig['alerts'] = [];

    // 根据优先级决定提醒策略
    switch (taskPriority) {
      case SchedulePriority.URGENT:
        // 紧急任务：任务前1小时、30分钟、15分钟提醒
        alerts.push(
          {
            uuid: crypto.randomUUID(),
            alertTime: new Date(taskScheduledTime.getTime() - 60 * 60 * 1000).toISOString(),
            alertMethods: [AlertMethod.POPUP, AlertMethod.SOUND, AlertMethod.SYSTEM_NOTIFICATION],
            priority: SchedulePriority.URGENT,
          },
          {
            uuid: crypto.randomUUID(),
            alertTime: new Date(taskScheduledTime.getTime() - 30 * 60 * 1000).toISOString(),
            alertMethods: [AlertMethod.POPUP, AlertMethod.SOUND],
            priority: SchedulePriority.URGENT,
          },
          {
            uuid: crypto.randomUUID(),
            alertTime: new Date(taskScheduledTime.getTime() - 15 * 60 * 1000).toISOString(),
            alertMethods: [AlertMethod.POPUP, AlertMethod.SOUND, AlertMethod.DESKTOP_FLASH],
            priority: SchedulePriority.URGENT,
          },
        );
        break;

      case SchedulePriority.HIGH:
        // 高优先级任务：任务前30分钟、15分钟提醒
        alerts.push(
          {
            uuid: crypto.randomUUID(),
            alertTime: new Date(taskScheduledTime.getTime() - 30 * 60 * 1000).toISOString(),
            alertMethods: [AlertMethod.POPUP, AlertMethod.SOUND],
            priority: SchedulePriority.HIGH,
          },
          {
            uuid: crypto.randomUUID(),
            alertTime: new Date(taskScheduledTime.getTime() - 15 * 60 * 1000).toISOString(),
            alertMethods: [AlertMethod.POPUP],
            priority: SchedulePriority.HIGH,
          },
        );
        break;

      case SchedulePriority.NORMAL:
        // 普通任务：任务前15分钟提醒
        alerts.push({
          uuid: crypto.randomUUID(),
          alertTime: new Date(taskScheduledTime.getTime() - 15 * 60 * 1000).toISOString(),
          alertMethods: [AlertMethod.POPUP],
          priority: SchedulePriority.NORMAL,
        });
        break;

      case SchedulePriority.LOW:
        // 低优先级任务：任务前5分钟提醒
        alerts.push({
          uuid: crypto.randomUUID(),
          alertTime: new Date(taskScheduledTime.getTime() - 5 * 60 * 1000).toISOString(),
          alertMethods: [AlertMethod.POPUP],
          priority: SchedulePriority.LOW,
        });
        break;
    }

    // 过滤掉已经过去的提醒时间
    const now = new Date();
    const validAlerts = alerts.filter((alert) => new Date(alert.alertTime) > now);

    return {
      enabled: validAlerts.length > 0,
      alerts: validAlerts,
    };
  }

  /**
   * 验证提醒配置
   * 检查提醒配置是否合理
   */
  static validateReminderConfig(config: TaskReminderConfig): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.enabled) {
      return { isValid: true, errors, warnings };
    }

    if (!config.alerts || config.alerts.length === 0) {
      errors.push('启用提醒时必须至少配置一个提醒Alert');
    }

    const now = new Date();
    let expiredCount = 0;

    for (const alert of config.alerts) {
      const alertTime = new Date(alert.alertTime);

      if (alertTime <= now) {
        expiredCount++;
      }

      if (!alert.alertMethods || alert.alertMethods.length === 0) {
        errors.push(`Alert ${alert.uuid} 必须至少选择一种提醒方式`);
      }

      if (!alert.uuid) {
        errors.push('每个Alert必须有唯一的UUID');
      }
    }

    if (expiredCount > 0) {
      warnings.push(`有 ${expiredCount} 个提醒时间已过期`);
    }

    if (config.alerts.length > 10) {
      warnings.push('提醒数量过多，建议不超过10个');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
