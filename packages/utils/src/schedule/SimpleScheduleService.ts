/**
 * Simple Schedule Service
 * @description 简化版调度服务 - 统一管理定时任务和提醒
 * @author DailyUse Team
 * @date 2025-01-09
 */

import { EventEmitter } from 'events';
import {
  ScheduleStatus,
  ScheduleTaskType,
  AlertMethod,
  SchedulePriority,
} from '@dailyuse/contracts';
import { generateUUID } from '../index';

/**
 * 调度任务简化接口
 */
export interface SimpleScheduleTask {
  uuid: string;
  name: string;
  taskType: ScheduleTaskType;
  scheduledTime: Date;
  priority: SchedulePriority;
  alertMethods: AlertMethod[];
  payload: any;
  enabled: boolean;
  createdBy: string;
}

/**
 * 提醒事件数据
 */
export interface ReminderEventData {
  taskUuid: string;
  title: string;
  message: string;
  alertMethods: AlertMethod[];
  priority: SchedulePriority;
  scheduledTime: Date;
  actualTime: Date;
  payload?: any;
}

/**
 * 简化版调度服务
 *
 * 功能：
 * 1. 基于setTimeout的简单调度
 * 2. 支持多种提醒方式
 * 3. 事件驱动架构
 * 4. 任务管理功能
 */
export class SimpleScheduleService extends EventEmitter {
  private static instance: SimpleScheduleService;
  private scheduledTasks = new Map<string, NodeJS.Timeout>();
  private activeTasks = new Map<string, SimpleScheduleTask>();

  private constructor() {
    super();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): SimpleScheduleService {
    if (!this.instance) {
      this.instance = new SimpleScheduleService();
    }
    return this.instance;
  }

  /**
   * 创建调度任务
   */
  public createSchedule(task: SimpleScheduleTask): string {
    const uuid = task.uuid || generateUUID();

    // 计算延迟时间
    const now = new Date();
    const delay = task.scheduledTime.getTime() - now.getTime();

    if (delay <= 0) {
      console.warn(`任务 ${task.name} 的调度时间已过期，将立即执行`);
      setTimeout(() => this.executeTask(task), 0);
      return uuid;
    }

    // 创建定时器
    const timer = setTimeout(() => {
      this.executeTask(task);
    }, delay);

    // 保存任务和定时器
    this.scheduledTasks.set(uuid, timer);
    this.activeTasks.set(uuid, { ...task, uuid });

    console.log(
      `任务已调度: ${task.name} (${uuid}) - 执行时间: ${task.scheduledTime.toISOString()}`,
    );

    return uuid;
  }

  /**
   * 取消调度任务
   */
  public cancelSchedule(uuid: string): boolean {
    const timer = this.scheduledTasks.get(uuid);
    if (timer) {
      clearTimeout(timer);
      this.scheduledTasks.delete(uuid);
      this.activeTasks.delete(uuid);
      console.log(`任务调度已取消: ${uuid}`);
      return true;
    }
    return false;
  }

  /**
   * 更新调度任务
   */
  public updateSchedule(uuid: string, updates: Partial<SimpleScheduleTask>): boolean {
    const existingTask = this.activeTasks.get(uuid);
    if (!existingTask) {
      return false;
    }

    // 取消现有调度
    this.cancelSchedule(uuid);

    // 创建新的调度
    const updatedTask = { ...existingTask, ...updates, uuid };
    this.createSchedule(updatedTask);

    return true;
  }

  /**
   * 延后任务
   */
  public snoozeTask(uuid: string, delayMinutes: number): boolean {
    const task = this.activeTasks.get(uuid);
    if (!task) {
      return false;
    }

    const newTime = new Date();
    newTime.setMinutes(newTime.getMinutes() + delayMinutes);

    return this.updateSchedule(uuid, { scheduledTime: newTime });
  }

  /**
   * 获取任务信息
   */
  public getTask(uuid: string): SimpleScheduleTask | undefined {
    return this.activeTasks.get(uuid);
  }

  /**
   * 获取所有活跃任务
   */
  public getAllTasks(): SimpleScheduleTask[] {
    return Array.from(this.activeTasks.values());
  }

  /**
   * 获取即将到来的任务
   */
  public getUpcomingTasks(withinMinutes: number = 60): Array<{
    task: SimpleScheduleTask;
    minutesUntil: number;
  }> {
    const now = new Date();
    const cutoffTime = new Date(now.getTime() + withinMinutes * 60 * 1000);

    return Array.from(this.activeTasks.values())
      .filter((task) => task.scheduledTime <= cutoffTime && task.scheduledTime > now)
      .map((task) => ({
        task,
        minutesUntil: Math.round((task.scheduledTime.getTime() - now.getTime()) / (60 * 1000)),
      }))
      .sort((a, b) => a.task.scheduledTime.getTime() - b.task.scheduledTime.getTime());
  }

  /**
   * 创建快速提醒
   */
  public createQuickReminder(
    title: string,
    message: string,
    reminderTime: Date,
    options?: {
      priority?: SchedulePriority;
      alertMethods?: AlertMethod[];
      createdBy?: string;
    },
  ): string {
    const task: SimpleScheduleTask = {
      uuid: generateUUID(),
      name: title,
      taskType: ScheduleTaskType.GENERAL_REMINDER,
      scheduledTime: reminderTime,
      priority: options?.priority || SchedulePriority.NORMAL,
      alertMethods: options?.alertMethods || [AlertMethod.POPUP, AlertMethod.SOUND],
      payload: { title, message },
      enabled: true,
      createdBy: options?.createdBy || 'unknown',
    };

    return this.createSchedule(task);
  }

  /**
   * 创建任务提醒
   */
  public createTaskReminder(
    taskId: string,
    title: string,
    message: string,
    reminderTime: Date,
    alertMethods: AlertMethod[] = [AlertMethod.POPUP],
    createdBy: string = 'system',
  ): string {
    const task: SimpleScheduleTask = {
      uuid: generateUUID(),
      name: `任务提醒: ${title}`,
      taskType: ScheduleTaskType.TASK_REMINDER,
      scheduledTime: reminderTime,
      priority: SchedulePriority.NORMAL,
      alertMethods,
      payload: { taskId, title, message },
      enabled: true,
      createdBy,
    };

    return this.createSchedule(task);
  }

  /**
   * 创建目标提醒
   */
  public createGoalReminder(
    goalId: string,
    title: string,
    message: string,
    reminderTime: Date,
    alertMethods: AlertMethod[] = [AlertMethod.POPUP],
    createdBy: string = 'system',
  ): string {
    const task: SimpleScheduleTask = {
      uuid: generateUUID(),
      name: `目标提醒: ${title}`,
      taskType: ScheduleTaskType.GOAL_REMINDER,
      scheduledTime: reminderTime,
      priority: SchedulePriority.NORMAL,
      alertMethods,
      payload: { goalId, title, message },
      enabled: true,
      createdBy,
    };

    return this.createSchedule(task);
  }

  /**
   * 执行任务
   */
  private executeTask(task: SimpleScheduleTask): void {
    console.log(`执行任务: ${task.name} (${task.uuid})`);

    // 清理任务记录
    this.scheduledTasks.delete(task.uuid);
    this.activeTasks.delete(task.uuid);

    // 创建提醒事件数据
    const reminderData: ReminderEventData = {
      taskUuid: task.uuid,
      title: task.payload?.title || task.name,
      message: task.payload?.message || '',
      alertMethods: task.alertMethods,
      priority: task.priority,
      scheduledTime: task.scheduledTime,
      actualTime: new Date(),
      payload: task.payload,
    };

    // 发布通用提醒事件
    this.emit('reminder-triggered', reminderData);

    // 发布特定类型的事件
    switch (task.taskType) {
      case ScheduleTaskType.TASK_REMINDER:
        this.emit('task-reminder', reminderData);
        break;
      case ScheduleTaskType.GOAL_REMINDER:
        this.emit('goal-reminder', reminderData);
        break;
      case ScheduleTaskType.GENERAL_REMINDER:
        this.emit('general-reminder', reminderData);
        break;
      default:
        this.emit('unknown-reminder', reminderData);
    }

    // 根据提醒方式执行具体操作
    this.handleAlertMethods(reminderData);
  }

  /**
   * 处理具体的提醒方式
   */
  private handleAlertMethods(reminderData: ReminderEventData): void {
    for (const method of reminderData.alertMethods) {
      switch (method) {
        case AlertMethod.POPUP:
          this.emit('show-popup-reminder', {
            uuid: reminderData.taskUuid,
            title: reminderData.title,
            message: reminderData.message,
            priority: reminderData.priority,
          });
          break;

        case AlertMethod.SOUND:
          this.emit('play-reminder-sound', {
            uuid: reminderData.taskUuid,
            priority: reminderData.priority,
          });
          break;

        case AlertMethod.SYSTEM_NOTIFICATION:
          this.emit('show-system-notification', {
            uuid: reminderData.taskUuid,
            title: reminderData.title,
            message: reminderData.message,
          });
          break;

        case AlertMethod.DESKTOP_FLASH:
          this.emit('flash-desktop', {
            uuid: reminderData.taskUuid,
            priority: reminderData.priority,
          });
          break;

        default:
          console.warn(`未实现的提醒方式: ${method}`);
      }
    }
  }

  /**
   * 清理过期任务
   */
  public cleanup(): number {
    let cleaned = 0;
    const now = new Date();

    for (const [uuid, task] of this.activeTasks) {
      if (task.scheduledTime < now) {
        this.cancelSchedule(uuid);
        cleaned++;
      }
    }

    console.log(`清理了 ${cleaned} 个过期任务`);
    return cleaned;
  }

  /**
   * 获取服务状态
   */
  public getStatus(): {
    totalTasks: number;
    scheduledTasks: number;
    upcomingTasks: number;
  } {
    const upcomingCount = this.getUpcomingTasks(60).length;

    return {
      totalTasks: this.activeTasks.size,
      scheduledTasks: this.scheduledTasks.size,
      upcomingTasks: upcomingCount,
    };
  }

  /**
   * 停止服务
   */
  public stop(): void {
    // 取消所有定时器
    for (const [uuid, timer] of this.scheduledTasks) {
      clearTimeout(timer);
    }

    this.scheduledTasks.clear();
    this.activeTasks.clear();

    console.log('简化调度服务已停止');
  }
}

// 导出单例实例
export const scheduleService = SimpleScheduleService.getInstance();
