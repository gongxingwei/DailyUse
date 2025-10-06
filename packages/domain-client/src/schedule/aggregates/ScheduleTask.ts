/**
 * ScheduleTask Client Entity
 * 调度任务客户端聚合根
 *
 * 职责:
 * - 继承核心业务逻辑
 * - 提供客户端特有的UI辅助方法
 * - 实现数据转换方法（fromDTO, toClientDTO等）
 * - 变更跟踪系统
 *
 * @author DailyUse Team
 * @date 2025-01-09
 */

import { ScheduleTaskCore } from '@dailyuse/domain-core';
import type { ScheduleContracts } from '@dailyuse/contracts';

import {
  ScheduleStatus,
  SchedulePriority,
  ScheduleTaskType,
  RecurrenceType,
  AlertMethod,
} from '@dailyuse/contracts';

/**
 * 客户端 ScheduleTask 聚合根
 * 继承核心类，添加客户端特有功能
 */
export class ScheduleTask extends ScheduleTaskCore {
  // 变更跟踪系统
  private _originalState: ScheduleContracts.IScheduleTask | null = null;
  private _isDirty = false;

  constructor(data: ScheduleContracts.IScheduleTask) {
    super(data);
  }

  // ===== 静态工厂方法 =====

  /**
   * 从服务端 DTO 创建实体
   */
  static fromDTO(dto: ScheduleContracts.ScheduleTaskResponseDto): ScheduleTask {
    return new ScheduleTask({
      uuid: dto.uuid,
      basic: {
        name: dto.name,
        description: dto.description,
        taskType: dto.taskType,
        createdBy: dto.createdBy,
        payload: dto.payload,
      },
      scheduling: {
        scheduledTime: new Date(dto.scheduledTime),
        recurrence: dto.recurrence,
        priority: dto.priority,
        status: dto.status,
        nextExecutionTime: dto.nextExecutionTime ? new Date(dto.nextExecutionTime) : undefined,
      },
      execution: {
        executionCount: dto.executionCount,
        maxRetries: dto.maxRetries,
        currentRetries: dto.currentRetries,
        timeoutSeconds: dto.timeoutSeconds,
      },
      alertConfig: dto.alertConfig,
      lifecycle: {
        createdAt: new Date(dto.createdAt),
        updatedAt: new Date(dto.updatedAt),
      },
      metadata: {
        tags: dto.tags,
        enabled: dto.enabled,
        version: 1,
      },
    });
  }

  /**
   * 从客户端 DTO 创建实体（用于表单提交等）
   * ClientDTO与ResponseDTO结构相同，只是增加了计算属性
   */
  static fromClientDTO(dto: ScheduleContracts.ScheduleTaskResponseDto): ScheduleTask {
    return ScheduleTask.fromDTO(dto);
  }

  /**
   * 创建新的空任务（用于新建表单）
   */
  static forCreate(accountUuid: string): ScheduleTask {
    const now = new Date();
    const defaultScheduledTime = new Date(now.getTime() + 60 * 60 * 1000); // 1小时后

    return new ScheduleTask({
      uuid: '',
      basic: {
        name: '',
        description: '',
        taskType: ScheduleTaskType.GENERAL_REMINDER,
        createdBy: accountUuid,
        payload: { type: ScheduleTaskType.GENERAL_REMINDER, data: {} },
      },
      scheduling: {
        scheduledTime: defaultScheduledTime,
        recurrence: undefined,
        priority: SchedulePriority.NORMAL,
        status: ScheduleStatus.PENDING,
        nextExecutionTime: defaultScheduledTime,
      },
      execution: {
        executionCount: 0,
        maxRetries: 3,
        currentRetries: 0,
        timeoutSeconds: 300,
      },
      alertConfig: {
        methods: [AlertMethod.POPUP],
        allowSnooze: true,
        snoozeOptions: [5, 10, 15, 30],
      },
      lifecycle: {
        createdAt: now,
        updatedAt: now,
      },
      metadata: {
        tags: [],
        enabled: true,
        version: 1,
      },
    });
  }

  // ===== 数据转换方法 =====

  /**
   * 转换为服务端 DTO
   */
  toResponseDTO(): ScheduleContracts.ScheduleTaskResponseDto {
    return {
      uuid: this._uuid,
      name: this._basic.name,
      description: this._basic.description,
      taskType: this._basic.taskType,
      createdBy: this._basic.createdBy,
      payload: this._basic.payload,
      scheduledTime: this._scheduling.scheduledTime,
      recurrence: this._scheduling.recurrence,
      priority: this._scheduling.priority,
      status: this._scheduling.status,
      nextExecutionTime: this._scheduling.nextExecutionTime,
      executionCount: this._execution.executionCount,
      maxRetries: this._execution.maxRetries,
      currentRetries: this._execution.currentRetries,
      timeoutSeconds: this._execution.timeoutSeconds,
      alertConfig: this._alertConfig,
      enabled: this._metadata.enabled,
      tags: this._metadata.tags,
      createdAt: this._lifecycle.createdAt,
      updatedAt: this._lifecycle.updatedAt,
    };
  }

  /**
   * 转换为客户端 DTO（包含所有计算属性）
   */
  toClientDTO(): ScheduleContracts.ScheduleTaskResponseDto & {
    statusText: string;
    priorityText: string;
    taskTypeText: string;
    timeRemainingText: string;
    isOverdue: boolean;
    canExecute: boolean;
    canEdit: boolean;
    canDelete: boolean;
  } {
    return {
      ...this.toResponseDTO(),
      // 客户端计算属性
      statusText: this.statusText,
      priorityText: this.priorityText,
      taskTypeText: this.taskTypeText,
      timeRemainingText: this.timeRemainingText,
      isOverdue: this.isOverdue,
      canExecute: this.canExecuteNow,
      canEdit: this.canEditNow,
      canDelete: this.canDeleteNow,
    };
  }

  // ===== 实现抽象方法 =====

  /**
   * 执行任务 - 客户端版本
   */
  public async execute(): Promise<ScheduleContracts.IScheduleExecutionResult> {
    const startTime = Date.now();

    try {
      this.updateScheduling({ status: ScheduleStatus.RUNNING });

      // 客户端执行逻辑（显示通知等）
      await this.performClientExecution();

      const duration = Date.now() - startTime;
      const result: ScheduleContracts.IScheduleExecutionResult = {
        taskUuid: this.uuid,
        executedAt: new Date(),
        status: ScheduleStatus.COMPLETED,
        duration,
        result: 'Task executed successfully on client',
      };

      this.updateScheduling({ status: ScheduleStatus.COMPLETED });
      this.updateExecution({ executionCount: this._execution.executionCount + 1 });

      // 计算下次执行时间
      const nextTime = this.calculateNextExecutionTime();
      this.updateScheduling({ nextExecutionTime: nextTime });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const result: ScheduleContracts.IScheduleExecutionResult = {
        taskUuid: this.uuid,
        executedAt: new Date(),
        status: ScheduleStatus.FAILED,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      this.updateScheduling({ status: ScheduleStatus.FAILED });
      this.updateExecution({ currentRetries: this._execution.currentRetries + 1 });

      return result;
    }
  }

  /**
   * 验证任务配置
   */
  public validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 基础验证
    if (!this._basic.name?.trim()) {
      errors.push('任务名称不能为空');
    }

    if (!this._scheduling.scheduledTime) {
      errors.push('执行时间不能为空');
    }

    // 重复规则验证
    if (this._scheduling.recurrence) {
      if (!this._scheduling.recurrence.type) {
        errors.push('重复类型不能为空');
      }

      if (this._scheduling.recurrence.interval && this._scheduling.recurrence.interval <= 0) {
        errors.push('重复间隔必须大于0');
      }

      if (
        this._scheduling.recurrence.endDate &&
        this._scheduling.recurrence.endDate <= this._scheduling.scheduledTime
      ) {
        errors.push('结束日期必须晚于开始时间');
      }
    }

    // 提醒配置验证
    if (this._alertConfig) {
      if (this._alertConfig.popupDuration && this._alertConfig.popupDuration < 0) {
        errors.push('弹窗持续时间不能为负数');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 计算下次执行时间
   */
  protected calculateNextExecutionTime(): Date | undefined {
    if (!this._scheduling.recurrence) {
      return undefined;
    }

    const nextTime = new Date(this._scheduling.scheduledTime);
    const now = new Date();

    switch (this._scheduling.recurrence.type) {
      case RecurrenceType.DAILY:
        nextTime.setDate(nextTime.getDate() + (this._scheduling.recurrence.interval || 1));
        break;

      case RecurrenceType.WEEKLY:
        nextTime.setDate(nextTime.getDate() + 7 * (this._scheduling.recurrence.interval || 1));
        break;

      case RecurrenceType.MONTHLY:
        nextTime.setMonth(nextTime.getMonth() + (this._scheduling.recurrence.interval || 1));
        break;

      case RecurrenceType.YEARLY:
        nextTime.setFullYear(nextTime.getFullYear() + (this._scheduling.recurrence.interval || 1));
        break;

      default:
        return undefined;
    }

    // 确保下次执行时间在当前时间之后
    while (nextTime <= now) {
      switch (this._scheduling.recurrence.type) {
        case RecurrenceType.DAILY:
          nextTime.setDate(nextTime.getDate() + (this._scheduling.recurrence.interval || 1));
          break;
        case RecurrenceType.WEEKLY:
          nextTime.setDate(nextTime.getDate() + 7 * (this._scheduling.recurrence.interval || 1));
          break;
        case RecurrenceType.MONTHLY:
          nextTime.setMonth(nextTime.getMonth() + (this._scheduling.recurrence.interval || 1));
          break;
        case RecurrenceType.YEARLY:
          nextTime.setFullYear(
            nextTime.getFullYear() + (this._scheduling.recurrence.interval || 1),
          );
          break;
      }
    }

    // 检查是否超过结束日期或最大次数
    if (this._scheduling.recurrence.endDate && nextTime > this._scheduling.recurrence.endDate) {
      return undefined;
    }

    if (
      this._scheduling.recurrence.maxOccurrences &&
      this._execution.executionCount >= this._scheduling.recurrence.maxOccurrences
    ) {
      return undefined;
    }

    return nextTime;
  }

  // ===== 变更跟踪 =====

  /**
   * 开始编辑模式 - 保存当前状态
   */
  startEditing(): void {
    this._originalState = this.toDTO();
    this._isDirty = false;
  }

  /**
   * 取消编辑 - 恢复原始状态
   */
  cancelEditing(): void {
    if (this._originalState) {
      this._basic = { ...this._originalState.basic };
      this._scheduling = { ...this._originalState.scheduling };
      this._execution = { ...this._originalState.execution };
      this._alertConfig = { ...this._originalState.alertConfig };
      this._lifecycle = { ...this._originalState.lifecycle };
      this._metadata = { ...this._originalState.metadata };
      this._isDirty = false;
      this._originalState = null;
    }
  }

  /**
   * 提交编辑 - 清除原始状态
   */
  commitEditing(): void {
    this._originalState = null;
    this._isDirty = false;
  }

  /**
   * 检查是否有未保存的更改
   */
  get isDirty(): boolean {
    return this._isDirty;
  }

  /**
   * 标记为已修改
   */
  protected markDirty(): void {
    this._isDirty = true;
  }

  // ===== 业务操作（覆盖父类以添加变更跟踪） =====

  /**
   * 更新基本信息
   */
  public override updateBasicInfo(updates: Partial<ScheduleContracts.IScheduleTaskBasic>): void {
    super.updateBasicInfo(updates);
    this.markDirty();
  }

  /**
   * 更新调度信息
   */
  public override updateScheduling(
    updates: Partial<ScheduleContracts.IScheduleTaskScheduling>,
  ): void {
    super.updateScheduling(updates);
    this.markDirty();
  }

  /**
   * 更新执行信息
   */
  public override updateExecution(
    updates: Partial<ScheduleContracts.IScheduleTaskExecution>,
  ): void {
    super.updateExecution(updates);
    this.markDirty();
  }

  /**
   * 更新元数据
   */
  public override updateMetadata(updates: Partial<ScheduleContracts.IScheduleTaskMetadata>): void {
    super.updateMetadata(updates);
    this.markDirty();
  }

  /**
   * 更新提醒配置
   */
  updateAlertConfig(config: ScheduleContracts.IAlertConfig): void {
    this._alertConfig = config;
    this._lifecycle.updatedAt = new Date();
    this.markDirty();
  }

  // ===== 客户端UI辅助方法 =====

  /**
   * 获取状态文本
   */
  get statusText(): string {
    const statusMap: Record<ScheduleContracts.ScheduleStatus, string> = {
      [ScheduleStatus.PENDING]: '待执行',
      [ScheduleStatus.RUNNING]: '执行中',
      [ScheduleStatus.PAUSED]: '已暂停',
      [ScheduleStatus.COMPLETED]: '已完成',
      [ScheduleStatus.FAILED]: '执行失败',
      [ScheduleStatus.CANCELLED]: '已取消',
    };
    return statusMap[this._scheduling.status] || '未知';
  }

  /**
   * 获取优先级文本
   */
  get priorityText(): string {
    const priorityMap: Record<ScheduleContracts.SchedulePriority, string> = {
      [SchedulePriority.LOW]: '低',
      [SchedulePriority.NORMAL]: '普通',
      [SchedulePriority.HIGH]: '高',
      [SchedulePriority.URGENT]: '紧急',
    };
    return priorityMap[this._scheduling.priority] || '未知';
  }

  /**
   * 获取任务类型文本
   */
  get taskTypeText(): string {
    const typeMap: Record<ScheduleContracts.ScheduleTaskType, string> = {
      [ScheduleTaskType.TASK_REMINDER]: '任务提醒',
      [ScheduleTaskType.GOAL_REMINDER]: '目标提醒',
      [ScheduleTaskType.GENERAL_REMINDER]: '通用提醒',
      [ScheduleTaskType.SYSTEM_MAINTENANCE]: '系统维护',
      [ScheduleTaskType.DATA_BACKUP]: '数据备份',
      [ScheduleTaskType.CLEANUP_TASK]: '清理任务',
    };
    return typeMap[this._basic.taskType] || '未知类型';
  }

  /**
   * 获取剩余时间文本
   */
  get timeRemainingText(): string {
    const minutes = this.getMinutesUntilExecution();

    if (minutes < 0) return '已过期';
    if (minutes === 0) return '即将执行';
    if (minutes < 60) return `${minutes}分钟后`;

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
   * 获取状态颜色
   */
  get statusColor(): string {
    const colorMap: Record<ScheduleContracts.ScheduleStatus, string> = {
      [ScheduleStatus.PENDING]: '#2196F3',
      [ScheduleStatus.RUNNING]: '#4CAF50',
      [ScheduleStatus.PAUSED]: '#FF9800',
      [ScheduleStatus.COMPLETED]: '#4CAF50',
      [ScheduleStatus.FAILED]: '#F44336',
      [ScheduleStatus.CANCELLED]: '#9E9E9E',
    };
    return colorMap[this._scheduling.status] || '#9E9E9E';
  }

  /**
   * 获取优先级颜色
   */
  get priorityColor(): string {
    const colorMap: Record<ScheduleContracts.SchedulePriority, string> = {
      [SchedulePriority.LOW]: '#9E9E9E',
      [SchedulePriority.NORMAL]: '#2196F3',
      [SchedulePriority.HIGH]: '#FF9800',
      [SchedulePriority.URGENT]: '#F44336',
    };
    return colorMap[this._scheduling.priority] || '#2196F3';
  }

  /**
   * 是否已过期
   */
  get isOverdue(): boolean {
    return (
      this._scheduling.status === ScheduleStatus.PENDING &&
      this._scheduling.scheduledTime < new Date()
    );
  }

  /**
   * 是否可以执行（UI判断）
   */
  get canExecuteNow(): boolean {
    return (
      this._metadata.enabled &&
      (this._scheduling.status === ScheduleStatus.PENDING ||
        this._scheduling.status === ScheduleStatus.PAUSED)
    );
  }

  /**
   * 是否可以编辑
   */
  get canEditNow(): boolean {
    return this._scheduling.status !== ScheduleStatus.RUNNING;
  }

  /**
   * 是否可以删除
   */
  get canDeleteNow(): boolean {
    return this._scheduling.status !== ScheduleStatus.RUNNING;
  }

  /**
   * 是否可以重试
   */
  get canRetry(): boolean {
    return (
      this._scheduling.status === ScheduleStatus.FAILED &&
      this._execution.currentRetries < this._execution.maxRetries
    );
  }

  /**
   * 克隆实体
   */
  clone(): ScheduleTask {
    const dto = this.toResponseDTO();
    return ScheduleTask.fromDTO(dto);
  }

  // ===== 私有辅助方法 =====

  /**
   * 客户端任务执行逻辑
   */
  private async performClientExecution(): Promise<void> {
    // 根据任务类型执行不同的客户端逻辑
    switch (this._basic.taskType) {
      case ScheduleTaskType.TASK_REMINDER:
      case ScheduleTaskType.GOAL_REMINDER:
      case ScheduleTaskType.GENERAL_REMINDER:
        await this.showReminder();
        break;

      case ScheduleTaskType.SYSTEM_MAINTENANCE:
      case ScheduleTaskType.DATA_BACKUP:
      case ScheduleTaskType.CLEANUP_TASK:
        await this.executeSystemTask();
        break;

      default:
        console.log(`Executing task: ${this._basic.name}`);
    }
  }

  /**
   * 显示提醒
   */
  private async showReminder(): Promise<void> {
    console.log(`显示提醒: ${this._basic.name}`);
    // 实际应用中调用UI组件显示提醒
    // await this.$toast.success(this._basic.name, { description: this._basic.description });
  }

  /**
   * 执行系统任务
   */
  private async executeSystemTask(): Promise<void> {
    console.log(`执行系统任务: ${this._basic.name}`);
    // 实际应用中执行客户端系统任务
  }
}
