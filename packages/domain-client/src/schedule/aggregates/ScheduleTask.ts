/**
 * Schedule Task Domain Client Implementation
 * @description 调度任务客户端领域实现
 * @auth    return {
      taskUuid:     return {
      taskUuid: this.uuid,
      status: ScheduleStatus.COMPLETED,
      executedAt: new Date(),
      duration: 100,
      result: 'Reminder shown successfully',
    };id,
      status: ScheduleStatus.COMPLETED,
      executedAt: new Date(),
      duration: 100,
      result: 'Reminder shown successfully',
    };    result: 'Reminder shown successfully', DailyUse Team
 * @d        result: 'Notification shown successfully',te 2025-01-09        result: 'System task executed successfully',
 */

import {
  type IScheduleTask,
  type IScheduleExecutionResult,
  ScheduleStatus,
  SchedulePriority,
  ScheduleTaskType,
  RecurrenceType,
} from '@dailyuse/contracts';

import { ScheduleTaskCore } from '@dailyuse/domain-core';

/**
 * 客户端调度任务实现
 * 重点关注UI交互和用户体验
 */
export class ScheduleTask extends ScheduleTaskCore {
  constructor(data: IScheduleTask) {
    super(data);
  }

  /**
   * 执行任务 - 客户端版本
   * 主要用于UI更新和用户交互
   */
  public async execute(): Promise<IScheduleExecutionResult> {
    try {
      this.status = ScheduleStatus.RUNNING;
      this.startExecution();

      // 客户端执行逻辑
      const result = await this.performClientExecution();

      this.completeExecution(result);
      this.status = result.status;

      return result;
    } catch (error) {
      const failureResult: IScheduleExecutionResult = {
        taskUuid: this.uuid,
        status: ScheduleStatus.FAILED,
        executedAt: new Date(),
        duration: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      this.completeExecution(failureResult);
      this.status = ScheduleStatus.FAILED;

      return failureResult;
    }
  }

  /**
   * 客户端任务执行逻辑
   */
  private async performClientExecution(): Promise<IScheduleExecutionResult> {
    // 根据任务类型执行不同的客户端逻辑
    switch (this.taskType) {
      case ScheduleTaskType.TASK_REMINDER:
      case ScheduleTaskType.GOAL_REMINDER:
      case ScheduleTaskType.GENERAL_REMINDER:
        return this.showReminder();

      case ScheduleTaskType.SYSTEM_MAINTENANCE:
      case ScheduleTaskType.DATA_BACKUP:
      case ScheduleTaskType.CLEANUP_TASK:
        return this.executeSystemTask();

      default:
        throw new Error(`Unsupported task type: ${this.taskType}`);
    }
  }

  /**
   * 显示提醒
   */
  private async showReminder(): Promise<IScheduleExecutionResult> {
    // 显示提醒UI
    console.log(`显示提醒: ${this.name}`);

    // 这里可以调用UI组件显示提醒
    // await this.$toast.success(this.name, { description: this.description });

    return {
      taskUuid: this.uuid,
      status: ScheduleStatus.COMPLETED,
      executedAt: new Date(),
      duration: 100,
      result: 'Reminder shown successfully',
    };
  }

  /**
   * 显示通知
   */
  private async showNotification(): Promise<IScheduleExecutionResult> {
    // 显示系统通知
    console.log(`显示通知: ${this.name}`);

    // 这里可以调用浏览器通知API
    // if ('Notification' in window) {
    //   new Notification(this.name, {
    //     body: this.description,
    //     icon: '/favicon.ico'
    //   });
    // }

    return {
      taskUuid: this.uuid,
      status: ScheduleStatus.COMPLETED,
      executedAt: new Date(),
      duration: 100,
      result: 'Notification shown successfully',
    };
  }

  /**
   * 执行系统任务
   */
  private async executeSystemTask(): Promise<IScheduleExecutionResult> {
    // 执行客户端系统任务
    console.log(`执行系统任务: ${this.name}`);

    return {
      taskUuid: this.uuid,
      status: ScheduleStatus.COMPLETED,
      executedAt: new Date(),
      duration: 200,
      result: 'System task executed successfully',
    };
  }

  /**
   * 计算重复执行时间
   */
  protected calculateRecurringTime(): Date {
    if (!this.recurrence) {
      return this.scheduledTime;
    }

    const now = new Date();
    const nextTime = new Date(this.scheduledTime);

    switch (this.recurrence.type) {
      case RecurrenceType.DAILY:
        nextTime.setDate(nextTime.getDate() + (this.recurrence.interval || 1));
        break;

      case RecurrenceType.WEEKLY:
        nextTime.setDate(nextTime.getDate() + 7 * (this.recurrence.interval || 1));
        break;

      case RecurrenceType.MONTHLY:
        nextTime.setMonth(nextTime.getMonth() + (this.recurrence.interval || 1));
        break;

      case RecurrenceType.YEARLY:
        nextTime.setFullYear(nextTime.getFullYear() + (this.recurrence.interval || 1));
        break;

      default:
        return this.scheduledTime;
    }

    // 确保下次执行时间在当前时间之后
    while (nextTime <= now) {
      switch (this.recurrence.type) {
        case RecurrenceType.DAILY:
          nextTime.setDate(nextTime.getDate() + (this.recurrence.interval || 1));
          break;
        case RecurrenceType.WEEKLY:
          nextTime.setDate(nextTime.getDate() + 7 * (this.recurrence.interval || 1));
          break;
        case RecurrenceType.MONTHLY:
          nextTime.setMonth(nextTime.getMonth() + (this.recurrence.interval || 1));
          break;
        case RecurrenceType.YEARLY:
          nextTime.setFullYear(nextTime.getFullYear() + (this.recurrence.interval || 1));
          break;
      }
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
      errors.push('执行时间不能为空');
    }

    if (this.scheduledTime && this.scheduledTime < new Date()) {
      errors.push('执行时间不能是过去的时间');
    }

    // 重复规则验证
    if (this.recurrence) {
      if (!this.recurrence.type) {
        errors.push('重复类型不能为空');
      }

      if (this.recurrence.interval && this.recurrence.interval <= 0) {
        errors.push('重复间隔必须大于0');
      }

      if (this.recurrence.endDate && this.recurrence.endDate <= this.scheduledTime) {
        errors.push('结束日期必须晚于开始时间');
      }
    }

    // 告警配置验证
    if (this.alertConfig) {
      if (this.alertConfig.popupDuration && this.alertConfig.popupDuration < 0) {
        errors.push('弹窗持续时间不能为负数');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // 客户端特有的 UI 辅助方法

  /**
   * 获取状态文本
   */
  public get statusText(): string {
    switch (this.status) {
      case ScheduleStatus.PENDING:
        return '待执行';
      case ScheduleStatus.RUNNING:
        return '执行中';
      case ScheduleStatus.COMPLETED:
        return '已完成';
      case ScheduleStatus.FAILED:
        return '执行失败';
      case ScheduleStatus.CANCELLED:
        return '已取消';
      case ScheduleStatus.PAUSED:
        return '已暂停';
      default:
        return '未知状态';
    }
  }

  /**
   * 获取优先级文本
   */
  public get priorityText(): string {
    switch (this.priority) {
      case SchedulePriority.LOW:
        return '低';
      case SchedulePriority.NORMAL:
        return '普通';
      case SchedulePriority.HIGH:
        return '高';
      case SchedulePriority.URGENT:
        return '紧急';
      default:
        return '未知';
    }
  }

  /**
   * 获取任务类型文本
   */
  public get taskTypeText(): string {
    switch (this.taskType) {
      case ScheduleTaskType.TASK_REMINDER:
        return '任务提醒';
      case ScheduleTaskType.GOAL_REMINDER:
        return '目标提醒';
      case ScheduleTaskType.GENERAL_REMINDER:
        return '通用提醒';
      case ScheduleTaskType.SYSTEM_MAINTENANCE:
        return '系统维护';
      case ScheduleTaskType.DATA_BACKUP:
        return '数据备份';
      case ScheduleTaskType.CLEANUP_TASK:
        return '清理任务';
      default:
        return '未知类型';
    }
  }

  /**
   * 获取剩余时间文本
   */
  public get timeRemainingText(): string {
    const minutes = this.getMinutesUntilExecution();

    if (minutes < 0) return '已过期';
    if (minutes === 0) return '即将执行';

    if (minutes < 60) {
      return `${minutes}分钟后`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours < 24) {
      return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分钟后` : `${hours}小时后`;
    }

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    return remainingHours > 0 ? `${days}天${remainingHours}小时后` : `${days}天后`;
  }

  /**
   * 检查是否可以重新执行
   */
  public canReExecute(): boolean {
    return this.status === ScheduleStatus.FAILED || this.status === ScheduleStatus.COMPLETED;
  }

  /**
   * 检查是否可以编辑
   */
  public canEdit(): boolean {
    return this.status !== ScheduleStatus.RUNNING;
  }

  /**
   * 重新执行任务
   */
  public async reExecute(): Promise<IScheduleExecutionResult> {
    if (!this.canReExecute()) {
      throw new Error('当前状态不允许重新执行');
    }

    // 重置状态
    this.status = ScheduleStatus.PENDING;
    this.currentRetries = 0;
    this.calculateNextExecutionTime();

    return this.execute();
  }

  /**
   * 立即执行
   */
  public async executeNow(): Promise<IScheduleExecutionResult> {
    // 临时设置为当前时间
    const originalTime = this.nextExecutionTime;
    this.nextExecutionTime = new Date();

    try {
      return await this.execute();
    } finally {
      // 恢复原时间
      this.nextExecutionTime = originalTime;
    }
  }
}
