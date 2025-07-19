import { ScheduleOptions } from "../types/schedule";

/**
 * 定时任务 API 层 - 负责与主进程通信
 */
export class ScheduleIpcClient {
  private static instance: ScheduleIpcClient;
  private constructor() {}

  static getInstance(): ScheduleIpcClient {
    if (!this.instance) {
      this.instance = new ScheduleIpcClient();
    }
    return this.instance;
  }
  /**
   * 创建定时任务
   */
  async createSchedule(options: ScheduleOptions): Promise<boolean> {
    return await window.shared.ipcRenderer.invoke("create-schedule", options);
  }

  /**
   * 更新定时任务
   */
  async updateSchedule(options: ScheduleOptions): Promise<boolean> {
    return await window.shared.ipcRenderer.invoke("update-schedule", options);
  }

  /**
   * 取消定时任务
   */
  async cancelSchedule(id: string): Promise<boolean> {
    return await window.shared.ipcRenderer.invoke("cancel-schedule", id);
  }

  /**
   * 获取所有定时任务
   */
  async getSchedules(): Promise<string[]> {
    return await window.shared.ipcRenderer.invoke("get-schedules");
  }
}

export const scheduleIpcClient = ScheduleIpcClient.getInstance();
