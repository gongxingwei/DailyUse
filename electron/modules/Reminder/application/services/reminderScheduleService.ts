import nodeSchedule from "node-schedule";
import { notificationService } from "@electron/shared/notification";
import { ImportanceLevel } from "@/shared/types/importance";
import type { RecurrenceRule } from "node-schedule";
export interface ReminderPayload {
    uuid: string;
  title: string;
  body: string;
  importanceLevel: ImportanceLevel;
}

export class ReminderScheduleService {
  private static instance: ReminderScheduleService;
  private scheduleJobs = new Map<string, nodeSchedule.Job>();

  static getInstance(): ReminderScheduleService {
    if (!this.instance) {
      this.instance = new ReminderScheduleService();
    }
    return this.instance;
  }

  private constructor() {}

  /**
   * 创建定时提醒任务
   */
  async createReminderScheduleByDate(
    date: Date,
    payload: ReminderPayload
  ): Promise<void> {
    try {
      // 如果已存在相同ID的任务，先删除
      if (this.scheduleJobs.has(payload.uuid)) {
        this.cancelReminderSchedule(payload.uuid);
      }

      let job: nodeSchedule.Job;
      job = nodeSchedule.scheduleJob(date, () => {
        // 执行提醒任务
        notificationService.showNotification({
          uuid: payload.uuid,
          title: payload.title,
          body: payload.body,
          importance: payload.importanceLevel,
        });
      });
      
    } catch (error) {
      console.error("ReminderScheduleService - createReminder Error:", error);
    }
  }

  async createReminderScheduleByCron(
    cron: string,
    payload: ReminderPayload
  ): Promise<void> {
    try {
      // 如果已存在相同ID的任务，先删除
      if (this.scheduleJobs.has(payload.uuid)) {
        this.cancelReminderSchedule(payload.uuid);
      }

      let job: nodeSchedule.Job;
      job = nodeSchedule.scheduleJob(cron, () => {
        // 执行提醒任务
        console.log("【ReminderScheduleService】触发提醒任务:", payload);
        notificationService.showNotification({
          uuid: payload.uuid,
          title: payload.title,
          body: payload.body,
          importance: payload.importanceLevel,
        });
      });
      
    } catch (error) {
      console.error("ReminderScheduleService - createReminder Error:", error);

    }
  }

  /**
   * 
   * @param id 
   * @param rule 
   * @param payload 
   */
  async createReminderScheduleByRule(
    rule: RecurrenceRule,
    payload: ReminderPayload
  ): Promise<void> {
    try {
      // 如果已存在相同ID的任务，先删除
      if (this.scheduleJobs.has(payload.uuid)) {
        this.cancelReminderSchedule(payload.uuid);
      }

      let job: nodeSchedule.Job;
      job = nodeSchedule.scheduleJob(payload.uuid, rule, () => {
        // 执行提醒任务
        notificationService.showNotification({
          uuid: payload.uuid,
          title: payload.title,
          body: payload.body,
          importance: payload.importanceLevel,
        });
      });
      
    } catch (error) {
      console.error("ReminderScheduleService - createReminder Error:", error);

    }
  }
  /**
   * 取消定时任务
   */
  cancelReminderSchedule(uuid: string): void {
    try {
      const job = this.scheduleJobs.get(uuid);
      if (job) {
        job.cancel();
        this.scheduleJobs.delete(uuid);

      }

    } catch (error) {
      console.error("ReminderScheduleService - cancelReminder Error:", error);
    }
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
}

export const reminderScheduleService = ReminderScheduleService.getInstance();