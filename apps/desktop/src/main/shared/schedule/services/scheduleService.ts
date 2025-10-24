import nodeSchedule from 'node-schedule';
import { BrowserWindow } from 'electron';

export interface ScheduleTask {
  type: string;
  payload: any;
}

export interface ScheduleOptions {
  uuid: string;
  cron?: string;
  dateTime?: Date;
  task: ScheduleTask;
}

export interface ScheduleResult {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * 主进程调度服务
 * 提供直接的调度功能，无需通过IPC
 */
export class ScheduleService {
  private static instance: ScheduleService;
  private scheduleJobs = new Map<string, nodeSchedule.Job>();

  static getInstance(): ScheduleService {
    if (!this.instance) {
      this.instance = new ScheduleService();
    }
    return this.instance;
  }

  private constructor() {}

  private getValidWindow(): BrowserWindow | null {
    const windows = BrowserWindow.getAllWindows();
    return windows.find((win) => !win.isDestroyed()) || null;
  }

  /**
   * 创建定时任务
   */
  async createSchedule(options: ScheduleOptions): Promise<ScheduleResult> {
    try {
      // 如果已存在相同ID的任务，先删除
      if (this.scheduleJobs.has(options.uuid)) {
        this.cancelSchedule(options.uuid);
      }

      let job: nodeSchedule.Job;

      if (options.cron) {
        // 使用 cron 表达式
        job = nodeSchedule.scheduleJob(options.cron, () => {
          this.executeTask(options.uuid, options.task);
        });
      } else if (options.dateTime) {
        // 使用具体时间
        job = nodeSchedule.scheduleJob(options.dateTime, () => {
          this.executeTask(options.uuid, options.task);
        });
      } else {
        return {
          success: false,
          message: '必须提供 cron 表达式或具体时间',
        };
      }

      if (!job) {
        return {
          success: false,
          message: '调度任务创建失败',
        };
      }

      this.scheduleJobs.set(options.uuid, job);
      return {
        success: true,
        message: `调度任务 ${options.uuid} 创建成功`,
      };
    } catch (error) {
      console.error('Failed to create schedule:', error);
      return {
        success: false,
        message: `调度任务创建失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 取消定时任务
   */
  cancelSchedule(uuid: string): ScheduleResult {
    try {
      const job = this.scheduleJobs.get(uuid);
      if (job) {
        job.cancel();
        this.scheduleJobs.delete(uuid);
        return {
          success: true,
          message: `调度任务 ${uuid} 已取消`,
        };
      }
      return {
        success: false,
        message: `调度任务 ${uuid} 不存在`,
      };
    } catch (error) {
      return {
        success: false,
        message: `取消调度任务失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 更新定时任务
   */
  async updateSchedule(options: ScheduleOptions): Promise<ScheduleResult> {
    // 先取消现有任务，再创建新任务
    this.cancelSchedule(options.uuid);
    return this.createSchedule(options);
  }

  /**
   * 获取所有调度任务ID
   */
  getScheduleIds(): string[] {
    return Array.from(this.scheduleJobs.keys());
  }

  /**
   * 获取调度任务信息
   */
  getScheduleInfo(uuid: string): {
    exists: boolean;
    nextInvocation: Date | null;
  } {
    const job = this.scheduleJobs.get(uuid);
    if (!job) {
      return { exists: false, nextInvocation: null };
    }

    return {
      exists: true,
      nextInvocation: job.nextInvocation(),
    };
  }

  /**
   * 执行任务并通知渲染进程
   */
  private executeTask(uuid: string, task: ScheduleTask): void {
    const win = this.getValidWindow();
    if (win) {
      try {
        win.webContents.send('schedule-triggered', {
          uuid,
          task,
        });
      } catch (error) {
        console.error('Failed to send schedule-triggered event:', error);
      }
    }

    // 如果是一次性任务，执行后清理
    if (this.scheduleJobs.has(uuid)) {
      const job = this.scheduleJobs.get(uuid);
      if (job && !job.nextInvocation()) {
        this.scheduleJobs.delete(uuid);
      }
    }
  }

  /**
   * 清理所有调度任务
   */
  cleanup(): void {
    for (const [_uuid, job] of this.scheduleJobs) {
      job.cancel();
    }
    this.scheduleJobs.clear();
  }
}

export const scheduleService = ScheduleService.getInstance();
