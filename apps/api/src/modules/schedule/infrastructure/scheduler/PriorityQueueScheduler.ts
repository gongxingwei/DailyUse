/**
 * Priority Queue Based Schedule Task Scheduler
 * @description 基于优先队列的调度任务执行器 - 使用 setTimeout 精确调度
 * @author DailyUse Team
 * @date 2025-01-10
 */

import type { PrismaClient } from '@prisma/client';
import { createLogger } from '@dailyuse/utils';
import { getEventBus } from '@dailyuse/domain-core';
import { TaskTriggeredEvent } from '../../domain/events/ScheduleEvents';
import { PriorityQueue } from './PriorityQueue';

const logger = createLogger('PriorityQueueScheduler');

/**
 * 调度任务信息
 */
interface ScheduledTaskInfo {
  uuid: string;
  accountUuid: string;
  title: string;
  taskType: string;
  priority: string;
  nextRunAt: Date;
  nextScheduledAt?: Date;
  payload: any;
  alertConfig: any;
  recurrence: any;
  executionCount: number;
  executionCount: number;
}

/**
 * 基于优先队列的调度器
 *
 * 优化点：
 * 1. 使用优先队列管理任务，O(log n) 复杂度
 * 2. 使用 setTimeout 精确调度，延迟 <100ms
 * 3. 减少数据库查询，从轮询变为按需加载
 * 4. 支持动态添加/移除任务
 *
 * 对比轮询调度器：
 * - 轮询延迟：0-60秒（平均30秒）
 * - 优先队列延迟：<100ms
 * - 数据库查询：从每分钟1次 → 按需查询
 * - CPU占用：从持续轮询 → 按需唤醒
 */
export class PriorityQueueScheduler {
  private static instance: PriorityQueueScheduler;
  private isRunning = false;
  private taskQueue: PriorityQueue<ScheduledTaskInfo>;
  private currentTimer?: NodeJS.Timeout;
  private taskMap: Map<string, ScheduledTaskInfo> = new Map(); // taskUuid -> task info

  constructor(
    private prisma: PrismaClient,
    private eventBus: any,
  ) {
    this.taskQueue = new PriorityQueue<ScheduledTaskInfo>();
    logger.info('优先队列调度器已创建');
  }

  /**
   * 获取单例实例
   */
  public static getInstance(prisma: PrismaClient, eventBus: any): PriorityQueueScheduler {
    if (!this.instance) {
      this.instance = new PriorityQueueScheduler(prisma, eventBus);
    }
    return this.instance;
  }

  /**
   * 启动调度器
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('调度器已在运行中，忽略启动请求');
      return;
    }

    this.isRunning = true;
    logger.info('🚀 优先队列调度器启动');

    // 1. 从数据库加载所有待执行任务
    await this.loadPendingTasks();

    // 2. 开始调度循环
    this.scheduleNext();

    logger.info('✅ 调度器启动成功', {
      pendingTasks: this.taskQueue.size,
      nextExecution: this.getNextExecutionTime(),
    });
  }

  /**
   * 停止调度器
   */
  public stop(): void {
    if (this.currentTimer) {
      clearTimeout(this.currentTimer);
      this.currentTimer = undefined;
    }

    this.isRunning = false;
    this.taskQueue.clear();
    this.taskMap.clear();

    logger.info('🛑 调度器已停止');
  }

  /**
   * 从数据库加载待执行任务
   */
  private async loadPendingTasks(): Promise<void> {
    try {
      const now = new Date();
      logger.debug('开始加载待执行任务', { currentTime: now.toISOString() });

      // 查询所有启用的待执行任务
      const tasks = await this.prisma.scheduleTask.findMany({
        where: {
          enabled: true,
          status: 'pending',
        },
        orderBy: {
          nextRunAt: 'asc',
        },
      });

      logger.info('从数据库加载任务', {
        totalTasks: tasks.length,
        currentTime: now.toISOString(),
      });

      // 添加到优先队列
      for (const task of tasks) {
        await this.addTaskToQueue(task);
      }

      logger.info('任务加载完成', {
        queueSize: this.taskQueue.size,
        taskMapSize: this.taskMap.size,
        nextExecution: this.getNextExecutionTime(),
      });
    } catch (error) {
      logger.error('加载任务失败', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  /**
   * 添加任务到队列
   */
  private async addTaskToQueue(task: any): Promise<void> {
    try {
      // 解析任务数据
      const payload = typeof task.payload === 'string' ? JSON.parse(task.payload) : task.payload;
      const alertConfig =
        typeof task.alertConfig === 'string' ? JSON.parse(task.alertConfig) : task.alertConfig;
      const recurrence = task.recurrence
        ? typeof task.recurrence === 'string'
          ? JSON.parse(task.recurrence)
          : task.recurrence
        : null;

      const taskInfo: ScheduledTaskInfo = {
        uuid: task.uuid,
        accountUuid: task.accountUuid,
        title: task.title,
        taskType: task.taskType,
        priority: task.priority,
        nextRunAt: new Date(task.nextRunAt),
        nextScheduledAt: task.nextScheduledAt ? new Date(task.nextScheduledAt) : undefined,
        payload,
        alertConfig,
        recurrence,
        executionCount: task.executionCount || 0,
        executionCount: task.executionCount || 0,
      };

      // 确定执行时间
      const executionTime = taskInfo.nextScheduledAt || taskInfo.nextRunAt;
      const executionTimestamp = executionTime.getTime();

      // 添加到队列
      this.taskQueue.enqueue(taskInfo, executionTimestamp);
      this.taskMap.set(task.uuid, taskInfo);

      logger.debug('任务已添加到队列', {
        taskUuid: task.uuid,
        taskTitle: task.title,
        executionTime: executionTime.toISOString(),
        queueSize: this.taskQueue.size,
      });
    } catch (error) {
      logger.error('添加任务到队列失败', {
        taskUuid: task.uuid,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 调度下一个任务
   */
  private scheduleNext(): void {
    if (!this.isRunning) {
      logger.debug('调度器未运行，跳过调度');
      return;
    }

    // 清除现有定时器
    if (this.currentTimer) {
      clearTimeout(this.currentTimer);
      this.currentTimer = undefined;
    }

    // 检查队列是否为空
    if (this.taskQueue.isEmpty()) {
      logger.debug('队列为空，等待新任务', {
        queueSize: 0,
      });

      // 设置一个定时器定期重新加载任务（避免错过新任务）
      this.currentTimer = setTimeout(() => {
        this.reloadTasks();
      }, 60000); // 1分钟后重新加载
      return;
    }

    // 查看下一个任务
    const next = this.taskQueue.peek();
    if (!next) {
      logger.debug('无法获取下一个任务');
      return;
    }

    const now = Date.now();
    const delay = next.priority - now;

    logger.debug('准备调度下一个任务', {
      taskUuid: next.value.uuid,
      taskTitle: next.value.title,
      executionTime: new Date(next.priority).toISOString(),
      delay: delay > 0 ? `${delay}ms` : '立即执行',
      queueSize: this.taskQueue.size,
    });

    if (delay <= 0) {
      // 立即执行
      this.executeNextTask();
    } else {
      // 延迟执行
      // 使用 Math.min 限制最大延迟时间（防止 setTimeout 溢出）
      const safeDelay = Math.min(delay, 2147483647); // 2^31 - 1
      this.currentTimer = setTimeout(() => {
        this.executeNextTask();
      }, safeDelay);

      logger.info('⏰ 定时器已设置', {
        taskUuid: next.value.uuid,
        taskTitle: next.value.title,
        delay: `${safeDelay}ms`,
        executionTime: new Date(next.priority).toISOString(),
      });
    }
  }

  /**
   * 执行下一个任务
   */
  private async executeNextTask(): Promise<void> {
    try {
      // 从队列中取出任务
      const taskInfo = this.taskQueue.dequeue();
      if (!taskInfo) {
        logger.warn('队列为空，无任务可执行');
        this.scheduleNext();
        return;
      }

      logger.info('🎯 开始执行任务', {
        taskUuid: taskInfo.uuid,
        taskTitle: taskInfo.title,
        taskType: taskInfo.taskType,
        priority: taskInfo.priority,
        queueSize: this.taskQueue.size,
      });

      // 从映射中移除
      this.taskMap.delete(taskInfo.uuid);

      // 执行任务
      await this.executeTask(taskInfo);

      logger.info('✅ 任务执行成功', {
        taskUuid: taskInfo.uuid,
        taskTitle: taskInfo.title,
      });
    } catch (error) {
      logger.error('❌ 任务执行失败', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    } finally {
      // 调度下一个任务
      this.scheduleNext();
    }
  }

  /**
   * 执行单个任务
   */
  private async executeTask(taskInfo: ScheduledTaskInfo): Promise<void> {
    const now = new Date();

    try {
      logger.debug('执行任务详情', {
        taskUuid: taskInfo.uuid,
        taskTitle: taskInfo.title,
        taskType: taskInfo.taskType,
        executionCount: taskInfo.executionCount,
      });

      // 创建执行记录
      await this.prisma.scheduleExecution.create({
        data: {
          taskUuid: taskInfo.uuid,
          accountUuid: taskInfo.accountUuid,
          status: 'completed',
          startedAt: now,
          completedAt: now,
          duration: 100,
          result: { success: true, message: '提醒已发送' },
        },
      });

      // 🎯 发布任务触发事件
      const taskTriggeredEvent = new TaskTriggeredEvent(
        taskInfo.uuid,
        taskInfo.payload.sourceType || 'unknown',
        taskInfo.payload.sourceId || taskInfo.uuid,
        taskInfo.accountUuid,
        taskInfo.payload,
      );

      await getEventBus().publish([taskTriggeredEvent]);

      logger.info('📢 任务触发事件已发布', {
        eventType: TaskTriggeredEvent.EVENT_TYPE,
        taskUuid: taskInfo.uuid,
        sourceType: taskInfo.payload.sourceType,
      });

      // 更新任务状态
      const updateData: any = {
        executionCount: { increment: 1 },
        lastExecutedAt: now,
        executionCount: 0, // 成功后重置失败计数
      };

      // 计算下次执行时间
      if (taskInfo.recurrence && taskInfo.recurrence.type !== 'NONE') {
        const nextTime = this.calculateNextExecution(
          taskInfo.nextRunAt,
          taskInfo.recurrence,
          now,
        );

        if (nextTime) {
          updateData.nextScheduledAt = nextTime;

          logger.info('🔄 计算下次执行时间', {
            taskUuid: taskInfo.uuid,
            recurrenceType: taskInfo.recurrence.type,
            nextExecutionTime: nextTime.toISOString(),
          });

          // 重新加载更新后的任务到队列
          const updatedTask = await this.prisma.scheduleTask.update({
            where: { uuid: taskInfo.uuid },
            data: updateData,
          });

          // 添加回队列
          await this.addTaskToQueue(updatedTask);
        } else {
          updateData.status = 'completed';
          await this.prisma.scheduleTask.update({
            where: { uuid: taskInfo.uuid },
            data: updateData,
          });

          logger.debug('无下次执行时间，任务标记为完成', {
            taskUuid: taskInfo.uuid,
          });
        }
      } else {
        // 一次性任务，标记为完成
        updateData.status = 'completed';
        await this.prisma.scheduleTask.update({
          where: { uuid: taskInfo.uuid },
          data: updateData,
        });

        logger.debug('一次性任务执行完成', {
          taskUuid: taskInfo.uuid,
        });
      }
    } catch (error) {
      logger.error('任务执行过程中发生错误', {
        taskUuid: taskInfo.uuid,
        error: error instanceof Error ? error.message : String(error),
      });

      // 更新失败计数
      await this.prisma.scheduleTask.update({
        where: { uuid: taskInfo.uuid },
        data: {
          executionCount: { increment: 1 },
          lastExecutedAt: now,
          status: taskInfo.executionCount >= 2 ? 'failed' : 'pending',
        },
      });

      throw error;
    }
  }

  /**
   * 计算下次执行时间
   */
  private calculateNextExecution(
    nextRunAt: Date,
    recurrence: any,
    currentTime: Date,
  ): Date | null {
    if (!recurrence || recurrence.type === 'NONE') {
      return null;
    }

    const scheduled = new Date(nextRunAt);
    const interval = recurrence.interval || 1;

    switch (recurrence.type) {
      case 'DAILY':
        const nextDaily = new Date(currentTime);
        nextDaily.setDate(nextDaily.getDate() + interval);
        nextDaily.setHours(scheduled.getHours(), scheduled.getMinutes(), scheduled.getSeconds(), 0);
        return nextDaily;

      case 'WEEKLY':
        const nextWeekly = new Date(currentTime);
        nextWeekly.setDate(nextWeekly.getDate() + interval * 7);
        nextWeekly.setHours(
          scheduled.getHours(),
          scheduled.getMinutes(),
          scheduled.getSeconds(),
          0,
        );
        return nextWeekly;

      case 'MONTHLY':
        const nextMonthly = new Date(currentTime);
        nextMonthly.setMonth(nextMonthly.getMonth() + interval);
        nextMonthly.setHours(
          scheduled.getHours(),
          scheduled.getMinutes(),
          scheduled.getSeconds(),
          0,
        );
        return nextMonthly;

      case 'YEARLY':
        const nextYearly = new Date(currentTime);
        nextYearly.setFullYear(nextYearly.getFullYear() + interval);
        nextYearly.setHours(
          scheduled.getHours(),
          scheduled.getMinutes(),
          scheduled.getSeconds(),
          0,
        );
        return nextYearly;

      case 'CUSTOM':
        if (recurrence.cronExpression) {
          // 简化实现：支持常见的 cron 表达式
          if (recurrence.cronExpression === '* * * * *') {
            const nextMinute = new Date(currentTime);
            nextMinute.setMinutes(nextMinute.getMinutes() + 1);
            nextMinute.setSeconds(0, 0);
            return nextMinute;
          }
          // TODO: 完整的 cron 解析
        }
        break;

      default:
        logger.warn('不支持的重复类型', {
          recurrenceType: recurrence.type,
        });
        return null;
    }

    return null;
  }

  /**
   * 重新加载任务
   */
  private async reloadTasks(): Promise<void> {
    logger.debug('重新加载任务');
    await this.loadPendingTasks();
    this.scheduleNext();
  }

  /**
   * 动态添加新任务（外部调用）
   */
  public async addTask(taskUuid: string): Promise<void> {
    try {
      logger.info('动态添加任务', { taskUuid });

      const task = await this.prisma.scheduleTask.findUnique({
        where: { uuid: taskUuid },
      });

      if (!task) {
        logger.warn('任务不存在', { taskUuid });
        return;
      }

      if (!task.enabled || task.status !== 'pending') {
        logger.debug('任务不符合调度条件', {
          taskUuid,
          enabled: task.enabled,
          status: task.status,
        });
        return;
      }

      // 检查是否已在队列中
      if (this.taskMap.has(taskUuid)) {
        logger.debug('任务已在队列中', { taskUuid });
        return;
      }

      // 添加到队列
      await this.addTaskToQueue(task);

      // 重新调度（可能需要更新定时器）
      this.scheduleNext();

      logger.info('任务已添加并重新调度', {
        taskUuid,
        queueSize: this.taskQueue.size,
      });
    } catch (error) {
      logger.error('添加任务失败', {
        taskUuid,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 动态移除任务（外部调用）
   */
  public removeTask(taskUuid: string): void {
    try {
      logger.info('动态移除任务', { taskUuid });

      // 从映射中移除
      this.taskMap.delete(taskUuid);

      // 从队列中移除
      const removed = this.taskQueue.remove((task) => task.uuid === taskUuid);

      if (removed) {
        logger.info('任务已从队列移除', {
          taskUuid,
          queueSize: this.taskQueue.size,
        });

        // 如果移除的是下一个要执行的任务，重新调度
        this.scheduleNext();
      } else {
        logger.debug('任务不在队列中', { taskUuid });
      }
    } catch (error) {
      logger.error('移除任务失败', {
        taskUuid,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 获取调度器状态
   */
  public getStatus(): {
    isRunning: boolean;
    queueSize: number;
    nextExecution?: string;
    tasksInQueue: string[];
  } {
    return {
      isRunning: this.isRunning,
      queueSize: this.taskQueue.size,
      nextExecution: this.getNextExecutionTime(),
      tasksInQueue: this.taskQueue.toArray().map((t) => t.uuid),
    };
  }

  /**
   * 获取下次执行时间
   */
  private getNextExecutionTime(): string | undefined {
    const next = this.taskQueue.peek();
    return next ? new Date(next.priority).toISOString() : undefined;
  }
}
