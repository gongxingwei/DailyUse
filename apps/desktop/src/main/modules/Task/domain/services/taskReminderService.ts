import { TaskInstance } from '../aggregates/taskInstance';
import { ApiResponse } from '../../../../../common/shared/types/response';
import { scheduleService } from '../../../../shared/schedule/services/scheduleService';
import type { TaskReminderConfig } from '@common/modules/task/types/task';
import { addMinutes } from 'date-fns';

/**
 * 任务提醒服务
 *
 * 职责：
 * - 为 TaskInstance 创建和管理提醒调度
 * - 计算具体的提醒时间
 * - 处理提醒的取消和重新创建
 *
 * 设计说明：
 * - TaskTemplate：定义提醒的配置模板（如：提前15分钟提醒）
 * - TaskInstance：使用模板配置为具体时间创建实际的提醒（如：2025-07-01 09:45 提醒）
 * - 此服务专门处理 TaskInstance 的具体提醒，因为只有实例才有确切的执行时间
 */
export class TaskReminderService {
  private static instance: TaskReminderService;
  private activeReminders = new Map<string, Date[]>();

  /**
   * 获取单例实例
   */
  static getInstance(): TaskReminderService {
    if (!this.instance) {
      this.instance = new TaskReminderService();
    }
    return this.instance;
  }

  /**
   * 为 TaskInstance 创建所有提醒
   *
   * 根据 TaskInstance 的提醒配置，为每个启用的 alert 创建具体的提醒调度。
   * TaskInstance 包含从 TaskTemplate 继承的提醒配置，但具有确切的执行时间。
   *
   * @param taskInstance 任务实例，包含具体的执行时间和提醒配置
   * @returns Promise<ApiResponse<void>> 操作结果响应
   * @example
   * ```ts
   * const result = await taskReminderService.createTaskReminders(instance);
   * // result: { success: true, message: "...", data?: void }
   * ```
   */
  async createTaskReminders(taskInstance: TaskInstance): Promise<ApiResponse<void>> {
    try {
      if (!taskInstance.reminderStatus.enabled || !taskInstance.reminderStatus.alerts.length) {
        return {
          success: true,
          message: '任务实例未启用提醒',
        };
      }

      const reminderTimes: Date[] = [];

      for (const alert of taskInstance.reminderStatus.alerts) {
        if (alert.status === 'pending') {
          const response = await this.createSingleReminder(taskInstance, alert);
          if (!response) {
            console.warn(
              `创建提醒失败: 任务实例 ${taskInstance.uuid} 的提醒 ${alert.uuid} 无效或已过期`,
            );
            continue;
          }

          if (response.reminderTime) {
            reminderTimes.push(response.reminderTime);
          }
        }
      }

      this.activeReminders.set(taskInstance.uuid, reminderTimes);

      return {
        success: true,
        message: `成功为任务实例 ${taskInstance.uuid} 创建 ${reminderTimes.length} 个提醒`,
      };
    } catch (error) {
      return {
        success: false,
        message: `创建任务提醒失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 创建单个提醒调度
   *
   * 为 TaskInstance 的单个 alert 配置创建具体的提醒调度。
   * 将 alert 配置（相对时间或绝对时间）转换为具体的调度任务。
   *
   * @param taskInstance 任务实例
   * @param alert 提醒 alert 配置
   * @returns 创建的提醒信息或 null（如果提醒时间已过期）
   * @example
   * ```ts
   * const info = await service.createSingleReminder(instance, alert);
   * // info: { reminderId, reminderTime } | null
   * ```
   */
  private async createSingleReminder(
    taskInstance: TaskInstance,
    alert: TaskInstance['reminderStatus']['alerts'][number],
  ): Promise<{
    reminderId: string;
    reminderTime: Date;
  } | null> {
    try {
      const reminderId = `task-reminder-${taskInstance.uuid}-${alert.uuid}`;

      const reminderTime = this.calculateReminderTime(
        alert.alertConfig,
        taskInstance.timeConfig.scheduledTime,
      );

      const now = new Date();
      if (reminderTime.getTime() <= now.getTime()) {
        console.warn(`提醒时间 ${reminderTime.toISOString()} 已过期，跳过创建`);
        return null;
      }

      await scheduleService.createSchedule({
        uuid: reminderId,
        dateTime: reminderTime,
        task: {
          type: 'taskReminder',
          payload: {
            taskId: taskInstance.uuid,
            alertId: alert.uuid,
            title: `任务提醒: ${taskInstance.title}`,
            body: this.generateReminderMessage(taskInstance, reminderTime),
            reminderTime: reminderTime.toISOString(),
            taskTime: taskInstance.timeConfig.scheduledTime.toISOString(),
            alertType: alert.alertConfig.type,
            customMessage: alert.alertConfig.message,
          },
        },
      });

      return {
        reminderId,
        reminderTime,
      };
    } catch (error) {
      console.error('创建单个提醒失败:', error);
      return null;
    }
  }

  /**
   * 计算提醒的具体时间
   *
   * 根据 alert 配置计算实际的提醒时间：
   * - 绝对时间：使用配置中指定的具体时间点
   * - 相对时间：基于 TaskInstance 的执行时间前推指定分钟数
   *
   * @param alertConfig 提醒配置
   * @param taskScheduledTime TaskInstance 的计划执行时间
   * @returns 计算出的具体提醒时间
   * @example
   * ```ts
   * const time = service.calculateReminderTime(alertConfig, scheduledTime);
   * ```
   */
  private calculateReminderTime(
    alertConfig: TaskReminderConfig['alerts'][number],
    taskScheduledTime: Date,
  ): Date {
    if (alertConfig.timing.type === 'absolute' && alertConfig.timing.absoluteTime) {
      return alertConfig.timing.absoluteTime;
    } else if (alertConfig.timing.type === 'relative' && alertConfig.timing.minutesBefore) {
      return addMinutes(taskScheduledTime, -alertConfig.timing.minutesBefore);
    } else {
      return taskScheduledTime;
    }
  }

  /**
   * 生成提醒消息内容
   *
   * 基于 TaskInstance 的信息生成用户友好的提醒消息。
   *
   * @param task 任务实例
   * @param reminderTime 提醒时间
   * @returns 格式化的提醒消息
   * @example
   * ```ts
   * const msg = service.generateReminderMessage(instance, reminderTime);
   * ```
   */
  private generateReminderMessage(task: TaskInstance, reminderTime: Date): string {
    const timeDiff = task.scheduledTime.getTime() - reminderTime.getTime();
    const minutesBefore = Math.round(timeDiff / (1000 * 60));

    const timeConfig = task.timeConfig;
    let timeStr = '';

    if (timeConfig.type === 'allDay') {
      timeStr = '今日';
    } else if (timeConfig.type === 'timed') {
      timeStr = `${task.scheduledTime.getHours()}:${task.scheduledTime.getMinutes().toString().padStart(2, '0')}`;
    } else if (timeConfig.type === 'timeRange' && timeConfig.endTime) {
      const startTime = task.scheduledTime;
      const endTime = timeConfig.endTime;
      timeStr = `${startTime?.getHours()}:${startTime
        ?.getMinutes()
        ?.toString()
        .padStart(2, '0')} - ${endTime?.getHours()}:${endTime
        ?.getMinutes()
        ?.toString()
        .padStart(2, '0')}`;
    }

    return `任务 "${task.title}" 将在 ${minutesBefore} 分钟后 (${timeStr}) 开始。`;
  }

  /**
   * 取消指定 TaskInstance 的所有提醒
   *
   * 当 TaskInstance 被删除、取消或重新调度时，需要取消其相关的所有提醒。
   *
   * @param taskInstanceId 任务实例ID
   * @returns Promise<ApiResponse<void>> 操作结果响应
   * @example
   * ```ts
   * const result = await service.cancelTaskInstanceReminders(instanceId);
   * // result: { success: true, message: "...", data?: void }
   * ```
   */
  async cancelTaskInstanceReminders(taskInstanceId: string): Promise<ApiResponse<void>> {
    try {
      const reminderTimes = this.activeReminders.get(taskInstanceId);
      if (!reminderTimes) {
        return {
          success: true,
          message: `任务实例 ${taskInstanceId} 没有活跃的提醒`,
          data: undefined,
        };
      } else {
        for (const reminderTime of reminderTimes) {
          const reminderId = `task-reminder-${taskInstanceId}-${reminderTime.getTime()}`;
          await scheduleService.cancelSchedule(reminderId);
        }

        this.activeReminders.delete(taskInstanceId);
        return {
          success: true,
          message: `成功取消任务实例 ${taskInstanceId} 的所有提醒`,
          data: undefined,
        };
      }
    } catch (error) {
      console.error(`取消任务实例 ${taskInstanceId} 的提醒失败:`, error);
      return {
        success: false,
        message: `取消任务实例 ${taskInstanceId} 的提醒失败: ${
          error instanceof Error ? error.message : '未知错误'
        }`,
        data: undefined,
      };
    }
  }

  /**
   * 重新初始化所有 TaskInstance 的提醒
   *
   * 用于系统重启或批量更新时重新创建所有提醒调度。
   * 会先清除所有现有提醒，然后为每个 TaskInstance 重新创建。
   *
   * @param instances 需要重新初始化提醒的 TaskInstance 列表
   * @returns Promise<void>
   * @example
   * ```ts
   * await service.reinitializeAllReminders(instances);
   * ```
   */
  async reinitializeAllReminders(instances: TaskInstance[]): Promise<void> {
    for (const [taskId] of this.activeReminders) {
      await this.cancelTaskInstanceReminders(taskId);
    }

    for (const instance of instances) {
      await this.createTaskReminders(instance);
    }
  }

  /**
   * 获取即将到来的提醒列表
   *
   * 查找指定时间范围内即将触发的 TaskInstance 提醒。
   * 用于预览功能或提前通知用户。
   *
   * @param withinMinutes 时间范围（分钟），默认60分钟
   * @returns 即将到来的提醒列表，按时间排序
   * @example
   * ```ts
   * const list = service.getUpcomingReminders(30);
   * // list: [{ taskId, reminderTime, minutesUntil }, ...]
   * ```
   */
  getUpcomingReminders(withinMinutes: number = 60): Array<{
    taskId: string;
    reminderTime: Date;
    minutesUntil: number;
  }> {
    const now = new Date();
    const cutoffTime = now.getTime() + withinMinutes * 60 * 1000;
    const upcoming: Array<{
      taskId: string;
      reminderTime: Date;
      minutesUntil: number;
    }> = [];

    for (const [taskId, reminderTimes] of this.activeReminders) {
      for (const reminderTime of reminderTimes) {
        if (reminderTime.getTime() > now.getTime() && reminderTime.getTime() <= cutoffTime) {
          upcoming.push({
            taskId,
            reminderTime,
            minutesUntil: Math.round((reminderTime.getTime() - now.getTime()) / (1000 * 60)),
          });
        }
      }
    }

    return upcoming.sort((a, b) => a.reminderTime.getTime() - b.reminderTime.getTime());
  }
}

/**
 * 单例导出，方便直接使用
 * @example
 * import { taskReminderService } from '.../taskReminderService'
 * taskReminderService.createTaskReminders(...)
 */
export const taskReminderService = TaskReminderService.getInstance();
