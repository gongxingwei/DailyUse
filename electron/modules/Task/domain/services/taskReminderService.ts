import { TaskInstance } from "../aggregates/taskInstance";
import { TResponse } from "../../../../../src/shared/types/response";
import { TimeUtils } from "../../../../../src/shared/utils/myDateTimeUtils";
import { scheduleService } from "../../../../shared/schedule/services/scheduleService";
import { TaskTimeUtils } from "../utils/taskTimeUtils";
import type { TaskReminderConfig } from "../types/task";

/**
 * 任务提醒服务
 * 
 * 职责：
 * - 为TaskInstance创建和管理提醒调度
 * - 计算具体的提醒时间
 * - 处理提醒的取消和重新创建
 * 
 * 设计说明：
 * - TaskTemplate：定义提醒的配置模板（如：提前15分钟提醒）
 * - TaskInstance：使用模板配置为具体时间创建实际的提醒（如：2025-07-01 09:45 提醒）
 * - 此服务专门处理TaskInstance的具体提醒，因为只有实例才有确切的执行时间
 */
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
   * 为TaskInstance创建所有提醒
   * 
   * 根据TaskInstance的提醒配置，为每个启用的alert创建具体的提醒调度。
   * TaskInstance包含从TaskTemplate继承的提醒配置，但具有确切的执行时间。
   * 
   * @param taskInstance - 任务实例，包含具体的执行时间和提醒配置
   * @returns 操作结果响应
   */
  async createTaskReminders(
    taskInstance: TaskInstance
  ): Promise<TResponse<void>> {
    try {
      if (
        !taskInstance.reminderStatus.enabled ||
        !taskInstance.reminderStatus.alerts.length
      ) {
        return {
          success: true,
          message: "任务实例未启用提醒",
        };
      }

      const reminderTimes: DateTime[] = [];

      for (const alert of taskInstance.reminderStatus.alerts) {
        if (alert.status === "pending") {
          const response = await this.createSingleReminder(taskInstance, alert);
          if (!response) {
            console.warn(
              `创建提醒失败: 任务实例 ${taskInstance.id} 的提醒 ${alert.id} 无效或已过期`
            );
            continue;
          }

          if (response.reminderTime) {
            reminderTimes.push(response.reminderTime);
          }
        }
      }

      this.activeReminders.set(taskInstance.id, reminderTimes);

      return {
        success: true,
        message: `成功为任务实例 ${taskInstance.id} 创建 ${reminderTimes.length} 个提醒`,
      };
    } catch (error) {
      return {
        success: false,
        message: `创建任务提醒失败: ${
          error instanceof Error ? error.message : "未知错误"
        }`,
      };
    }
  }

  /**
   * 创建单个提醒调度
   * 
   * 为TaskInstance的单个alert配置创建具体的提醒调度。
   * 将alert配置（相对时间或绝对时间）转换为具体的cron表达式。
   * 
   * @param taskInstance - 任务实例
   * @param alert - 提醒alert配置
   * @returns 创建的提醒信息或null（如果提醒时间已过期）
   */
  private async createSingleReminder(
    taskInstance: TaskInstance,
    alert: TaskInstance["reminderStatus"]["alerts"][number]
  ): Promise<{
    reminderId: string;
    reminderTime: DateTime;
  } | null> {
    try {
      const reminderId = `task-reminder-${taskInstance.id}-${alert.id}`;

      const reminderTime = this.calculateReminderTime(
        alert.alertConfig,
        taskInstance.timeConfig.scheduledTime
      );

      const now = TaskTimeUtils.now();
      if (reminderTime.timestamp <= now.timestamp) {
        console.warn(`提醒时间 ${reminderTime.isoString} 已过期，跳过创建`);
        return null;
      }

      await scheduleService.createSchedule({
        id: reminderId,
        dateTime: reminderTime,
        task: {
          type: "taskReminder",
          payload: {
            taskId: taskInstance.id,
            alertId: alert.id,
            title: `任务提醒: ${taskInstance.title}`,
            body: this.generateReminderMessage(taskInstance, reminderTime),
            reminderTime: reminderTime.isoString,
            taskTime: taskInstance.timeConfig.scheduledTime.isoString,
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
      console.error("创建单个提醒失败:", error);
      return null;
    }
  }

  /**
   * 计算提醒的具体时间
   * 
   * 根据alert配置计算实际的提醒时间：
   * - 绝对时间：使用配置中指定的具体时间点
   * - 相对时间：基于TaskInstance的执行时间前推指定分钟数
   * 
   * @param alertConfig - 提醒配置
   * @param taskScheduledTime - TaskInstance的计划执行时间
   * @returns 计算出的具体提醒时间
   */
  private calculateReminderTime(
    alertConfig: TaskReminderConfig["alerts"][number],
    taskScheduledTime: DateTime
  ): DateTime {
    if (
      alertConfig.timing.type === "absolute" &&
      alertConfig.timing.absoluteTime
    ) {
      return alertConfig.timing.absoluteTime;
    } else if (
      alertConfig.timing.type === "relative" &&
      alertConfig.timing.minutesBefore
    ) {
      return TaskTimeUtils.addMinutes(
        taskScheduledTime,
        -alertConfig.timing.minutesBefore
      );
    } else {
      return taskScheduledTime;
    }
  }

  /**
   * 生成提醒消息内容
   * 
   * 基于TaskInstance的信息生成用户友好的提醒消息。
   * 
   * @param task - 任务实例
   * @param reminderTime - 提醒时间
   * @returns 格式化的提醒消息
   */
  private generateReminderMessage(
    task: TaskInstance,
    reminderTime: DateTime
  ): string {
    const timeDiff = task.scheduledTime.timestamp - reminderTime.timestamp;
    const minutesBefore = Math.round(timeDiff / (1000 * 60));

    const timeConfig = task.timeConfig;
    let timeStr = "";

    if (timeConfig.type === "allDay") {
      timeStr = "今日";
    } else if (timeConfig.type === "timed") {
      timeStr = `${
        task.scheduledTime.time?.hour
      }:${task.scheduledTime.time?.minute?.toString().padStart(2, "0")}`;
    } else if (timeConfig.type === "timeRange" && timeConfig.endTime) {
      const startTime = task.scheduledTime.time;
      const endTime = timeConfig.endTime.time;
      timeStr = `${startTime?.hour}:${startTime?.minute
        ?.toString()
        .padStart(2, "0")} - ${endTime?.hour}:${endTime?.minute
        ?.toString()
        .padStart(2, "0")}`;
    }

    return `任务 "${task.title}" 将在 ${minutesBefore} 分钟后 (${timeStr}) 开始。`;
  }

  /**
   * 取消指定TaskInstance的所有提醒
   * 
   * 当TaskInstance被删除、取消或重新调度时，需要取消其相关的所有提醒。
   * 
   * @param taskInstanceId - 任务实例ID
   * @returns 操作结果响应
   */
  async cancelTaskInstanceReminders(
    taskInstanceId: string
  ): Promise<TResponse<void>> {
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
          const reminderId = `task-reminder-${taskInstanceId}-${reminderTime.timestamp}`;
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
          error instanceof Error ? error.message : "未知错误"
        }`,
        data: undefined,
      };
    }
  }

  /**
   * 重新初始化所有TaskInstance的提醒
   * 
   * 用于系统重启或批量更新时重新创建所有提醒调度。
   * 会先清除所有现有提醒，然后为每个TaskInstance重新创建。
   * 
   * @param instances - 需要重新初始化提醒的TaskInstance列表
   */
  async reinitializeAllReminders(
    instances: TaskInstance[]
  ): Promise<void> {
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
   * 查找指定时间范围内即将触发的TaskInstance提醒。
   * 用于预览功能或提前通知用户。
   * 
   * @param withinMinutes - 时间范围（分钟），默认60分钟
   * @returns 即将到来的提醒列表，按时间排序
   */
  getUpcomingReminders(withinMinutes: number = 60): Array<{
    taskId: string;
    reminderTime: DateTime;
    minutesUntil: number;
  }> {
    const now = TimeUtils.now();
    const cutoffTime = now.timestamp + withinMinutes * 60 * 1000;
    const upcoming: Array<{
      taskId: string;
      reminderTime: DateTime;
      minutesUntil: number;
    }> = [];

    for (const [taskId, reminderTimes] of this.activeReminders) {
      for (const reminderTime of reminderTimes) {
        if (
          reminderTime.timestamp > now.timestamp &&
          reminderTime.timestamp <= cutoffTime
        ) {
          upcoming.push({
            taskId,
            reminderTime,
            minutesUntil: Math.round(
              (reminderTime.timestamp - now.timestamp) / (1000 * 60)
            ),
          });
        }
      }
    }

    return upcoming.sort(
      (a, b) => a.reminderTime.timestamp - b.reminderTime.timestamp
    );
  }
}

export const taskReminderService = TaskReminderService.getInstance();
