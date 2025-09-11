/**
 * Universal Schedule Service
 * @description 通用调度服务 - 统一管理所有类型的定时任务和提醒
 * @author DailyUse Team
 * @date 2025-01-09
 */

import { EventEmitter } from 'events';
import nodeSchedule from 'node-schedule'; // 临时注释，需要安装依赖
import {
  type IScheduleTask,
  type ScheduleTaskResponseDto,
  type CreateScheduleTaskRequestDto,
  type UpdateScheduleTaskRequestDto,
  ScheduleStatus,
  ScheduleTaskType,
  AlertMethod,
  type QuickReminderRequestDto,
  type SnoozeReminderRequestDto,
  type UpcomingTasksResponseDto,
  type ScheduleEvent,
  ScheduleEventType,
  SchedulePriority,
} from '@dailyuse/contracts';
import { generateUUID } from '../index';

/**
 * 调度任务执行器接口
 */
export interface ITaskExecutor {
  execute(task: IScheduleTask): Promise<{ success: boolean; result?: any; error?: string }>;
}

/**
 * 提醒处理器接口
 */
export interface IReminderHandler {
  handleReminder(
    task: IScheduleTask,
    methods: AlertMethod[],
  ): Promise<{ success: boolean; error?: string }>;
}

/**
 * 调度服务配置
 */
export interface ScheduleServiceConfig {
  maxConcurrentTasks: number;
  defaultRetryCount: number;
  cleanupInterval: number; // 清理间隔(小时)
  maxExecutionHistory: number; // 最大保留的执行历史数量
}

/**
 * 通用调度服务
 *
 * 核心功能：
 * 1. 统一的任务调度管理
 * 2. 多种提醒方式支持
 * 3. 任务执行监控和重试
 * 4. 事件驱动的架构
 * 5. 高可用和容错处理
 */
export class UniversalScheduleService extends EventEmitter {
  private static instance: UniversalScheduleService;
  private scheduledJobs = new Map<string, nodeSchedule.Job>();
  private runningTasks = new Map<string, { startTime: Date; task: IScheduleTask }>();
  private taskExecutors = new Map<ScheduleTaskType, ITaskExecutor>();
  private reminderHandlers = new Map<AlertMethod, IReminderHandler>();
  private config: ScheduleServiceConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: ScheduleServiceConfig) {
    super();
    this.config = config;
    this.startCleanupTimer();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(config?: ScheduleServiceConfig): UniversalScheduleService {
    if (!this.instance) {
      if (!config) {
        throw new Error('Config is required for first initialization');
      }
      this.instance = new UniversalScheduleService(config);
    }
    return this.instance;
  }

  // ==================== 任务管理 ====================

  /**
   * 创建调度任务
   */
  public async createTask(
    request: CreateScheduleTaskRequestDto,
    createdBy: string,
  ): Promise<ScheduleTaskResponseDto> {
    const uuid = generateUUID();
    const now = new Date();

    const task: IScheduleTask = {
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
      maxRetries: request.maxRetries ?? this.config.defaultRetryCount,
      currentRetries: 0,
      timeoutSeconds: request.timeoutSeconds,
      tags: request.tags,
      enabled: request.enabled ?? true,
    };

    // 验证任务配置
    const validation = this.validateTask(task);
    if (!validation.isValid) {
      throw new Error(`任务配置无效: ${validation.errors.join(', ')}`);
    }

    // 创建调度
    await this.scheduleTask(task);

    // 发布事件
    this.emitEvent({
      type: ScheduleEventType.SCHEDULE_TASK_CREATED,
      eventId: generateUUID(),
      timestamp: now,
      source: 'UniversalScheduleService',
      userId: createdBy,
      data: { task },
    });

    return this.taskToDTO(task);
  }

  /**
   * 更新调度任务
   */
  public async updateTask(
    uuid: string,
    request: UpdateScheduleTaskRequestDto,
  ): Promise<ScheduleTaskResponseDto> {
    const existingTask = await this.getTask(uuid);
    if (!existingTask) {
      throw new Error(`任务 ${uuid} 不存在`);
    }

    // 更新任务属性
    const updatedTask = { ...existingTask };
    if (request.name !== undefined) updatedTask.name = request.name;
    if (request.description !== undefined) updatedTask.description = request.description;
    if (request.scheduledTime !== undefined) updatedTask.scheduledTime = request.scheduledTime;
    if (request.recurrence !== undefined) updatedTask.recurrence = request.recurrence;
    if (request.priority !== undefined) updatedTask.priority = request.priority;
    if (request.status !== undefined) updatedTask.status = request.status;
    if (request.alertConfig !== undefined) updatedTask.alertConfig = request.alertConfig;
    if (request.maxRetries !== undefined) updatedTask.maxRetries = request.maxRetries;
    if (request.timeoutSeconds !== undefined) updatedTask.timeoutSeconds = request.timeoutSeconds;
    if (request.tags !== undefined) updatedTask.tags = request.tags;
    if (request.enabled !== undefined) updatedTask.enabled = request.enabled;

    updatedTask.updatedAt = new Date();

    // 重新调度
    this.cancelTask(uuid);
    if (updatedTask.enabled && updatedTask.status === ScheduleStatus.PENDING) {
      await this.scheduleTask(updatedTask);
    }

    // 发布事件
    this.emitEvent({
      type: ScheduleEventType.SCHEDULE_TASK_UPDATED,
      eventId: generateUUID(),
      timestamp: new Date(),
      source: 'UniversalScheduleService',
      userId: updatedTask.createdBy,
      data: {
        taskUuid: uuid,
        previousTask: existingTask,
        updatedTask,
        changes: Object.keys(request),
      },
    });

    return this.taskToDTO(updatedTask);
  }

  /**
   * 删除调度任务
   */
  public async deleteTask(uuid: string): Promise<void> {
    const task = await this.getTask(uuid);
    if (!task) {
      throw new Error(`任务 ${uuid} 不存在`);
    }

    this.cancelTask(uuid);

    // 发布事件
    this.emitEvent({
      type: ScheduleEventType.SCHEDULE_TASK_DELETED,
      eventId: generateUUID(),
      timestamp: new Date(),
      source: 'UniversalScheduleService',
      userId: task.createdBy,
      data: {
        taskUuid: uuid,
        deletedTask: task,
      },
    });
  }

  /**
   * 获取任务
   */
  public async getTask(uuid: string): Promise<IScheduleTask | null> {
    // 这里应该从仓储层获取，暂时返回 null
    // 实际实现时需要注入 IScheduleTaskRepository
    return null;
  }

  // ==================== 任务调度 ====================

  /**
   * 调度任务
   */
  private async scheduleTask(task: IScheduleTask): Promise<void> {
    if (!task.enabled || !task.nextExecutionTime) {
      return;
    }

    const job = nodeSchedule.scheduleJob(task.uuid, task.nextExecutionTime, async () => {
      await this.executeTask(task);
    });

    if (job) {
      this.scheduledJobs.set(task.uuid, job);
      console.log(`任务已调度: ${task.name} (${task.uuid}) - 执行时间: ${task.nextExecutionTime}`);
    }
  }

  /**
   * 取消任务调度
   */
  private cancelTask(uuid: string): void {
    const job = this.scheduledJobs.get(uuid);
    if (job) {
      job.cancel();
      this.scheduledJobs.delete(uuid);
      console.log(`任务调度已取消: ${uuid}`);
    }
  }

  /**
   * 执行任务
   */
  private async executeTask(task: IScheduleTask): Promise<void> {
    const executionId = generateUUID();
    const startTime = new Date();

    // 检查并发限制
    if (this.runningTasks.size >= this.config.maxConcurrentTasks) {
      console.warn(`达到最大并发限制，任务 ${task.uuid} 将延后执行`);
      await this.rescheduleTask(task, 60); // 延后1分钟
      return;
    }

    // 发布执行开始事件
    this.emitEvent({
      type: ScheduleEventType.SCHEDULE_TASK_EXECUTION_STARTED,
      eventId: generateUUID(),
      timestamp: startTime,
      source: 'UniversalScheduleService',
      userId: task.createdBy,
      data: {
        taskUuid: task.uuid,
        task,
        executionId,
        startTime,
      },
    });

    // 标记为运行中
    task.status = ScheduleStatus.RUNNING;
    this.runningTasks.set(task.uuid, { startTime, task });

    try {
      // 设置超时检查
      const timeoutPromise = this.createTimeoutPromise(task, executionId, startTime);

      // 执行任务
      const executionPromise = this.performTaskExecution(task);

      // 等待执行完成或超时
      const result = await Promise.race([executionPromise, timeoutPromise]);

      if (result.success) {
        await this.handleExecutionSuccess(task, result, startTime);
      } else {
        await this.handleExecutionFailure(task, result.error || '执行失败', startTime);
      }
    } catch (error) {
      await this.handleExecutionFailure(
        task,
        error instanceof Error ? error.message : '未知错误',
        startTime,
      );
    } finally {
      this.runningTasks.delete(task.uuid);
    }
  }

  /**
   * 执行具体任务逻辑
   */
  private async performTaskExecution(
    task: IScheduleTask,
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    // 根据任务类型选择执行器
    const executor = this.taskExecutors.get(task.taskType);
    if (executor) {
      return await executor.execute(task);
    }

    // 默认处理提醒类任务
    if (this.isReminderTask(task)) {
      return await this.handleReminderTask(task);
    }

    return { success: false, error: `未找到任务类型 ${task.taskType} 的执行器` };
  }

  /**
   * 处理提醒任务
   */
  private async handleReminderTask(
    task: IScheduleTask,
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      // 发布提醒触发事件
      this.emitEvent({
        type: ScheduleEventType.REMINDER_TRIGGERED,
        eventId: generateUUID(),
        timestamp: new Date(),
        source: 'UniversalScheduleService',
        userId: task.createdBy,
        data: {
          taskUuid: task.uuid,
          reminderType: task.taskType,
          title: task.payload.data.title || task.name,
          message: task.payload.data.message || task.description || '',
          alertMethods: task.alertConfig.methods,
          scheduledTime: task.scheduledTime,
          actualTime: new Date(),
        },
      });

      // 执行各种提醒方式
      const results = await Promise.allSettled(
        task.alertConfig.methods.map((method) => this.executeReminderMethod(task, method)),
      );

      const failedMethods = results
        .map((result, index) => ({ result, method: task.alertConfig.methods[index] }))
        .filter(({ result }) => result.status === 'rejected')
        .map(({ method }) => method);

      if (failedMethods.length > 0) {
        console.warn(`部分提醒方式执行失败: ${failedMethods.join(', ')}`);
      }

      return {
        success: true,
        result: {
          executedMethods: task.alertConfig.methods,
          failedMethods,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '提醒执行失败',
      };
    }
  }

  /**
   * 执行特定的提醒方式
   */
  private async executeReminderMethod(task: IScheduleTask, method: AlertMethod): Promise<void> {
    const handler = this.reminderHandlers.get(method);
    if (handler) {
      const result = await handler.handleReminder(task, [method]);
      if (!result.success) {
        throw new Error(result.error || `${method} 提醒执行失败`);
      }
    } else {
      // 默认处理器
      await this.defaultReminderHandler(task, method);
    }
  }

  /**
   * 默认提醒处理器
   */
  private async defaultReminderHandler(task: IScheduleTask, method: AlertMethod): Promise<void> {
    switch (method) {
      case AlertMethod.POPUP:
        // 发送弹窗通知事件
        this.emit('show-popup', {
          taskUuid: task.uuid,
          title: task.payload.data.title || task.name,
          message: task.payload.data.message || task.description,
          duration: task.alertConfig.popupDuration,
          actions: task.alertConfig.customActions,
        });
        break;

      case AlertMethod.SOUND:
        // 发送声音提醒事件
        this.emit('play-sound', {
          taskUuid: task.uuid,
          soundFile: task.alertConfig.soundFile,
          volume: task.alertConfig.soundVolume,
        });
        break;

      case AlertMethod.SYSTEM_NOTIFICATION:
        // 发送系统通知事件
        this.emit('show-system-notification', {
          taskUuid: task.uuid,
          title: task.payload.data.title || task.name,
          message: task.payload.data.message || task.description,
        });
        break;

      default:
        console.warn(`未实现的提醒方式: ${method}`);
    }
  }

  // ==================== 任务执行结果处理 ====================

  /**
   * 处理执行成功
   */
  private async handleExecutionSuccess(
    task: IScheduleTask,
    result: { success: boolean; result?: any },
    startTime: Date,
  ): Promise<void> {
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    task.status = ScheduleStatus.COMPLETED;
    task.executionCount++;
    task.currentRetries = 0;

    // 计算下次执行时间
    if (task.recurrence) {
      task.nextExecutionTime = this.calculateNextExecutionTime(task);
      if (task.nextExecutionTime) {
        task.status = ScheduleStatus.PENDING;
        await this.scheduleTask(task);
      }
    } else {
      task.nextExecutionTime = undefined;
    }

    // 发布执行完成事件
    this.emitEvent({
      type: ScheduleEventType.SCHEDULE_TASK_EXECUTION_COMPLETED,
      eventId: generateUUID(),
      timestamp: endTime,
      source: 'UniversalScheduleService',
      userId: task.createdBy,
      data: {
        taskUuid: task.uuid,
        executionResult: {
          taskUuid: task.uuid,
          executedAt: endTime,
          status: ScheduleStatus.COMPLETED,
          result: result.result,
          duration,
          nextExecutionTime: task.nextExecutionTime,
        },
      },
    });
  }

  /**
   * 处理执行失败
   */
  private async handleExecutionFailure(
    task: IScheduleTask,
    error: string,
    startTime: Date,
  ): Promise<void> {
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    task.currentRetries++;
    const willRetry = task.currentRetries < task.maxRetries;

    if (willRetry) {
      // 计算重试时间 (指数退避)
      const retryDelay = Math.min(Math.pow(2, task.currentRetries) * 60, 3600); // 最大1小时
      const retryTime = new Date();
      retryTime.setSeconds(retryTime.getSeconds() + retryDelay);

      task.nextExecutionTime = retryTime;
      task.status = ScheduleStatus.PENDING;

      await this.scheduleTask(task);

      // 发布重试事件
      this.emitEvent({
        type: ScheduleEventType.SCHEDULE_TASK_RETRY,
        eventId: generateUUID(),
        timestamp: endTime,
        source: 'UniversalScheduleService',
        userId: task.createdBy,
        data: {
          taskUuid: task.uuid,
          retryCount: task.currentRetries,
          maxRetries: task.maxRetries,
          previousError: error,
          nextRetryTime: retryTime,
        },
      });
    } else {
      // 重试次数用完，标记为失败
      task.status = ScheduleStatus.FAILED;
      task.nextExecutionTime = undefined;
    }

    // 发布执行失败事件
    this.emitEvent({
      type: ScheduleEventType.SCHEDULE_TASK_EXECUTION_FAILED,
      eventId: generateUUID(),
      timestamp: endTime,
      source: 'UniversalScheduleService',
      userId: task.createdBy,
      data: {
        taskUuid: task.uuid,
        task,
        error,
        executionId: generateUUID(),
        retryCount: task.currentRetries,
        willRetry,
      },
    });
  }

  // ==================== 便捷方法 ====================

  /**
   * 创建快速提醒
   */
  public async createQuickReminder(
    request: QuickReminderRequestDto,
    createdBy: string,
  ): Promise<ScheduleTaskResponseDto> {
    const createRequest: CreateScheduleTaskRequestDto = {
      name: request.title,
      description: `快速提醒: ${request.message}`,
      taskType: ScheduleTaskType.GENERAL_REMINDER,
      payload: {
        type: ScheduleTaskType.GENERAL_REMINDER,
        data: {
          title: request.title,
          message: request.message,
        },
      },
      scheduledTime: request.reminderTime,
      priority: request.priority || SchedulePriority.NORMAL,
      alertConfig: {
        methods: request.methods || [AlertMethod.POPUP, AlertMethod.SOUND],
        allowSnooze: request.allowSnooze ?? true,
        snoozeOptions: [5, 10, 15, 30, 60],
        popupDuration: 10,
      },
      maxRetries: 1,
      tags: request.tags,
      enabled: true,
    };

    return await this.createTask(createRequest, createdBy);
  }

  /**
   * 延后提醒
   */
  public async snoozeReminder(request: SnoozeReminderRequestDto): Promise<ScheduleTaskResponseDto> {
    const task = await this.getTask(request.taskUuid);
    if (!task) {
      throw new Error(`任务 ${request.taskUuid} 不存在`);
    }

    const snoozeTime = new Date();
    snoozeTime.setMinutes(snoozeTime.getMinutes() + request.snoozeMinutes);

    // 发布延后事件
    this.emitEvent({
      type: ScheduleEventType.REMINDER_SNOOZED,
      eventId: generateUUID(),
      timestamp: new Date(),
      source: 'UniversalScheduleService',
      userId: task.createdBy,
      data: {
        taskUuid: request.taskUuid,
        originalTime: task.scheduledTime,
        snoozeMinutes: request.snoozeMinutes,
        newTime: snoozeTime,
        reason: request.reason,
      },
    });

    return await this.updateTask(request.taskUuid, {
      scheduledTime: snoozeTime,
      status: ScheduleStatus.PENDING,
    });
  }

  /**
   * 获取即将到来的任务
   */
  public async getUpcomingTasks(withinHours: number = 1): Promise<UpcomingTasksResponseDto> {
    const now = new Date();
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() + withinHours);

    const upcomingTasks: UpcomingTasksResponseDto['tasks'] = [];

    // 从调度的任务中找到即将执行的
    for (const [uuid, job] of this.scheduledJobs) {
      const nextInvocation = job.nextInvocation();
      if (nextInvocation && nextInvocation >= now && nextInvocation <= cutoffTime) {
        const task = await this.getTask(uuid);
        if (task) {
          const minutesUntil = Math.round((nextInvocation.getTime() - now.getTime()) / (1000 * 60));
          upcomingTasks.push({
            uuid: task.uuid,
            name: task.name,
            taskType: task.taskType,
            scheduledTime: nextInvocation,
            priority: task.priority,
            alertConfig: task.alertConfig,
            minutesUntil,
          });
        }
      }
    }

    // 按时间排序
    upcomingTasks.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());

    return {
      tasks: upcomingTasks,
      withinHours,
      queryTime: now,
    };
  }

  // ==================== 工具方法 ====================

  /**
   * 注册任务执行器
   */
  public registerTaskExecutor(taskType: ScheduleTaskType, executor: ITaskExecutor): void {
    this.taskExecutors.set(taskType, executor);
  }

  /**
   * 注册提醒处理器
   */
  public registerReminderHandler(method: AlertMethod, handler: IReminderHandler): void {
    this.reminderHandlers.set(method, handler);
  }

  /**
   * 发布事件
   */
  private emitEvent(event: ScheduleEvent): void {
    this.emit('scheduleEvent', event);
    this.emit(event.type, event);
  }

  /**
   * 验证任务配置
   */
  private validateTask(task: IScheduleTask): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!task.name?.trim()) errors.push('任务名称不能为空');
    if (!task.scheduledTime) errors.push('计划执行时间不能为空');
    if (task.scheduledTime && task.scheduledTime < new Date())
      errors.push('计划执行时间不能早于当前时间');
    if (!task.alertConfig?.methods?.length) errors.push('至少需要配置一种提醒方式');

    return { isValid: errors.length === 0, errors };
  }

  /**
   * 判断是否为提醒任务
   */
  private isReminderTask(task: IScheduleTask): boolean {
    return [
      ScheduleTaskType.TASK_REMINDER,
      ScheduleTaskType.GOAL_REMINDER,
      ScheduleTaskType.GENERAL_REMINDER,
    ].includes(task.taskType);
  }

  /**
   * 计算下次执行时间
   */
  private calculateNextExecutionTime(task: IScheduleTask): Date | undefined {
    // 这里应该有完整的重复规则计算逻辑
    // 暂时返回简单的逻辑
    if (!task.recurrence) return undefined;

    const next = new Date(task.scheduledTime);
    next.setDate(next.getDate() + 1); // 简单的每日重复
    return next;
  }

  /**
   * 创建超时Promise
   */
  private createTimeoutPromise(
    task: IScheduleTask,
    executionId: string,
    startTime: Date,
  ): Promise<{ success: boolean; error: string }> {
    if (!task.timeoutSeconds) {
      return new Promise(() => {}); // 永不resolve的Promise
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        this.emitEvent({
          type: ScheduleEventType.SCHEDULE_TASK_TIMEOUT,
          eventId: generateUUID(),
          timestamp: new Date(),
          source: 'UniversalScheduleService',
          userId: task.createdBy,
          data: {
            taskUuid: task.uuid,
            timeoutSeconds: task.timeoutSeconds!,
            executionId,
            startTime,
            timeoutTime: new Date(),
          },
        });

        resolve({ success: false, error: `任务执行超时 (${task.timeoutSeconds!}秒)` });
      }, task.timeoutSeconds! * 1000);
    });
  }

  /**
   * 重新调度任务
   */
  private async rescheduleTask(task: IScheduleTask, delaySeconds: number): Promise<void> {
    const newTime = new Date();
    newTime.setSeconds(newTime.getSeconds() + delaySeconds);

    task.nextExecutionTime = newTime;
    await this.scheduleTask(task);
  }

  /**
   * 转换为DTO
   */
  private taskToDTO(task: IScheduleTask): ScheduleTaskResponseDto {
    return {
      uuid: task.uuid,
      name: task.name,
      description: task.description,
      taskType: task.taskType,
      payload: task.payload,
      scheduledTime: task.scheduledTime,
      recurrence: task.recurrence,
      priority: task.priority,
      status: task.status,
      alertConfig: task.alertConfig,
      createdBy: task.createdBy,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      nextExecutionTime: task.nextExecutionTime,
      executionCount: task.executionCount,
      maxRetries: task.maxRetries,
      currentRetries: task.currentRetries,
      timeoutSeconds: task.timeoutSeconds,
      tags: task.tags,
      enabled: task.enabled,
    };
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(
      () => {
        this.performCleanup();
      },
      this.config.cleanupInterval * 60 * 60 * 1000,
    ); // 转换为毫秒
  }

  /**
   * 执行清理任务
   */
  private performCleanup(): void {
    // 清理已完成的一次性任务
    // 清理过期的执行历史
    // 这里应该调用仓储层的清理方法
    console.log('执行调度服务清理任务');
  }

  /**
   * 停止服务
   */
  public stop(): void {
    // 取消所有调度任务
    for (const [uuid, job] of this.scheduledJobs) {
      job.cancel();
    }
    this.scheduledJobs.clear();

    // 停止清理定时器
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    // 发布系统关闭事件
    this.emitEvent({
      type: ScheduleEventType.SCHEDULE_SYSTEM_SHUTDOWN,
      eventId: generateUUID(),
      timestamp: new Date(),
      source: 'UniversalScheduleService',
      userId: 'system',
      data: {
        shutdownTime: new Date(),
        reason: 'Service stop requested',
        pendingTasks: this.scheduledJobs.size,
        gracefulShutdown: true,
      },
    });

    console.log('调度服务已停止');
  }
}
