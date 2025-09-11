/**
 * Schedule Task Aggregate Implementation
 * @description 调度任务聚合根具体实现
 * @author DailyUse Team
 * @date 2025-01-09
 */

import { ScheduleTaskCore } from '@dailyuse/domain-core';
import {
  type IScheduleTask,
  RecurrenceType,
  type CreateScheduleTaskRequestDto,
  type ScheduleTaskResponseDto,
  ScheduleStatus,
  SchedulePriority,
  ScheduleTaskType,
} from '@dailyuse/contracts';
import { generateUUID } from '@dailyuse/utils';

/**
 * 调度任务聚合根
 */
export class ScheduleTask extends ScheduleTaskCore {
  constructor(data: IScheduleTask) {
    super(data);
  }

  /**
   * 计算重复执行时间
   */
  protected calculateRecurringTime(): Date {
    if (!this.recurrence) {
      return this.scheduledTime;
    }

    const { type, interval, endDate, maxOccurrences, daysOfWeek, dayOfMonth, cronExpression } =
      this.recurrence;
    const baseTime = this.nextExecutionTime || this.scheduledTime;
    const nextTime = new Date(baseTime);

    switch (type) {
      case RecurrenceType.DAILY:
        nextTime.setDate(nextTime.getDate() + interval);
        break;

      case RecurrenceType.WEEKLY:
        if (daysOfWeek && daysOfWeek.length > 0) {
          // 找到下一个指定星期几
          const currentDay = nextTime.getDay();
          const sortedDays = [...daysOfWeek].sort((a, b) => a - b);
          let nextDay = sortedDays.find((day) => day > currentDay);

          if (!nextDay) {
            // 如果当周没有后续日期，跳到下周的第一个指定日期
            nextDay = sortedDays[0];
            nextTime.setDate(nextTime.getDate() + (7 - currentDay + nextDay));
          } else {
            nextTime.setDate(nextTime.getDate() + (nextDay - currentDay));
          }
        } else {
          nextTime.setDate(nextTime.getDate() + 7 * interval);
        }
        break;

      case RecurrenceType.MONTHLY:
        if (dayOfMonth) {
          nextTime.setMonth(nextTime.getMonth() + interval);
          nextTime.setDate(dayOfMonth);
        } else {
          nextTime.setMonth(nextTime.getMonth() + interval);
        }
        break;

      case RecurrenceType.YEARLY:
        nextTime.setFullYear(nextTime.getFullYear() + interval);
        break;

      case RecurrenceType.CUSTOM:
        if (cronExpression) {
          // 这里可以集成 cron 解析库
          // 暂时使用简单的日间隔作为后备方案
          nextTime.setDate(nextTime.getDate() + 1);
        }
        break;

      default:
        return baseTime;
    }

    // 检查结束条件
    if (endDate && nextTime > endDate) {
      return baseTime; // 超过结束日期，不再调度
    }

    if (maxOccurrences && this.executionCount >= maxOccurrences) {
      return baseTime; // 达到最大执行次数，不再调度
    }

    return nextTime;
  }

  /**
   * 验证任务配置
   */
  public validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 基础验证
    if (!this.name?.trim()) {
      errors.push('任务名称不能为空');
    }

    if (!this.scheduledTime) {
      errors.push('计划执行时间不能为空');
    }

    if (this.scheduledTime && this.scheduledTime < new Date()) {
      errors.push('计划执行时间不能早于当前时间');
    }

    if (!this.alertConfig || !this.alertConfig.methods?.length) {
      errors.push('至少需要配置一种提醒方式');
    }

    if (this.maxRetries < 0 || this.maxRetries > 10) {
      errors.push('重试次数必须在0-10之间');
    }

    if (this.timeoutSeconds && (this.timeoutSeconds < 1 || this.timeoutSeconds > 3600)) {
      errors.push('超时时间必须在1-3600秒之间');
    }

    // 重复规则验证
    if (this.recurrence) {
      const recurrenceErrors = this.validateRecurrence();
      errors.push(...recurrenceErrors);
    }

    // 载荷验证
    const payloadErrors = this.validatePayload();
    errors.push(...payloadErrors);

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 验证重复规则
   */
  private validateRecurrence(): string[] {
    const errors: string[] = [];
    const { type, interval, endDate, maxOccurrences, daysOfWeek, dayOfMonth, cronExpression } =
      this.recurrence!;

    if (interval <= 0) {
      errors.push('重复间隔必须大于0');
    }

    if (endDate && endDate <= new Date()) {
      errors.push('结束日期必须晚于当前时间');
    }

    if (maxOccurrences && maxOccurrences <= 0) {
      errors.push('最大执行次数必须大于0');
    }

    switch (type) {
      case RecurrenceType.WEEKLY:
        if (
          daysOfWeek &&
          (daysOfWeek.length === 0 || daysOfWeek.some((day) => day < 0 || day > 6))
        ) {
          errors.push('星期几配置无效，必须是0-6之间的数字');
        }
        break;

      case RecurrenceType.MONTHLY:
        if (dayOfMonth && (dayOfMonth < 1 || dayOfMonth > 31)) {
          errors.push('月中日期配置无效，必须是1-31之间的数字');
        }
        break;

      case RecurrenceType.CUSTOM:
        if (!cronExpression?.trim()) {
          errors.push('自定义重复规则必须提供Cron表达式');
        }
        break;
    }

    return errors;
  }

  /**
   * 验证载荷数据
   */
  private validatePayload(): string[] {
    const errors: string[] = [];

    if (!this.payload || !this.payload.type) {
      errors.push('任务载荷类型不能为空');
    }

    if (!this.payload.data) {
      errors.push('任务载荷数据不能为空');
    }

    // 根据任务类型验证特定载荷
    switch (this.taskType) {
      case ScheduleTaskType.TASK_REMINDER:
        if (!this.payload.data.taskId) {
          errors.push('任务提醒必须包含taskId');
        }
        break;

      case ScheduleTaskType.GOAL_REMINDER:
        if (!this.payload.data.goalId) {
          errors.push('目标提醒必须包含goalId');
        }
        break;

      case ScheduleTaskType.GENERAL_REMINDER:
        if (!this.payload.data.title || !this.payload.data.message) {
          errors.push('通用提醒必须包含标题和消息');
        }
        break;
    }

    return errors;
  }

  /**
   * 从DTO创建实例
   */
  public static fromDTO(dto: ScheduleTaskResponseDto): ScheduleTask {
    return new ScheduleTask({
      uuid: dto.uuid,
      name: dto.name,
      description: dto.description,
      taskType: dto.taskType,
      payload: dto.payload,
      scheduledTime: dto.scheduledTime,
      recurrence: dto.recurrence,
      priority: dto.priority,
      status: dto.status,
      alertConfig: dto.alertConfig,
      createdBy: dto.createdBy,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      nextExecutionTime: dto.nextExecutionTime,
      executionCount: dto.executionCount,
      maxRetries: dto.maxRetries,
      currentRetries: dto.currentRetries,
      timeoutSeconds: dto.timeoutSeconds,
      tags: dto.tags,
      enabled: dto.enabled,
    });
  }

  /**
   * 从创建请求创建实例
   */
  public static fromCreateRequest(
    request: CreateScheduleTaskRequestDto,
    uuid: string,
    createdBy: string,
  ): ScheduleTask {
    const now = new Date();

    return new ScheduleTask({
      uuid,
      name: request.name,
      description: request.description,
      taskType: request.taskType,
      payload: request.payload,
      scheduledTime: request.scheduledTime,
      recurrence: request.recurrence,
      priority: request.priority,
      status: ScheduleStatus.PENDING,
      alertConfig: request.alertConfig,
      createdBy,
      createdAt: now,
      updatedAt: now,
      nextExecutionTime: request.scheduledTime,
      executionCount: 0,
      maxRetries: request.maxRetries ?? 3,
      currentRetries: 0,
      timeoutSeconds: request.timeoutSeconds,
      tags: request.tags,
      enabled: request.enabled ?? true,
    });
  }

  /**
   * 创建快速提醒任务
   */
  public static createQuickReminder(
    title: string,
    message: string,
    reminderTime: Date,
    createdBy: string,
    options?: {
      priority?: SchedulePriority;
      methods?: string[];
      allowSnooze?: boolean;
      tags?: string[];
    },
  ): ScheduleTask {
    const uuid = generateUUID();
    const now = new Date();

    return new ScheduleTask({
      uuid,
      name: title,
      description: `快速提醒: ${message}`,
      taskType: ScheduleTaskType.GENERAL_REMINDER,
      payload: {
        type: ScheduleTaskType.GENERAL_REMINDER,
        data: {
          title,
          message,
        },
      },
      scheduledTime: reminderTime,
      priority: options?.priority ?? SchedulePriority.NORMAL,
      status: ScheduleStatus.PENDING,
      alertConfig: {
        methods: (options?.methods as any[]) ?? ['POPUP', 'SOUND'],
        allowSnooze: options?.allowSnooze ?? true,
        snoozeOptions: [5, 10, 15, 30, 60],
        popupDuration: 10,
      },
      createdBy,
      createdAt: now,
      updatedAt: now,
      nextExecutionTime: reminderTime,
      executionCount: 0,
      maxRetries: 1,
      currentRetries: 0,
      tags: options?.tags,
      enabled: true,
    });
  }
}
