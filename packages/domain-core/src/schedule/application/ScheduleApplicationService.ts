/**
 * Schedule 应用服务
 * @description 协调Schedule模块的业务流程，处理事件和对外接口
 * @author DailyUse Team
 * @date 2025-01-09
 */

import { eventBus } from '@dailyuse/utils';
import {
  ScheduleStatus,
  ScheduleTaskType,
  SchedulePriority,
  AlertMethod,
} from '@dailyuse/contracts';

import type { IScheduleTask, IScheduleTaskPayload, IAlertConfig } from '@dailyuse/contracts';

import { ScheduleTask } from '../aggregates/ScheduleTask';
import { ScheduleDomainService } from '../services/ScheduleDomainService';

/**
 * Schedule模块应用服务
 * 负责：
 * 1. 处理来自其他模块的调度请求
 * 2. 管理调度任务的生命周期
 * 3. 协调领域服务和基础设施
 * 4. 发布和处理领域事件
 */
export class ScheduleApplicationService {
  private domainService: ScheduleDomainService;
  private activeTasks = new Map<string, ScheduleTask>();
  private timers = new Map<string, any>(); // 存储定时器

  constructor() {
    this.domainService = new ScheduleDomainService();
    this.registerEventHandlers();
  }

  // ========== 对外接口方法 ==========

  /**
   * 创建调度任务
   * 供其他模块调用的主要接口
   */
  async createScheduleTask(params: {
    name: string;
    taskType: ScheduleTaskType;
    payload: IScheduleTaskPayload;
    scheduledTime: Date;
    createdBy: string;
    description?: string;
    priority?: SchedulePriority;
    alertConfig?: IAlertConfig;
    maxRetries?: number;
    tags?: string[];
  }): Promise<{ success: boolean; taskId?: string; message?: string }> {
    try {
      // 1. 验证调度时间
      const timeValidation = this.domainService.validateScheduleTime(params.scheduledTime);
      if (!timeValidation.isValid) {
        return { success: false, message: timeValidation.message };
      }

      // 2. 验证提醒配置
      if (params.alertConfig) {
        const alertValidation = this.domainService.validateAlertConfig(params.alertConfig);
        if (!alertValidation.isValid) {
          return { success: false, message: alertValidation.message };
        }
      }

      // 3. 验证载荷数据
      const payloadValidation = this.domainService.validateTaskPayload(params.payload);
      if (!payloadValidation.isValid) {
        return { success: false, message: payloadValidation.message };
      }

      // 4. 创建任务
      const task = ScheduleTask.create(params);

      // 5. 检查任务冲突
      const conflictCheck = this.domainService.checkTaskConflicts(
        task,
        Array.from(this.activeTasks.values()),
      );
      if (conflictCheck.hasConflict) {
        console.warn(`任务 ${task.name} 存在时间冲突，但仍然创建`);
      }

      // 6. 启动调度
      this.activeTasks.set(task.uuid, task);
      this.scheduleTask(task);

      // 7. 处理领域事件
      this.processDomainEvents(task);

      console.log(`调度任务已创建并启动: ${task.name} (${task.uuid})`);
      return { success: true, taskId: task.uuid };
    } catch (error) {
      console.error('创建调度任务失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '创建任务失败',
      };
    }
  }

  /**
   * 取消调度任务
   */
  async cancelScheduleTask(taskId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const task = this.activeTasks.get(taskId);
      if (!task) {
        return { success: false, message: '任务不存在' };
      }

      // 取消定时器
      this.clearTimer(taskId);

      // 调用领域方法
      task.cancel();

      // 处理领域事件
      this.processDomainEvents(task);

      // 从活跃任务中移除
      this.activeTasks.delete(taskId);

      return { success: true };
    } catch (error) {
      console.error('取消调度任务失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '取消任务失败',
      };
    }
  }

  /**
   * 重新调度任务
   */
  async rescheduleTask(
    taskId: string,
    newScheduledTime: Date,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const task = this.activeTasks.get(taskId);
      if (!task) {
        return { success: false, message: '任务不存在' };
      }

      // 验证新的调度时间
      const timeValidation = this.domainService.validateScheduleTime(newScheduledTime);
      if (!timeValidation.isValid) {
        return { success: false, message: timeValidation.message };
      }

      // 清除旧的定时器
      this.clearTimer(taskId);

      // 重新调度
      task.reschedule(newScheduledTime);

      // 设置新的定时器
      this.scheduleTask(task);

      // 处理领域事件
      this.processDomainEvents(task);

      return { success: true };
    } catch (error) {
      console.error('重新调度任务失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '重新调度失败',
      };
    }
  }

  /**
   * 延后任务
   */
  async snoozeTask(
    taskId: string,
    delayMinutes: number,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const task = this.activeTasks.get(taskId);
      if (!task) {
        return { success: false, message: '任务不存在' };
      }

      // 清除当前定时器
      this.clearTimer(taskId);

      // 延后任务
      task.snoozeReminder(delayMinutes);

      // 重新调度
      this.scheduleTask(task);

      // 处理领域事件
      this.processDomainEvents(task);

      return { success: true };
    } catch (error) {
      console.error('延后任务失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '延后失败',
      };
    }
  }

  /**
   * 确认提醒
   */
  async acknowledgeReminder(taskId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const task = this.activeTasks.get(taskId);
      if (!task) {
        return { success: false, message: '任务不存在' };
      }

      // 确认提醒
      task.acknowledgeReminder();

      // 处理领域事件
      this.processDomainEvents(task);

      // 如果任务完成，清理资源
      if (task.status === ScheduleStatus.COMPLETED) {
        this.cleanupTask(taskId);
      }

      return { success: true };
    } catch (error) {
      console.error('确认提醒失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '确认失败',
      };
    }
  }

  /**
   * 忽略提醒
   */
  async dismissReminder(taskId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const task = this.activeTasks.get(taskId);
      if (!task) {
        return { success: false, message: '任务不存在' };
      }

      // 忽略提醒
      task.dismissReminder();

      // 处理领域事件
      this.processDomainEvents(task);

      // 如果任务完成，清理资源
      if (task.status === ScheduleStatus.COMPLETED) {
        this.cleanupTask(taskId);
      }

      return { success: true };
    } catch (error) {
      console.error('忽略提醒失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '忽略失败',
      };
    }
  }

  /**
   * 获取任务信息
   */
  getTask(taskId: string): ScheduleTask | undefined {
    return this.activeTasks.get(taskId);
  }

  /**
   * 获取所有活跃任务
   */
  getAllActiveTasks(): ScheduleTask[] {
    return Array.from(this.activeTasks.values());
  }

  /**
   * 获取即将到来的任务
   */
  getUpcomingTasks(withinMinutes: number = 60): Array<{
    task: ScheduleTask;
    minutesUntil: number;
  }> {
    const now = new Date();
    const cutoffTime = new Date(now.getTime() + withinMinutes * 60 * 1000);

    return Array.from(this.activeTasks.values())
      .filter(
        (task) =>
          task.status === ScheduleStatus.PENDING &&
          task.scheduledTime <= cutoffTime &&
          task.scheduledTime > now,
      )
      .map((task) => ({
        task,
        minutesUntil: Math.round((task.scheduledTime.getTime() - now.getTime()) / (60 * 1000)),
      }))
      .sort((a, b) => a.task.scheduledTime.getTime() - b.task.scheduledTime.getTime());
  }

  // ========== 便利方法 ==========

  /**
   * 创建快速提醒
   */
  async createQuickReminder(params: {
    title: string;
    message: string;
    reminderTime: Date;
    createdBy: string;
    priority?: SchedulePriority;
    alertMethods?: AlertMethod[];
  }): Promise<{ success: boolean; taskId?: string; message?: string }> {
    return this.createScheduleTask({
      name: params.title,
      taskType: ScheduleTaskType.GENERAL_REMINDER,
      payload: {
        type: ScheduleTaskType.GENERAL_REMINDER,
        data: {
          title: params.title,
          message: params.message,
        },
      },
      scheduledTime: params.reminderTime,
      createdBy: params.createdBy,
      description: params.message,
      priority: params.priority || SchedulePriority.NORMAL,
      alertConfig: {
        methods: params.alertMethods || [AlertMethod.POPUP, AlertMethod.SOUND],
        allowSnooze: true,
        snoozeOptions: [5, 10, 15, 30],
      },
    });
  }

  /**
   * 创建任务提醒
   */
  async createTaskReminder(params: {
    taskId: string;
    taskTitle: string;
    reminderTime: Date;
    createdBy: string;
    alertMethods?: AlertMethod[];
    priority?: SchedulePriority;
  }): Promise<{ success: boolean; taskId?: string; message?: string }> {
    return this.createScheduleTask({
      name: `任务提醒: ${params.taskTitle}`,
      taskType: ScheduleTaskType.TASK_REMINDER,
      payload: {
        type: ScheduleTaskType.TASK_REMINDER,
        data: {
          sourceId: params.taskId,
          title: params.taskTitle,
          message: `您有一个任务需要处理: ${params.taskTitle}`,
        },
      },
      scheduledTime: params.reminderTime,
      createdBy: params.createdBy,
      priority: params.priority || SchedulePriority.NORMAL,
      alertConfig: {
        methods: params.alertMethods || [AlertMethod.POPUP],
        allowSnooze: true,
        snoozeOptions: [5, 10, 15],
      },
      tags: ['task-reminder', params.taskId],
    });
  }

  /**
   * 创建目标提醒
   */
  async createGoalReminder(params: {
    goalId: string;
    goalTitle: string;
    reminderTime: Date;
    createdBy: string;
    alertMethods?: AlertMethod[];
    priority?: SchedulePriority;
  }): Promise<{ success: boolean; taskId?: string; message?: string }> {
    return this.createScheduleTask({
      name: `目标提醒: ${params.goalTitle}`,
      taskType: ScheduleTaskType.GOAL_REMINDER,
      payload: {
        type: ScheduleTaskType.GOAL_REMINDER,
        data: {
          sourceId: params.goalId,
          title: params.goalTitle,
          message: `您需要关注目标进展: ${params.goalTitle}`,
        },
      },
      scheduledTime: params.reminderTime,
      createdBy: params.createdBy,
      priority: params.priority || SchedulePriority.NORMAL,
      alertConfig: {
        methods: params.alertMethods || [AlertMethod.POPUP],
        allowSnooze: true,
        snoozeOptions: [5, 10, 15],
      },
      tags: ['goal-reminder', params.goalId],
    });
  }

  // ========== 私有方法 ==========

  /**
   * 调度任务（设置定时器）
   */
  private scheduleTask(task: ScheduleTask): void {
    const now = new Date();
    const delay = task.scheduledTime.getTime() - now.getTime();

    if (delay <= 0) {
      // 立即执行
      setTimeout(() => this.executeTask(task), 0);
    } else {
      // 设置定时器
      const timer = setTimeout(() => this.executeTask(task), delay);
      this.timers.set(task.uuid, timer);
    }
  }

  /**
   * 执行任务
   */
  private executeTask(task: ScheduleTask): void {
    try {
      console.log(`执行调度任务: ${task.name} (${task.uuid})`);

      // 清除定时器
      this.clearTimer(task.uuid);

      // 执行任务
      task.execute();

      // 处理领域事件
      this.processDomainEvents(task);
    } catch (error) {
      console.error(`任务执行失败: ${task.uuid}`, error);
      task.completeExecution(undefined, error instanceof Error ? error.message : '未知错误');
      this.processDomainEvents(task);
    }
  }

  /**
   * 清除定时器
   */
  private clearTimer(taskId: string): void {
    const timer = this.timers.get(taskId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(taskId);
    }
  }

  /**
   * 清理已完成的任务
   */
  private cleanupTask(taskId: string): void {
    this.clearTimer(taskId);
    this.activeTasks.delete(taskId);
    console.log(`已清理任务: ${taskId}`);
  }

  /**
   * 处理领域事件
   */
  private processDomainEvents(task: ScheduleTask): void {
    const events = task.domainEvents;

    for (const event of events) {
      this.handleDomainEvent(event);
    }

    // 清空事件
    task.clearDomainEvents();
  }

  /**
   * 处理单个领域事件
   */
  private handleDomainEvent(event: any): void {
    console.log(`处理领域事件: ${event.type}`, event.data);

    // 通过事件总线发布事件
    eventBus.send(`schedule:${event.type.toLowerCase()}`, {
      ...event.data,
      timestamp: event.timestamp,
    });

    // 处理特定事件类型
    switch (event.type) {
      case 'ReminderTriggered':
        this.handleReminderTriggered(event.data);
        break;
      case 'TaskReminderTriggered':
        this.handleTaskReminderTriggered(event.data);
        break;
      case 'GoalReminderTriggered':
        this.handleGoalReminderTriggered(event.data);
        break;
      case 'ScheduleTaskCompleted':
        this.handleTaskCompleted(event.data);
        break;
      case 'ScheduleTaskFailed':
        this.handleTaskFailed(event.data);
        break;
    }
  }

  /**
   * 处理提醒触发事件
   */
  private handleReminderTriggered(eventData: any): void {
    // 根据提醒方式执行具体操作
    for (const method of eventData.alertMethods) {
      switch (method) {
        case AlertMethod.POPUP:
          eventBus.send('ui:show-popup-reminder', {
            taskId: eventData.taskUuid,
            title: eventData.title,
            message: eventData.message,
            priority: eventData.priority,
            alertConfig: eventData.alertConfig,
          });
          break;

        case AlertMethod.SOUND:
          eventBus.send('ui:play-reminder-sound', {
            taskId: eventData.taskUuid,
            priority: eventData.priority,
            soundFile: eventData.alertConfig?.soundFile,
            volume: eventData.alertConfig?.soundVolume || 80,
          });
          break;

        case AlertMethod.SYSTEM_NOTIFICATION:
          eventBus.send('system:show-notification', {
            title: eventData.title,
            body: eventData.message,
            icon: 'reminder',
          });
          break;

        case AlertMethod.DESKTOP_FLASH:
          eventBus.send('system:flash-window', {
            taskId: eventData.taskUuid,
          });
          break;
      }
    }
  }

  /**
   * 处理任务提醒触发事件
   */
  private handleTaskReminderTriggered(eventData: any): void {
    // 通知Task模块
    eventBus.send('task:reminder-triggered', {
      taskId: eventData.payload?.data?.sourceId,
      reminderTime: eventData.actualTime,
    });
  }

  /**
   * 处理目标提醒触发事件
   */
  private handleGoalReminderTriggered(eventData: any): void {
    // 通知Goal模块
    eventBus.send('goal:reminder-triggered', {
      goalId: eventData.payload?.data?.sourceId,
      reminderTime: eventData.actualTime,
    });
  }

  /**
   * 处理任务完成事件
   */
  private handleTaskCompleted(eventData: any): void {
    // 延迟清理，给UI一些时间显示完成状态
    setTimeout(() => {
      this.cleanupTask(eventData.taskUuid);
    }, 5000);
  }

  /**
   * 处理任务失败事件
   */
  private handleTaskFailed(eventData: any): void {
    console.error(`任务执行失败: ${eventData.taskUuid}`, eventData.error);

    // 发送失败通知
    eventBus.send('ui:show-error-notification', {
      title: '任务执行失败',
      message: `任务执行失败: ${eventData.error}`,
    });

    // 延迟清理失败的任务
    setTimeout(() => {
      this.cleanupTask(eventData.taskUuid);
    }, 30000); // 30秒后清理
  }

  /**
   * 注册事件处理器
   */
  private registerEventHandlers(): void {
    // 监听来自其他模块的调度请求
    eventBus.on('schedule:create-task-reminder', async (data: any) => {
      await this.createTaskReminder(data);
    });

    eventBus.on('schedule:create-goal-reminder', async (data: any) => {
      await this.createGoalReminder(data);
    });

    eventBus.on('schedule:cancel-task-reminders', async (data: { sourceId: string }) => {
      const tasksToCancel = Array.from(this.activeTasks.values()).filter(
        (task) => task.payload.data.sourceId === data.sourceId,
      );

      for (const task of tasksToCancel) {
        await this.cancelScheduleTask(task.uuid);
      }
    });

    eventBus.on(
      'schedule:reschedule-task-reminders',
      async (data: {
        sourceId: string;
        newReminders: Array<{ reminderTime: Date; alertMethods?: AlertMethod[] }>;
      }) => {
        // 取消现有提醒
        await this.handleCancelTaskReminders({ sourceId: data.sourceId });

        // TODO: 创建新的提醒 - 需要从原任务获取更多信息
      },
    );
  }

  /**
   * 处理取消任务提醒事件
   */
  private async handleCancelTaskReminders(data: { sourceId: string }): Promise<void> {
    const tasksToCancel = Array.from(this.activeTasks.values()).filter(
      (task) => task.payload.data.sourceId === data.sourceId,
    );

    for (const task of tasksToCancel) {
      await this.cancelScheduleTask(task.uuid);
    }
  }

  /**
   * 清理所有资源
   */
  cleanup(): void {
    // 清除所有定时器
    for (const [taskId, timer] of this.timers) {
      clearTimeout(timer);
    }
    this.timers.clear();

    // 清空活跃任务
    this.activeTasks.clear();

    console.log('Schedule应用服务已清理');
  }

  /**
   * 获取服务状态
   */
  getStatus(): {
    totalTasks: number;
    pendingTasks: number;
    runningTasks: number;
    upcomingTasks: number;
  } {
    const tasks = Array.from(this.activeTasks.values());
    const upcomingTasks = this.getUpcomingTasks(60);

    return {
      totalTasks: tasks.length,
      pendingTasks: tasks.filter((t) => t.status === ScheduleStatus.PENDING).length,
      runningTasks: tasks.filter((t) => t.status === ScheduleStatus.RUNNING).length,
      upcomingTasks: upcomingTasks.length,
    };
  }
}
