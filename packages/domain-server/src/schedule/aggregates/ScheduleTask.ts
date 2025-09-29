/**
 * Schedule Task Aggregate Implementation
 * @description 调度任务聚合根具体实现
 * @author DailyUse Team
 * @date 2025-01-09
 */

import { ScheduleTaskCore } from '@dailyuse/domain-core';
import {
  type IScheduleTask,
  type IScheduleExecutionResult,
  RecurrenceType,
  type CreateScheduleTaskRequestDto,
  type ScheduleTaskResponseDto,
  ScheduleStatus,
  SchedulePriority,
  ScheduleTaskType,
} from '@dailyuse/contracts';
import { generateUUID } from '@dailyuse/utils';

/**
 * 调度任务聚合根 - 服务端实现
 */
export class ScheduleTask extends ScheduleTaskCore {
  constructor(data: IScheduleTask) {
    super(data);
  }

  /**
   * 执行任务 - 服务端具体实现
   */
  public async execute(): Promise<IScheduleExecutionResult> {
    const startTime = new Date();

    try {
      // 更新执行状态
      this._scheduling.status = ScheduleStatus.RUNNING;
      this._execution.executionCount += 1;

      // 执行具体的任务逻辑
      console.log(`执行任务：${this._basic.name}, 类型：${this._basic.taskType}`);

      // 模拟任务执行
      const result = await this.performTask();

      // 更新执行状态
      this._scheduling.status = ScheduleStatus.COMPLETED;
      this._execution.currentRetries = 0;

      // 计算下次执行时间
      const nextTime = this.calculateNextExecutionTime();
      this._scheduling.nextExecutionTime = nextTime;

      this._lifecycle.updatedAt = new Date();

      return {
        taskUuid: this.uuid,
        executedAt: startTime,
        status: ScheduleStatus.COMPLETED,
        result,
        duration: Date.now() - startTime.getTime(),
        nextExecutionTime: nextTime,
      };
    } catch (error) {
      this._scheduling.status = ScheduleStatus.FAILED;
      this._execution.currentRetries += 1;
      this._lifecycle.updatedAt = new Date();

      console.error(`任务执行失败：${this._basic.name}`, error);

      return {
        taskUuid: this.uuid,
        executedAt: startTime,
        status: ScheduleStatus.FAILED,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime.getTime(),
      };
    }
  }

  /**
   * 验证任务数据
   */
  public validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 基本信息验证
    if (!this._basic.name?.trim()) {
      errors.push('任务名称不能为空');
    }

    if (!this._basic.taskType) {
      errors.push('任务类型不能为空');
    }

    // 调度信息验证
    if (!this._scheduling.scheduledTime) {
      errors.push('计划执行时间不能为空');
    }

    // 如果有重复规则，验证重复规则
    if (this._scheduling.recurrence) {
      const recurrenceErrors = this.validateRecurrence();
      errors.push(...recurrenceErrors);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 执行具体任务
   */
  private async performTask(): Promise<any> {
    const { type, data } = this._basic.payload;

    let result: any;

    switch (type) {
      case ScheduleTaskType.TASK_REMINDER:
        result = await this.handleTaskReminder(data);
        break;
      case ScheduleTaskType.GOAL_REMINDER:
        result = await this.handleGoalReminder(data);
        break;
      case ScheduleTaskType.GENERAL_REMINDER:
        result = await this.handleGeneralReminder(data);
        break;
      default:
        console.log(`未知任务类型：${type}`);
        result = `未知任务类型：${type}`;
    }

    return result;
  }

  /**
   * 处理任务提醒
   */
  private async handleTaskReminder(data: any): Promise<string> {
    const message = `处理任务提醒：taskId=${data.taskId}`;
    console.log(message);
    // 这里可以发送提醒通知
    return message;
  }

  /**
   * 处理目标提醒
   */
  private async handleGoalReminder(data: any): Promise<string> {
    const message = `处理目标提醒：goalId=${data.goalId}`;
    console.log(message);
    // 这里可以发送提醒通知
    return message;
  }

  /**
   * 处理通用提醒
   */
  private async handleGeneralReminder(data: any): Promise<string> {
    const message = `处理通用提醒：${data.title} - ${data.message}`;
    console.log(message);
    // 这里可以发送提醒通知
    return message;
  }

  /**
   * 计算下次执行时间
   */
  protected calculateNextExecutionTime(): Date | undefined {
    if (!this._scheduling.recurrence) {
      return undefined;
    }

    const { type, interval, endDate, maxOccurrences, daysOfWeek, dayOfMonth, cronExpression } =
      this._scheduling.recurrence;
    const baseTime = this._scheduling.nextExecutionTime || this._scheduling.scheduledTime;
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

    if (maxOccurrences && this._execution.executionCount >= maxOccurrences) {
      return baseTime; // 达到最大执行次数，不再调度
    }

    return nextTime;
  }

  /**
   * 验证任务配置 - 详细版本
   */
  public validateDetailed(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 基础验证
    if (!this._basic.name?.trim()) {
      errors.push('任务名称不能为空');
    }

    if (!this._scheduling.scheduledTime) {
      errors.push('计划执行时间不能为空');
    }

    if (this._scheduling.scheduledTime && this._scheduling.scheduledTime < new Date()) {
      errors.push('计划执行时间不能早于当前时间');
    }

    if (!this.alertConfig || !this.alertConfig.methods?.length) {
      errors.push('至少需要配置一种提醒方式');
    }

    if (this._execution.maxRetries < 0 || this._execution.maxRetries > 10) {
      errors.push('重试次数必须在0-10之间');
    }

    if (
      this._execution.timeoutSeconds &&
      (this._execution.timeoutSeconds < 1 || this._execution.timeoutSeconds > 3600)
    ) {
      errors.push('超时时间必须在1-3600秒之间');
    }

    // 重复规则验证
    if (this._scheduling.recurrence) {
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
      this._scheduling.recurrence!;

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

    if (!this._basic.payload || !this._basic.payload.type) {
      errors.push('任务载荷类型不能为空');
    }

    if (!this._basic.payload.data) {
      errors.push('任务载荷数据不能为空');
    }

    // 根据任务类型验证特定载荷
    switch (this._basic.taskType) {
      case ScheduleTaskType.TASK_REMINDER:
        if (!this._basic.payload.data.taskId) {
          errors.push('任务提醒必须包含taskId');
        }
        break;

      case ScheduleTaskType.GOAL_REMINDER:
        if (!this._basic.payload.data.goalId) {
          errors.push('目标提醒必须包含goalId');
        }
        break;

      case ScheduleTaskType.GENERAL_REMINDER:
        if (!this._basic.payload.data.title || !this._basic.payload.data.message) {
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
      basic: {
        name: dto.name,
        description: dto.description,
        taskType: dto.taskType,
        payload: dto.payload,
        createdBy: dto.createdBy,
      },
      scheduling: {
        scheduledTime: dto.scheduledTime,
        recurrence: dto.recurrence,
        priority: dto.priority,
        status: dto.status,
        nextExecutionTime: dto.nextExecutionTime,
      },
      execution: {
        executionCount: dto.executionCount,
        maxRetries: dto.maxRetries,
        currentRetries: dto.currentRetries,
        timeoutSeconds: dto.timeoutSeconds,
      },
      alertConfig: dto.alertConfig,
      lifecycle: {
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt,
      },
      metadata: {
        tags: dto.tags,
        enabled: dto.enabled,
      },
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
      basic: {
        name: request.name,
        description: request.description,
        taskType: request.taskType,
        payload: request.payload,
        createdBy,
      },
      scheduling: {
        scheduledTime: request.scheduledTime,
        recurrence: request.recurrence,
        priority: request.priority,
        status: ScheduleStatus.PENDING,
        nextExecutionTime: request.scheduledTime,
      },
      execution: {
        executionCount: 0,
        maxRetries: request.maxRetries ?? 3,
        currentRetries: 0,
        timeoutSeconds: request.timeoutSeconds,
      },
      alertConfig: request.alertConfig,
      lifecycle: {
        createdAt: now,
        updatedAt: now,
      },
      metadata: {
        tags: request.tags,
        enabled: request.enabled ?? true,
      },
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
      basic: {
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
        createdBy,
      },
      scheduling: {
        scheduledTime: reminderTime,
        priority: options?.priority ?? SchedulePriority.NORMAL,
        status: ScheduleStatus.PENDING,
        nextExecutionTime: reminderTime,
      },
      execution: {
        executionCount: 0,
        maxRetries: 1,
        currentRetries: 0,
      },
      alertConfig: {
        methods: (options?.methods as any[]) ?? ['POPUP', 'SOUND'],
        allowSnooze: options?.allowSnooze ?? true,
        snoozeOptions: [5, 10, 15, 30, 60],
        popupDuration: 10,
      },
      lifecycle: {
        createdAt: now,
        updatedAt: now,
      },
      metadata: {
        tags: options?.tags,
        enabled: true,
      },
    });
  }
}
