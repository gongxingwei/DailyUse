// src/modules/Task/services/taskReminderService.ts
import { TResponse } from "@/shared/types/response";
import type { DateTime } from "../../types/timeStructure";
import { TimeUtils } from "../../../../shared/utils/myDateTimeUtils";
import { scheduleService } from "@/modules/schedule/services/scheduleService";
import { TaskTimeUtils } from "../utils/taskTimeUtils";
import type { TaskReminderConfig } from "../types/task";

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
              `创建提醒失败: 任务 ${taskInstance.id} 的提醒 ${alert.id} 无效或已过期`
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
        message: `成功为任务 ${taskInstance.id} 创建 ${reminderTimes.length} 个提醒`,
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
   * 创建单个提醒
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

      // 计算实际的提醒时间
      const reminderTime = this.calculateReminderTime(
        alert.alertConfig,
        taskInstance.timeConfig.scheduledTime
      );

      // 检查提醒时间是否在未来
      const now = TaskTimeUtils.now();
      if (reminderTime.timestamp <= now.timestamp) {
        console.warn(`提醒时间 ${reminderTime.isoString} 已过期，跳过创建`);
        return null;
      }

      // 创建 cron 表达式
      const cronExpression = this.createCronExpression(reminderTime);

      await scheduleService.createSchedule({
        id: reminderId,
        cron: cronExpression,
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
   */
  private calculateReminderTime(
    alertConfig: TaskReminderConfig["alerts"][number],
    taskScheduledTime: DateTime
  ): DateTime {
    if (
      alertConfig.timing.type === "absolute" &&
      alertConfig.timing.absoluteTime
    ) {
      // 绝对时间：使用指定的时间点
      return alertConfig.timing.absoluteTime;
    } else if (
      alertConfig.timing.type === "relative" &&
      alertConfig.timing.minutesBefore
    ) {
      // 相对时间：在任务开始前N分钟
      return TaskTimeUtils.addMinutes(
        taskScheduledTime,
        -alertConfig.timing.minutesBefore
      );
    } else {
      // 默认情况：任务开始时间
      return taskScheduledTime;
    }
  }

  /**
   * 创建精确的 cron 表达式
   */
  private createCronExpression(dateTime: DateTime): string {
    const { time, date } = dateTime;

    if (!time) {
      throw new Error("提醒时间必须包含具体时间");
    }

    // 格式: 分 时 日 月 星期
    return `${time.minute} ${time.hour} ${date.day} ${date.month} *`;
  }

  /**
   * 生成提醒消息
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
   * 取消传入任务实例的所有提醒
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
   * 重新初始化所有提醒
   */
  async reinitializeAllReminders(
    instances: TaskInstance[]
  ): Promise<void> {
    // 清除所有现有提醒
    for (const [taskId] of this.activeReminders) {
      await this.cancelTaskInstanceReminders(taskId);
    }

    // 重新创建提醒
    for (const instance of instances) {
      await this.createTaskReminders(instance);
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
